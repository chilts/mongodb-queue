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

// the Queue object itself
function Queue(mongoDbClient, queueName, opts) {
    if (!(this instanceof Queue)) {
        return new Queue(mongoDbClient, queueName, opts)
    }

    if ( !queueName ) {
        throw new Error("mongodb-queue: provide a queueName")
    }
    opts = opts || {}

    // set some defaults
    opts.collectionName = opts.collectionName || 'msgs'

    // this.db = mongoDbClient
    this.msgs = mongoDbClient.collection(opts.collectionName)
    this.queueName = queueName
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
        queue    : self.queueName,
        visible  : delayDate || aDate,
        payload  : payload,
    }
    self.msgs.insert(msg, function(err, results) {
        if (err) return callback(err)
        callback(null, results[0]._id)
    })
}

Queue.prototype.get = function(callback) {
    var self = this

    var query = {
        queue   : self.queueName,
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

    self.msgs.findAndModify(query, sort, update, { new : true }, function(err, msg) {
        if (err) return callback(err)
        if (!msg) return callback()
        callback(null, {
            // convert _id to string
            _id     : '' + msg._id,
            ack     : msg.ack,
            payload : msg.payload,
            tries   : msg.tries,
        })
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
    self.msgs.findAndModify(query, undefined, update, { new : true }, function(err, msg, blah) {
        if (err) return callback(err)
        if ( !msg ) {
            return callback(new Error("Unidentified id/ack pair : " + id + '/' + ack))
        }
        callback(null, msg)
    })
}

module.exports = Queue
