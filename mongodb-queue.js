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

module.exports = function(mongoDbClient, name, opts) {
    return new Queue(mongoDbClient, name, opts)
}

// the Queue object itself
function Queue(mongoDbClient, name, opts) {
    if ( !mongoDbClient ) {
        throw new Error("mongodb-queue: provide a mongodb.MongoClient")
    }
    if ( !name ) {
        throw new Error("mongodb-queue: provide a queue name")
    }
    opts = opts || {}

    this.name = name
    this.col = mongoDbClient.collection(name)
    this.visibility = opts.visibility || 30
    this.delay = opts.delay || 0

    if ( opts.deadQueue ) {
        this.deadQueue = opts.deadQueue
        this.maxRetries = opts.maxRetries || 5
    }
}

Queue.prototype.createIndexes = function(callback) {
    var self = this

    self.col.createIndex({ deleted : 1, visible : 1 }, function(err, indexname) {
        if (err) return callback(err)
        self.col.createIndex({ ack : 1 }, { unique : true, sparse : true }, function(err) {
            if (err) return callback(err)
            callback(null, indexname)
        })
    })
}

Queue.prototype.add = function(payload, opts, callback) {
    var self = this
    if ( !callback ) {
        callback = opts
        opts = {}
    }
    var delay = opts.delay || self.delay
    var msg = {
        visible  : delay ? nowPlusSecs(delay) : now(),
        payload  : payload,
    }
    self.col.insertOne(msg, function(err, results) {
        if (err) return callback(err)
        callback(null, '' + results.ops[0]._id)
    })
}

Queue.prototype.get = function(opts, callback) {
    var self = this
    if ( !callback ) {
        callback = opts
        opts = {}
    }

    var visibility = opts.visibility || self.visibility
    var query = {
        deleted : null,
        visible : { $lt : now() },
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

    self.col.findOneAndUpdate(query, update, { sort: sort, returnOriginal : false }, function(err, result) {
        if (err) return callback(err)
        var msg = result.value
        if (!msg) return callback()

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
                self.deadQueue.add(msg, function(err) {
                    if (err) return callback(err)
                    self.ack(msg.ack, function(err) {
                        if (err) return callback(err)
                        self.get(callback)
                    })
                })
                return
            }
        }

        callback(null, msg)
    })
}

Queue.prototype.ping = function(ack, opts, callback) {
    var self = this
    if ( !callback ) {
        callback = opts
        opts = {}
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
    self.col.findOneAndUpdate(query, update, { returnOriginal : false }, function(err, msg, blah) {
        if (err) return callback(err)
        if ( !msg.value ) {
            return callback(new Error("Queue.ping(): Unidentified ack  : " + ack))
        }
        callback(null, '' + msg.value._id)
    })
}

Queue.prototype.ack = function(ack, callback) {
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
    self.col.findOneAndUpdate(query, update, { returnOriginal : false }, function(err, msg, blah) {
        if (err) return callback(err)
        if ( !msg.value ) {
            return callback(new Error("Queue.ack(): Unidentified ack : " + ack))
        }
        callback(null, '' + msg.value._id)
    })
}

Queue.prototype.clean = function(callback) {
    var self = this

    var query = {
        deleted : { $exists : true },
    }

    self.col.deleteMany(query, callback)
}

Queue.prototype.total = function(callback) {
    var self = this

    self.col.count(function(err, count) {
        if (err) return callback(err)
        callback(null, count)
    })
}

Queue.prototype.size = function(callback) {
    var self = this

    var query = {
        deleted : null,
        visible : { $lt : now() },
    }

    self.col.count(query, function(err, count) {
        if (err) return callback(err)
        callback(null, count)
    })
}

Queue.prototype.inFlight = function(callback) {
    var self = this

    var query = {
        ack     : { $exists : true },
        visible : { $gt : now() },
        deleted : null,
    }

    self.col.count(query, function(err, count) {
        if (err) return callback(err)
        callback(null, count)
    })
}

Queue.prototype.done = function(callback) {
    var self = this

    var query = {
        deleted : { $exists : true },
    }

    self.col.count(query, function(err, count) {
        if (err) return callback(err)
        callback(null, count)
    })
}
