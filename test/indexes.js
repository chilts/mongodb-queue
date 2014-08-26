var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

    test('visibility: check message is back in queue after 3s', function(t) {
        t.plan(1)

        var queue = mongoDbQueue(db, 'visibility', { visibility : 3 })

        queue.ensureIndexes(function(err) {
            t.ok(!err, 'There was no error when running .ensureIndexes()')

            t.end()
        })
    })

    test('db.close()', function(t) {
        t.pass('db.close()')
        db.close()
        t.end()
    })

})
