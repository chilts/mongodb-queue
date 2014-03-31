var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

    test('first test', function(t) {
        var queue = mongoDbQueue(db, 'stats')
        t.ok(queue, 'Queue created ok')
        t.end()
    });

    test('stats for a single message added, received and acked', function(t) {
        var queue = mongoDbQueue(db, 'stats1')
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
                    queue.total(function(err, count) {
                        t.equal(count, 1, 'Total number of messages is one')
                        next()
                    })
                },
                function(next) {
                    queue.size(function(err, count) {
                        t.equal(count, 1, 'Size of queue is one')
                        next()
                    })
                },
                function(next) {
                    queue.inFlight(function(err, count) {
                        t.equal(count, 0, 'There are no inFlight messages')
                        next()
                    })
                },
                function(next) {
                    queue.done(function(err, count) {
                        t.equal(count, 0, 'There are no done messages')
                        next()
                    })
                },
                function(next) {
                    // let's set one to be inFlight
                    queue.get(function(err, newMsg) {
                        msg = newMsg
                        next()
                    })
                },
                function(next) {
                    queue.total(function(err, count) {
                        t.equal(count, 1, 'Total number of messages is still one')
                        next()
                    })
                },
                function(next) {
                    queue.size(function(err, count) {
                        t.equal(count, 0, 'Size of queue is now zero (ie. none to come)')
                        next()
                    })
                },
                function(next) {
                    queue.inFlight(function(err, count) {
                        t.equal(count, 1, 'There is one inflight message')
                        next()
                    })
                },
                function(next) {
                    queue.done(function(err, count) {
                        t.equal(count, 0, 'There are still no done messages')
                        next()
                    })
                },
                function(next) {
                    // now ack that message
                    queue.ack(msg.ack, function(err, newMsg) {
                        msg = newMsg
                        next()
                    })
                },
                function(next) {
                    queue.total(function(err, count) {
                        t.equal(count, 1, 'Total number of messages is again one')
                        next()
                    })
                },
                function(next) {
                    queue.size(function(err, count) {
                        t.equal(count, 0, 'Size of queue is still zero (ie. none to come)')
                        next()
                    })
                },
                function(next) {
                    queue.inFlight(function(err, count) {
                        t.equal(count, 0, 'There are no inflight messages anymore')
                        next()
                    })
                },
                function(next) {
                    queue.done(function(err, count) {
                        t.equal(count, 1, 'There is now one processed message')
                        next()
                    })
                },
            ],
            function(err) {
                t.ok(!err, 'No error when doing stats on one message')
                t.end()
            }
        )
    })


    // ToDo: add more tests for adding a message, getting it and letting it lapse
    // then re-checking all stats.

    test('stats for a single message added, received, timed-out and back on queue', function(t) {
        var queue = mongoDbQueue(db, 'stats2', { visibility : 3 })

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
                    queue.total(function(err, count) {
                        t.equal(count, 1, 'Total number of messages is one')
                        next()
                    })
                },
                function(next) {
                    queue.size(function(err, count) {
                        t.equal(count, 1, 'Size of queue is one')
                        next()
                    })
                },
                function(next) {
                    queue.inFlight(function(err, count) {
                        t.equal(count, 0, 'There are no inFlight messages')
                        next()
                    })
                },
                function(next) {
                    queue.done(function(err, count) {
                        t.equal(count, 0, 'There are no done messages')
                        next()
                    })
                },
                function(next) {
                    // let's set one to be inFlight
                    queue.get(function(err, msg) {
                        // msg is ignored, we don't care about the message here
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    queue.total(function(err, count) {
                        t.equal(count, 1, 'Total number of messages is still one')
                        next()
                    })
                },
                function(next) {
                    queue.size(function(err, count) {
                        t.equal(count, 1, 'Size of queue is still at one')
                        next()
                    })
                },
                function(next) {
                    queue.inFlight(function(err, count) {
                        t.equal(count, 0, 'There are no inflight messages again')
                        next()
                    })
                },
                function(next) {
                    queue.done(function(err, count) {
                        t.equal(count, 0, 'There are still no done messages')
                        next()
                    })
                },
            ],
            function(err) {
                t.ok(!err, 'No error when doing stats on one message')
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

