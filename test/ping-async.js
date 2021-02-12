var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('ping: check a retrieved message with a ping can still be acked', function(t) {
        var queue = mongoDbQueue(db, 'ping', { visibility : 5 })
        var msg

        async.series(
            [
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'There is an id returned when adding a message.')
                },
                async function() {
                    // get something now and it shouldn't be there
                    var thisMsg = await queue.get();
                    msg = thisMsg
                    t.pass('No error when getting this message')
                    t.ok(msg.id, 'Got this message id')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    // ping this message so it will be kept alive longer, another 5s
                    var id = await queue.ping(msg.ack);
                    t.pass('No error when pinging a message')
                    t.ok(id, 'Received an id when acking this message')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    var id = await queue.ack(msg.ack);
                    t.pass('No error when acking this message')
                    t.ok(id, 'Received an id when acking this message')
                },
                async function() {
                    var msg = await queue.get();
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No message when getting from an empty queue')
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
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'There is an id returned when adding a message.')
                },
                async function() {
                    // get something now and it shouldn't be there
                    var thisMsg = await queue.get();
                    msg = thisMsg
                    t.pass('No error when getting this message')
                    t.ok(msg.id, 'Got this message id')
                },
                async function() {
                    // ack the message
                    var id = await queue.ack(msg.ack);
                    t.pass('No error when acking this message')
                    t.ok(id, 'Received an id when acking this message')
                },
                async function() {
                    // ping this message, even though it has been acked
                    try {
                      var id = await queue.ping(msg.ack);
                      t.fail('should not succeed on pinging acked message');
                    } catch (err) {
                      t.ok(err, 'Error when pinging an acked message')
                      t.pass('Received no id when pinging an acked message')
                    }
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
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'There is an id returned when adding a message.')
                },
                async function() {
                    var thisMsg = await queue.get();
                    msg = thisMsg
                    // message should reset in three seconds
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    // now wait 2s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    // ping this message so it will be kept alive longer, another 5s instead of 3s
                    var id = await queue.ping(msg.ack, { visibility: 5 });
                    t.pass('No error when pinging a message')
                    t.ok(id, 'Received an id when acking this message')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    msg = await queue.get();
                    // messages should not be back yet
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                    // now wait 2s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    msg = await queue.get();
                    // yes, there should be a message on the queue again
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    await queue.ack(msg.ack);
                    t.pass('No error when acking the message')
                },
                async function() {
                    msg = await queue.get();
                    // no more messages
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                }
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test('client.close()', function(t) {
        t.pass('client.close()')
        client.close()
        t.end()
    })

})
