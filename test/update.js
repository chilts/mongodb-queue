var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

    test('update: update a message and check that we get the updated version when getting same task again from queue', function(t) {
        var queue = mongoDbQueue(db, 'update', { visibility : 2 })
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
                        t.ok(!err, 'No error when getting this message')
                        t.ok(msg.id, 'Got this message id')
                        next()
                    })
                },
                function(next) {
                    // update this message with a new payload
                    queue.update(msg.ack, 'Hello, Universe!', function(err, id) {
                        t.ok(!err, 'No error when updating a payload')
                        // now wait 3s for the message to be release to queue again
                        setTimeout(next, 3 * 1000)
                    })
                },
                function(next) {
                    //We pretend that something happened to the process and now we are picking
                    //up work from the queue again. We'd like to start where we where we left
                    //our payload, i.e. in the newly updated state
                    queue.get(function(err, msg) {
                        t.ok(msg.payload === 'Hello, Universe!', 'Popped the same message again and got the updated state of the payload')
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

    test('db.close()', function(t) {
        t.pass('db.close()')
        db.close()
        t.end()
    })

})
