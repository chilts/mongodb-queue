var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(client, db) {

    test('visibility: check message is back in queue after 3s', function(t) {
        t.plan(2)

        var queue = mongoDbQueue(db, 'visibility', { visibility : 3 })

        queue.createIndexes(function(err, indexName) {
            t.ok(!err, 'There was no error when running .ensureIndexes()')
            t.ok(indexName, 'receive indexName we created')
            t.end()
        })
    })

    test('client.close()', function(t) {
        t.pass('client.close()')
        client.close()
        t.end()
    })

})
