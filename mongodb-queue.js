/**
 *
 * mongodb-queue.js - Use your existing MongoDB as a local queue.
 *
 * Copyright (c) 2014 Andrew Chilton
 * - http://chilts.org/
 * - andychilton@gmail.com
 *
 * License: http://chilts.mit-license.org/2014/
 *
 **/

var crypto = require('crypto')

// some helper functions
function id() {
    return crypto.randomBytes(16).toString('hex')
}

function now() {
    return (new Date()).toISOString()
}

function nowPlusSecs(secs) {
    return (new Date(Date.now() + secs * 1000)).toISOString()
}

module.exports = function(db, name, opts) {
    return new Queue(db, name, opts)
}

// the Queue object itself
function Queue(db, name, opts) {
    if ( !db ) {
        throw new Error("mongodb-queue: provide a mongodb.MongoClient.db")
    }
    if ( !name ) {
        throw new Error("mongodb-queue: provide a queue name")
    }
    opts = opts || {}

    this.db = db
    this.name = name
    this.col = db.collection(name)
    this.visibility = opts.visibility || 30
    this.delay = opts.delay || 0

    if ( opts.deadQueue ) {
        this.deadQueue = opts.deadQueue
        this.maxRetries = opts.maxRetries || 5
    }
}

Queue.prototype.createIndexes = async function(callback) {
    try {
        var self = this

        var [indexname] = await Promise.all([
            self.col.createIndex({ deleted : 1, visible : 1 }),
            self.col.createIndex({ ack : 1 }, { unique : true, sparse : true })
        ]);

        if(callback) return callback(null, indexname);;
        return indexname;
    } catch (err) {
        if(callback) return callback(err);
        throw err;
    }
}

Queue.prototype.add = async function(payload, opts, callback) {
    try {
        var self = this
        if ( !callback && typeof opts === 'function') {
            callback = opts
            opts = {}
        }
        if (!opts) {
            opts = {};
        }
        var delay = opts.delay || self.delay
        var visible = delay ? nowPlusSecs(delay) : now()

        var msgs = []
        if (payload instanceof Array) {
            if (payload.length === 0) {
                var errMsg = 'Queue.add(): Array payload length must be greater than 0'
                if (callback) {
                    return callback(new Error(errMsg))
                }
                throw new Error(errMsg);
            }
            payload.forEach(function(payload) {
                msgs.push({
                    visible  : visible,
                    payload  : payload,
                })
            })
        } else {
            msgs.push({
                visible  : visible,
                payload  : payload,
            })
        }

        var results = await self.col.insertMany(msgs);
        if (callback) {
            if (payload instanceof Array) return callback(null, '' + results.insertedIds)
            return callback(null, '' + results.ops[0]._id)
        }
        if (payload instanceof Array) return '' + results.insertedIds;
        return '' + results.ops[0]._id;
    } catch (err) {
        if(callback) return callback(err);
        throw err;
    }
}

Queue.prototype.get = async function(opts, callback) {
    try {
        var self = this
        if ( !callback && typeof opts === 'function') {
            callback = opts
            opts = {}
        }
        if (!opts) {
            opts = {};
        }

        var visibility = opts.visibility || self.visibility
        var query = {
            deleted : null,
            visible : { $lte : now() },
        }
        var sort = {
            _id : 1
        }
        var update = {
            $inc : { tries : 1 },
            $set : {
                ack     : id(),
                visible : nowPlusSecs(visibility),
            }
        }

        var result = await self.col.findOneAndUpdate(query, update, { sort: sort, returnOriginal : false });
        var msg = result.value
        if (!msg) {
            if(callback) return callback();
            return;
        }

        // convert to an external representation
        msg = {
            // convert '_id' to an 'id' string
            id      : '' + msg._id,
            ack     : msg.ack,
            payload : msg.payload,
            tries   : msg.tries,
        }
        // if we have a deadQueue, then check the tries, else don't
        if ( self.deadQueue ) {
            // check the tries
            if ( msg.tries > self.maxRetries ) {
                // So:
                // 1) add this message to the deadQueue
                // 2) ack this message from the regular queue
                // 3) call ourself to return a new message (if exists)
                await self.deadQueue.add(msg);
                await self.ack(msg.ack);
                msg = await self.get();
                if (callback) return callback(null, msg);
                return msg;
            }
        }

        if(callback) return callback(null, msg)
        return msg;
    } catch (err) {
        if(callback) return callback(err);
        throw err;
    }
}

Queue.prototype.ping = async function(ack, opts, callback) {
    try {
        var self = this
        if ( !callback && typeof opts === 'function') {
            callback = opts
            opts = {}
        }
        if (!opts) {
            opts = {};
        }

        var visibility = opts.visibility || self.visibility
        var query = {
            ack     : ack,
            visible : { $gt : now() },
            deleted : null,
        }
        var update = {
            $set : {
                visible : nowPlusSecs(visibility)
            }
        }
        var msg = await self.col.findOneAndUpdate(query, update, { returnOriginal : false });
        if ( !msg.value ) {
            if (callback) return callback(new Error("Queue.ping(): Unidentified ack  : " + ack));
            throw new Error("Queue.ping(): Unidentified ack  : " + ack);
        }
        if (callback) return callback(null, '' + msg.value._id);
        return '' + msg.value._id;
    } catch (err) {
        if(callback) {
            return callback(err);
        }
        throw err;
    }
}

Queue.prototype.ack = async function(ack, callback) {
    try {
        var self = this

        var query = {
            ack     : ack,
            visible : { $gt : now() },
            deleted : null,
        }
        var update = {
            $set : {
                deleted : now(),
            }
        }
        var msg = await self.col.findOneAndUpdate(query, update, { returnOriginal : false });
        if ( !msg.value ) {
            if (callback) return callback(new Error("Queue.ack(): Unidentified ack : " + ack));
            throw new Error("Queue.ack(): Unidentified ack : " + ack);
        }
        if (callback) return callback(null, '' + msg.value._id);
        return '' + msg.value._id;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}

Queue.prototype.clean = async function(callback) {
    try {
        var self = this

        var query = {
            deleted : { $exists : true },
        }

        var result = await self.col.deleteMany(query)
        if(callback) return callback(null, result);
        return result;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}

Queue.prototype.total = async function(callback) {
    try {
        var self = this

        var count = await self.col.countDocuments();
        if (callback) return callback(null, count);
        return count;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}

Queue.prototype.size = async function(callback) {
    try {
        var self = this

        var query = {
            deleted : null,
            visible : { $lte : now() },
        }

        var count = await self.col.countDocuments(query);
        if (callback) return callback(null, count);
        return count;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}

Queue.prototype.inFlight = async function(callback) {
    try {
        var self = this

        var query = {
            ack     : { $exists : true },
            visible : { $gt : now() },
            deleted : null,
        }

        var count = await self.col.countDocuments(query);
        if (callback) return callback(null, count);
        return count;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}

Queue.prototype.done = async function(callback) {
    try {
        var self = this

        var query = {
            deleted : { $exists : true },
        }

        var count = await self.col.countDocuments(query);
        if (callback) return callback(null, count);
        return count;
    } catch(err) {
        if(callback) callback(err);
        throw err;
    }
}
