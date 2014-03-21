/**
 *
 * mongodb-queue.js - Use your existing MongoDB as a local queue.
 *
 * Copyright (c) 2014 Andrew Chilton
 * - http://chilts.org/
 * - andychilton@gmail.com
 *
 * License: http://chilts.mit-license.org/2013/
 *
**/

var crypto = require('crypto')

// some helper functions
function id() {
    return crypto.randomBytes(16).toString('hex')
}
function date() {
    return (new Date()).toISOString()
}
function datePlus(date, s) {
    var delayDate = (new Date(date)).getTime() + s * 1000
    return (new Date(delayDate)).toISOString()
}

module.exports = function(mongoDbClient, name, opts, callback) {
    if ( !callback ) {
        callback = opts
        opts = {}
    }

    var queue = new Queue(mongoDbClient, name, opts)
    queue.col.ensureIndex({ visible : 1 }, function(err) {
        if (err) return callback(err)
        queue.col.ensureIndex({ ack : 1 }, { unique : true, sparse : true }, function(err) {
            if (err) return callback(err)
            callback(null, queue)
        })
    })
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
}

Queue.prototype.add = function(payload, callback) {
    var self = this
    var aDate = date()
    var delayDate
    if ( self.delay ) {
        delayDate = datePlus(aDate, self.delay)
    }
    var msg = {
        visible  : delayDate || aDate,
        payload  : payload,
    }
    self.col.insert(msg, function(err, results) {
        if (err) return callback(err)
        callback(null, '' + results[0]._id)
    })
}

Queue.prototype.get = function(callback) {
    var self = this

    var query = {
        visible : { $lt : date() },
        deleted : { $exists : false },
    }
    var sort = {
        visible : 1
    }
    var update = {
        $inc : { tries : 1 },
        $set : {
            ack     : id(),
            visible : (new Date(Date.now() + self.visibility * 1000)).toISOString(),
        }
    }

    self.col.findAndModify(query, sort, update, { new : true }, function(err, msg) {
        if (err) return callback(err)
        if (!msg) return callback()
        callback(null, {
            // convert '_id' to an 'id' string
            id      : '' + msg._id,
            ack     : msg.ack,
            payload : msg.payload,
            tries   : msg.tries,
        })
    })
}

Queue.prototype.ping = function(ack, callback) {
    var self = this

    var query = {
        ack : ack,
        visible : { $gt : date() },
    }
    var update = {
        $set : {
            visible : (new Date(Date.now() + self.visibility * 1000)).toISOString(),
        }
    }
    self.col.findAndModify(query, undefined, update, { new : true }, function(err, msg, blah) {
        if (err) return callback(err)
        if ( !msg ) {
            return callback(new Error("Queue.ping(): Unidentified ack  : " + ack))
        }
        callback(null, '' + msg._id)
    })
}

Queue.prototype.ack = function(ack, callback) {
    var self = this

    var query = {
        ack : ack,
        visible : { $gt : date() },
    }
    var update = {
        $set : {
            deleted : true,
        }
    }
    self.col.findAndModify(query, undefined, update, { new : true }, function(err, msg, blah) {
        if (err) return callback(err)
        if ( !msg ) {
            return callback(new Error("Queue.ack(): Unidentified ack : " + ack))
        }
        callback(null, '' + msg._id)
    })
}
