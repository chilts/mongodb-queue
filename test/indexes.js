var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

    test('indexes: check indexes are created', function(t) {
        t.plan(7)

        var queue = mongoDbQueue(db, 'indexes')

        queue.createIndexes(function(err, indexName) {
            t.ok(!err, 'There was no error when running .ensureIndexes()')
            t.ok(indexName, 'receive indexName we created')

            var collection = db.collection('indexes');
            collection.indexInformation({ full : true }, function(err, indexInfo) {
                t.ok(!err, 'There was no error getting index info')

                /*
                indexInfo [
                    {"v":1,"name":"_id_","key":{"_id":1},"ns":"mongodb-queue.indexes"},
                    {"v":1,"name":"deleted_1_visible_1","key":{"deleted":1,"visible":1},"ns":"mongodb-queue.indexes"},
                    {"v":1,"name":"ack_1","key":{"ack":1},"unique":true,"ns":"mongodb-queue.indexes","sparse":true}]
                */
                t.ok(indexInfo.length === 3, '3 indexes were created')
                t.ok(indexInfo[0].name === '_id_', 'id index was created')
                t.ok(indexInfo[1].name === 'deleted_1_visible_1', 'deleted_visible index was created')
                t.ok(indexInfo[2].name === 'ack_1', 'ack index was created')

                t.end()
            })
        })
    })

    test('ttl: check index with ttl is created', function(t) {
        t.plan(9)

        var queue = mongoDbQueue(db, 'ttl', { ttl : 60 })

        queue.createIndexes(function(err, indexName) {
            t.ok(!err, 'There was no error when running .ensureIndexes()')
            t.ok(indexName, 'receive indexName we created')

            var collection = db.collection('ttl');
            collection.indexInformation({ full : true }, function(err, indexInfo) {
                t.ok(!err, 'There was no error getting index info')

                /*
                indexInfo [
                    {"v":1,"name":"_id_","key":{"_id":1},"ns":"mongodb-queue.ttl"},
                    {"v":1,"name":"deleted_1_visible_1","key":{"deleted":1,"visible":1},"ns":"mongodb-queue.ttl"},
                    {"v":1,"name":"ack_1","key":{"ack":1},"unique":true,"ns":"mongodb-queue.ttl","sparse":true},
                    {"v":1,"name":"deleted_1","key":{"deleted":1},"ns":"mongodb-queue.ttl","expireAfterSeconds":60,"background":true}]
                */
                t.ok(indexInfo.length === 4, '4 indexes were created')
                t.ok(indexInfo[0].name === '_id_', 'id index was created')
                t.ok(indexInfo[1].name === 'deleted_1_visible_1', 'deleted_visible index was created')
                t.ok(indexInfo[2].name === 'ack_1', 'ack index was created')
                t.ok(indexInfo[3].name === 'deleted_1', 'ttl index was created')
                t.ok(indexInfo[3].expireAfterSeconds === 60, 'expireAfterSeconds set')

                t.end()
            })
      })
    })

    test('db.close()', function(t) {
        t.pass('db.close()')
        db.close()
        t.end()
    })

})
