var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var Queue = require('../')

setup(function(db) {

    test('delay: check messages on this queue are returned after the delay', function(t) {
        var queue = new Queue(db, 'delay', { delay : 3 })

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
                    queue.get(function(err, msg) {
                        t.ok(!err, 'No error when getting no messages')
                        t.ok(!msg, 'No msg received')
                        // now wait 4s
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    // get something now and it shouldn't be there
                    queue.get(function(err, msg) {
                        t.ok(!err, 'No error when getting a message')
                        t.ok(msg._id, 'Got a message id now that the message delay has passed')
                        queue.ack(msg.ack, next)
                    })
                },
                function(next) {
                    queue.get(function(err, msg) {
                        // no more messages
                        t.ok(!err, 'No error when getting no messages')
                        t.ok(!msg, 'No more messages')
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
