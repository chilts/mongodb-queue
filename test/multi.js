var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

var total = 250

setup(function(db) {

    test('multi: add ' + total + ' messages, get ' + total + ' back', function(t) {
        var queue = mongoDbQueue(db, 'multi')
        var msgs = []

        async.series(
            [
                function(next) {
                    var i, done = 0
                    for(i=0; i<total; i++) {
                        queue.add('no=' + i, function(err) {
                            if (err) return t.fail('Failed adding a message')
                            done++
                            if (done === total) {
                                t.pass('All ' + total + ' messages sent to MongoDB')
                                next()
                            }
                        })
                    }
                },
                function(next) {
                    function getOne() {
                        queue.get(function(err, msg) {
                            if (err) return t.fail('Failed getting a message')
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

    test('db.close()', function(t) {
        t.pass('db.close()')
        db.close()
        t.end()
    })

})
