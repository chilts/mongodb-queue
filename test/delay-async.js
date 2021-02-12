var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('delay: check messages on this queue are returned after the delay', function(t) {
        var queue = mongoDbQueue(db, 'delay', { delay : 3 })

        async.series(
            [
                async function() {
                    var id = await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                    t.ok(id, 'There is an id returned when adding a message.')
                },
                async function() {
                    // get something now and it shouldn't be there
                    var msg = await queue.get();
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    // get something now and it SHOULD be there
                    var msg = await queue.get();
                    t.pass('No error when getting a message')
                    t.ok(msg.id, 'Got a message id now that the message delay has passed')
                    await queue.ack(msg.ack)
                },
                async function() {
                    var msg = await queue.get();
                    // no more messages
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No more messages')
                },
            ],
            function(err) {
                if (err) t.fail(err)
                t.pass('Finished test ok')
                t.end()
            }
        )
    })

    test('delay: check an individual message delay overrides the queue delay', function(t) {
        var queue = mongoDbQueue(db, 'delay')

        async.series(
            [
                async function() {
                  var id = await queue.add('I am delayed by 3 seconds', { delay : 3 });
                  t.pass('There is no error when adding a message.')
                  t.ok(id, 'There is an id returned when adding a message.')
                },
                async function() {
                    // get something now and it shouldn't be there
                    var msg = await queue.get();
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No msg received')
                    // now wait 4s
                    await new Promise(function(resolve) {
                      setTimeout(function() {
                          resolve()
                      }, 4 * 1000);
                    });
                },
                async function() {
                    // get something now and it SHOULD be there
                    var msg = await queue.get();
                    t.pass('No error when getting a message')
                    t.ok(msg.id, 'Got a message id now that the message delay has passed')
                    await queue.ack(msg.ack)
                },
                async function() {
                    var msg = await queue.get();
                    // no more messages
                    t.pass('No error when getting no messages')
                    t.ok(!msg, 'No more messages')
                },
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
