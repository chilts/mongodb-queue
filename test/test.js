var mongodb = require('mongodb')
var async = require('async')
var test = require('tape')
var Queue = require('../')

var setup = require('./setup.js')

var conStr = 'mongodb://localhost:27017/mongodb-queue'

setup(function(db) {

    test('first test', function(t) {
        var queue = Queue(db, 'test')
        t.ok(queue, 'Queue created ok')
        t.end()
    });

    test('single round trip', function(t) {
        var queue = Queue(db, 'test')

        var msg

        async.series(
            [
                function(next) {
                    queue.add('Hello, World!', function(err, id) {
                        t.ok(!err, 'There is no error when adding a message.')
                        t.ok(id, 'Received an id for this message')
                        next()
                    })
                },
                function(next) {
                    queue.get(function(err, thisMsg) {
                        msg = thisMsg
                        t.ok(msg.id, 'Got a msg.id')
                        t.equal(typeof msg.id, 'string', 'msg.id is a string')
                        t.ok(msg.ack, 'Got a msg.ack')
                        t.equal(typeof msg.ack, 'string', 'msg.ack is a string')
                        t.ok(msg.tries, 'Got a msg.tries')
                        t.equal(typeof msg.tries, 'number', 'msg.tries is a number')
                        t.equal(msg.tries, 1, 'msg.tries is currently one')
                        t.equal(msg.payload, 'Hello, World!', 'Payload is correct')
                        next()
                    })
                },
                function(next) {
                    queue.ack(msg.id, msg.ack, function(err) {
                        t.ok(!err, 'No error when acking the message')
                        next()
                    })
                },
            ],
            function(err) {
                t.ok(!err, 'No error during single round-trip test')
                t.end()
                db.close()
            }
        )
    })

})
