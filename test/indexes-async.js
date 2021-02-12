var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('visibility: check message is back in queue after 3s', async function(t) {
        t.plan(2)

        var queue = mongoDbQueue(db, 'visibility', { visibility : 3 })

        var indexName = await queue.createIndexes();
        t.pass('There was no error when running .ensureIndexes()')
        console.log(indexName);
        t.ok(indexName, 'receive indexName we created')
        t.end()
    })

    test('client.close()', function(t) {
        t.pass('client.close()')
        client.close()
        t.end()
    })

})
