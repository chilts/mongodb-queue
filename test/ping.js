var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

    test('ping: check a retrieved message with a ping can still be acked', function(t) {
        var queue = mongoDbQueue(db, 'ping', { visibility : 5 })
        var msg

        async.series(
            [
                function(next) {
                    queue.add('Hello, World!', function(err, id) {
                        t.ok(!err, 'There is no error when adding a message.')
                        t.ok(id, 'There is an id returned when adding a message.')
                        next()
                    })
                },
                function(next) {
                    // get something now and it shouldn't be there
                    queue.get(function(err, thisMsg) {
                        msg = thisMsg
                        t.ok(!err, 'No error when getting this message')
                        t.ok(msg.id, 'Got this message id')
                        // now wait 4s
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    // ping this message so it will be kept alive longer, another 5s
                    queue.ping(msg.ack, function(err, id) {
                        t.ok(!err, 'No error when pinging a message')
                        t.ok(id, 'Received an id when acking this message')
                        // now wait 4s
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    queue.ack(msg.ack, function(err, id) {
                        t.ok(!err, 'No error when acking this message')
                        t.ok(id, 'Received an id when acking this message')
                        next()
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        t.ok(!err, 'No error when getting no messages')
                        t.ok(!msg, 'No message when getting from an empty queue')
                        next()
                    })
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test("ping: check that an acked message can't be pinged", function(t) {
        var queue = mongoDbQueue(db, 'ping', { visibility : 5 })
        var msg

        async.series(
            [
                function(next) {
                    queue.add('Hello, World!', function(err, id) {
                        t.ok(!err, 'There is no error when adding a message.')
                        t.ok(id, 'There is an id returned when adding a message.')
                        next()
                    })
                },
                function(next) {
                    // get something now and it shouldn't be there
                    queue.get(function(err, thisMsg) {
                        msg = thisMsg
                        t.ok(!err, 'No error when getting this message')
                        t.ok(msg.id, 'Got this message id')
                        next()
                    })
                },
                function(next) {
                    // ack the message
                    queue.ack(msg.ack, function(err, id) {
                        t.ok(!err, 'No error when acking this message')
                        t.ok(id, 'Received an id when acking this message')
                        next()
                    })
                },
                function(next) {
                    // ping this message, even though it has been acked
                    queue.ping(msg.ack, function(err, id) {
                        t.ok(err, 'Error when pinging an acked message')
                        t.ok(!id, 'Received no id when pinging an acked message')
                        next()
                    })
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

test("ping: check visibility option overrides the queue visibility", function(t) {
        var queue = mongoDbQueue(db, 'ping', { visibility : 3 })
        var msg

        async.series(
            [
                function(next) {
                    queue.add('Hello, World!', function(err, id) {
                        t.ok(!err, 'There is no error when adding a message.')
                        t.ok(id, 'There is an id returned when adding a message.')
                        next()
                    })
                },
                function(next) {
                    queue.get(function(err, thisMsg) {
                        msg = thisMsg
                        // message should reset in three seconds
                        t.ok(msg.id, 'Got a msg.id (sanity check)')
                        setTimeout(next, 2 * 1000)
                    })
                },
                function(next) {
                    // ping this message so it will be kept alive longer, another 5s instead of 3s
                    queue.ping(msg.ack, { visibility: 5 }, function(err, id) {
                        t.ok(!err, 'No error when pinging a message')
                        t.ok(id, 'Received an id when acking this message')
                        // wait 4s so the msg would normally have returns to the queue
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // messages should not be back yet
                        t.ok(!err, 'No error when getting no messages')
                        t.ok(!msg, 'No msg received')
                        // wait 2s so the msg should have returns to the queue
                        setTimeout(next, 2 * 1000)
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // yes, there should be a message on the queue again
                        t.ok(msg.id, 'Got a msg.id (sanity check)')
                        queue.ack(msg.ack, function(err) {
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
                }
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test('db.close()', function(t) {
        t.pass('db.close()')
        db.close()
        t.end()
    })

})
