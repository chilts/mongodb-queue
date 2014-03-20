var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var Queue = require('../')

setup(function(db) {

    test('ping: check a retrieved message with a ping can still be acked', function(t) {
        var queue = new Queue(db, 'ping', { visibility : 5 })

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
                    queue.ping(msg.ack, function(err) {
                        t.ok(!err, 'No error when pinging a message')
                        // now wait 4s
                        setTimeout(next, 4 * 1000)
                    })
                },
                function(next) {
                    queue.ack(msg.ack, function(err) {
                        t.ok(!err, 'No error when acking this message')
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
                console.log('err:', err)
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
                db.close()
            }
        )
    })

})
