var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('first test', function(t) {
        var queue = mongoDbQueue(db, 'queue', { visibility : 3, deadQueue : 'dead-queue' })
        t.ok(queue, 'Queue created ok')
        t.end()
    });

    test('single message going over 5 tries, should appear on dead-queue', function(t) {
        var deadQueue = mongoDbQueue(db, 'dead-queue')
        var queue = mongoDbQueue(db, 'queue', { visibility : 1, deadQueue : deadQueue })
        var msg
        var origId

        async.series(
            [
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'Received an id for this message')
                    origId = id
                },
                async function() {
                    var thisMsg = await queue.get();
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('First expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Second expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Third expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Fourth expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Fifth expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var id = await queue.get();
                    t.pass('No error when getting no messages')
                    t.ok(!id, 'No msg received')
                },
                async function() {
                    var msg = await deadQueue.get();
                    t.pass('No error when getting from the deadQueue')
                    t.ok(msg.id, 'Got a message id from the deadQueue')
                    t.equal(msg.payload.id, origId, 'Got the same message id as the original message')
                    t.equal(msg.payload.payload, 'Hello, World!', 'Got the same as the original message')
                    t.equal(msg.payload.tries, 6, 'Got the tries as 6')
                },
            ],
            function(err) {
                t.ok(!err, 'No error during single round-trip test')
                t.end()
            }
        )
    })

    test('two messages, with first going over 3 tries', function(t) {
        var deadQueue = mongoDbQueue(db, 'dead-queue-2')
        var queue = mongoDbQueue(db, 'queue-2', { visibility : 1, deadQueue : deadQueue, maxRetries : 3 })
        var msg
        var origId, origId2

        async.series(
            [
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'Received an id for this message')
                    origId = id
                },
                async function() {
                    var id = await queue.add('Part II');
                    t.pass('There is no error when adding another message.')
                    t.ok(id, 'Received an id for this message')
                    origId2 = id
                },
                async function() {
                    var thisMsg = await queue.get();
                    t.equal(thisMsg.id, origId, 'We return the first message on first go')
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('First expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    t.equal(thisMsg.id, origId, 'We return the first message on second go')
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Second expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    var thisMsg = await queue.get();
                    t.equal(thisMsg.id, origId, 'We return the first message on third go')
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          t.pass('Third expiration')
                          resolve()
                      }, 2 * 1000);
                    });
                },
                async function() {
                    // This is the 4th time, so we SHOULD have moved it to the dead queue
                    // pior to it being returned.
                    msg = await queue.get();
                    t.pass('No error when getting the 2nd message')
                    t.equal(msg.id, origId2, 'Got the ID of the 2nd message')
                    t.equal(msg.payload, 'Part II', 'Got the same payload as the 2nd message')
                },
                async function() {
                    msg = await deadQueue.get();
                    t.pass('No error when getting from the deadQueue')
                    t.ok(msg.id, 'Got a message id from the deadQueue')
                    t.equal(msg.payload.id, origId, 'Got the same message id as the original message')
                    t.equal(msg.payload.payload, 'Hello, World!', 'Got the same as the original message')
                    t.equal(msg.payload.tries, 4, 'Got the tries as 4')
                },
            ],
            function(err) {
                t.ok(!err, 'No error during single round-trip test')
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
