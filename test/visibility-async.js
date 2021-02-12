var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('visibility: check message is back in queue after 3s', function(t) {
        var queue = mongoDbQueue(db, 'visibility', { visibility : 3 })

        async.series(
            [
                async function() {
                    await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                },
                async function() {
                    var msg = await queue.get();
                    // wait over 3s so the msg returns to the queue
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    var msg = await queue.get();
                    // yes, there should be a message on the queue again
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    await queue.ack(msg.ack);
                    t.pass('No error when acking the message')
                },
                async function() {
                    var msg = await queue.get();
                        // no more messages
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test("visibility: check that a late ack doesn't remove the msg", function(t) {
        var queue = mongoDbQueue(db, 'visibility', { visibility : 3 })
        var originalAck

        async.series(
            [
                async function() {
                    await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                },
                async function() {
                    var msg = await queue.get();
                    t.ok(msg.id, 'Got a msg.id (sanity check)')

                    // remember this original ack
                    originalAck = msg.ack
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(async function() {
                        t.pass('Back from timeout, now acking the message')

                        // now ack the message but too late - it shouldn't be deleted
                        try {
                          await queue.ack(msg.ack);
                          t.fail('Should not succeed');
                        } catch (err) {
                          t.ok(err, 'Got an error when acking the message late')
                          t.pass('No message was updated')
                        }
                        resolve();
                      }, 4 * 1000);
                    });
                },
                async function() {
                    var msg = await queue.get()
                        // the message should now be able to be retrieved, with a new 'ack' id
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    t.notEqual(msg.ack, originalAck, 'Original ack and new ack are different')

                    // now ack this new retrieval
                    await queue.ack(msg.ack)
                },
                async function() {
                    var msg = await queue.get();
                    // no more messages
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test("visibility: check visibility option overrides the queue visibility", function(t) {
        var queue = mongoDbQueue(db, 'visibility', { visibility : 2 })
        var originalAck

        async.series(
            [
                async function() {
                    await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                },
                async function() {
                    var msg = await queue.get({ visibility: 4 });
                    // wait over 2s so the msg would normally have returns to the queue
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    // now wait 3s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 3 * 1000);
                    });
                },
                async function() {
                    var msg = await queue.get();
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
                    var msg = await queue.get();
                    // yes, there should be a message on the queue again
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                    await queue.ack(msg.ack);
                    t.pass('No error when acking the message')
                },
                async function() {
                    var msg = await queue.get();
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
