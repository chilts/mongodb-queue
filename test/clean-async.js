var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../mongodb-queue')

setup(function(client, db) {

    test('clean: check deleted messages are deleted', function(t) {
        var queue = mongoDbQueue(db, 'clean', { visibility : 3 })
        var msg

        async.series(
            [
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'There is currently nothing on the queue')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'There is currently nothing in the queue at all')
                },
                async function() {
                    await queue.clean();
                    t.pass('There is no error.')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'There is currently nothing on the queue')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'There is currently nothing in the queue at all')
                },
                async function() {
                    await queue.add('Hello, World!');
                    t.pass('There is no error when adding a message.')
                },
                async function() {
                    await queue.clean();
                    t.pass('There is no error.')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 1, 'Queue size is correct')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 1, 'Queue total is correct')
                },
                async function() {
                    var newMsg = await queue.get();
                    msg = newMsg
                    t.ok(msg.id, 'Got a msg.id (sanity check)')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'Queue size is correct')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 1, 'Queue total is correct')
                },
                async function() {
                    await queue.clean();
                    t.pass('There is no error.')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'Queue size is correct')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 1, 'Queue total is correct')
                },
                async function() {
                    var id = await queue.ack(msg.ack);
                    t.pass('No error when acking the message')
                    t.ok(id, 'Received an id when acking this message')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'Queue size is correct')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 1, 'Queue total is correct')
                },
                async function() {
                    await queue.clean();
                    t.pass('There is no error.')
                },
                async function() {
                    var size = await queue.size();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'Queue size is correct')
                },
                async function() {
                    var size = await queue.total();
                    t.pass('There is no error.')
                    t.equal(size, 0, 'Queue total is correct')
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
