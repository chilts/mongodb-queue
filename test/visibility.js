var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var Queue = require('../')

setup(function(db) {

    test('visibility: check message is back in queue after 3s', function(t) {
        var queue = new Queue(db, 'visibility', { visibility : 3 })

        async.series(
            [
                function(next) {
                    queue.add('Hello, World!', function(err) {
                        t.ok(!err, 'There is no error when adding a message.')
                        next()
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // wait over 3s so the msg returns to the queue
                        t.ok(msg.id, 'Got a msg.id (sanity check)')
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // yes, there should be a message on the queue again
                        t.ok(msg.id, 'Got a msg.id (sanity check)')
                        queue.ack(msg.id, msg.ack, function(err) {
                            t.ok(!err, 'No error when acking the message')
                            next()
                        })
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // no more messages
                        t.ok(!err, 'No error when getting no messages')
                        t.ok(!msg, 'No msg received')
                        next()
                    })
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
                db.close()
            }
        )

    })
})
