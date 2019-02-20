var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

var total = 250

setup(function(client, db) {

    test('many: add ' + total + ' messages, get ' + total + ' back', function(t) {
        var queue = mongoDbQueue(db, 'many')
        var msgs = []
        var msgsToQueue = []

        async.series(
            [
                function(next) {
                    var i
                    for(i=0; i<total; i++) {
                        msgsToQueue.push('no=' + i)
                    }
                    queue.add(msgsToQueue, function(err) {
                        if (err) return t.fail('Failed adding a message')
                        t.pass('All ' + total + ' messages sent to MongoDB')
                        next()
                    })
                },
                function(next) {
                    function getOne() {
                        queue.get(function(err, msg) {
                            if (err || !msg) return t.fail('Failed getting a message')
                            msgs.push(msg)
                            if (msgs.length === total) {
                                t.pass('Received all ' + total + ' messages')
                                next()
                            }
                            else {
                                getOne()
                            }
                        })
                    }
                    getOne()
                },
                function(next) {
                    var acked = 0
                    msgs.forEach(function(msg) {
                        queue.ack(msg.ack, function(err) {
                            if (err) return t.fail('Failed acking a message')
                            acked++
                            if (acked === total) {
                                t.pass('Acked all ' + total + ' messages')
                                next()
                            }
                        })
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

    test('many: add no messages, receive err in callback', function(t) {
        var queue = mongoDbQueue(db, 'many')
        var messages = []
        queue.add([], function(err) {
            if (!err) t.fail('Error was not received')
            t.pass('Finished test ok')
            t.end()
        });
    })

    test('client.close()', function(t) {
        t.pass('client.close()')
        client.close()
        t.end()
    })

})
