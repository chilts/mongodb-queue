var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

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
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'Received an id for this message')
                },
                async function() {
                    var count = await queue.total();
                    t.equal(count, 1, 'Total number of messages is one')
                },
                async function() {
                    var count = await queue.size();
                    t.equal(count, 1, 'Size of queue is one')
                },
                async function() {
                    var count = await queue.inFlight();
                    t.equal(count, 0, 'There are no inFlight messages')
                },
                async function() {
                    var count = await queue.done();
                    t.equal(count, 0, 'There are no done messages')
                },
                async function() {
                    // let's set one to be inFlight
                    var newMsg = await queue.get();
                    msg = newMsg
                },
                async function() {
                    var count = await queue.total();
                    t.equal(count, 1, 'Total number of messages is still one')
                },
                async function() {
                    var count = await queue.size();
                    t.equal(count, 0, 'Size of queue is now zero (ie. none to come)')
                },
                async function() {
                    var count = await queue.inFlight();
                    t.equal(count, 1, 'There is one inflight message')
                },
                async function() {
                    var count = await queue.done();
                    t.equal(count, 0, 'There are still no done messages')
                },
                async function() {
                    // now ack that message
                    var newMsg = await queue.ack(msg.ack);
                    msg = newMsg
                },
                async function() {
                    var count = await queue.total();
                    t.equal(count, 1, 'Total number of messages is again one')
                },
                async function() {
                    var count = await queue.size();
                    t.equal(count, 0, 'Size of queue is still zero (ie. none to come)')
                },
                async function() {
                    var count = await queue.inFlight();
                    t.equal(count, 0, 'There are no inflight messages anymore')
                },
                async function() {
                    var count = await queue.done();
                    t.equal(count, 1, 'There is now one processed message')
                },
            ],
            function(err) {
              console.log(err);
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
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'Received an id for this message')
                },
                async function() {
                    var count = await queue.total();
                    t.equal(count, 1, 'Total number of messages is one')
                },
                async function() {
                    var count = await queue.size();
                    t.equal(count, 1, 'Size of queue is one')
                },
                async function() {
                    var count = await queue.inFlight();
                    t.equal(count, 0, 'There are no inFlight messages')
                },
                async function() {
                    var count = await queue.done();
                    t.equal(count, 0, 'There are no done messages')
                },
                async function() {
                    // let's set one to be inFlight
                    await queue.get();
                    // msg is ignored, we don't care about the message here
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    var count = await queue.total();
                    t.equal(count, 1, 'Total number of messages is still one')
                },
                async function() {
                    var count = await queue.size();
                    t.equal(count, 1, 'Size of queue is still at one')
                },
                async function() {
                    var count = await queue.inFlight();
                    t.equal(count, 0, 'There are no inflight messages again')
                },
                async function() {
                    var count = await queue.done();
                    t.equal(count, 0, 'There are still no done messages')
                },
            ],
            function(err) {
                t.ok(!err, 'No error when doing stats on one message')
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

