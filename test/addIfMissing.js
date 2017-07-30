var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

  test('addIfMissing: check duplicated messages are not added', function(t) {
    var queue = mongoDbQueue(db, 'addIfMissing', { visibility : 3 })
    var msg

    async.waterfall(
        [
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing in the queue at all')
              next()
            })
          },
          function(next) {
            queue.addIfMissing(1, {abc:123}, {}, function(err, id) {
              t.ok(!err, 'There is no error.')
              t.equal(id, 1, 'The id returned mathces what was specified')
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.addIfMissing(1, {abc:123}, {}, function(err, id) {
              t.ok(!err, 'There is no error.')
              t.ok(!id, 'No id is returned.');
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.addIfMissing(1, {abc:456}, {}, function(err, id) {
              t.ok(!err, 'There is no error.')
              t.ok(!id, 'No id is returned.');
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.get({}, function(err, msg){
              t.ok(!err, 'There is no error.')
              t.equal(msg.payload.abc, 123, 'The payload is the first one entered')
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing in the queue at all')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.get({}, function(err, msg){
              t.ok(!err, 'There is no error.')
              t.ok(!msg, 'The message is not retrieved again.')
              next()
            })
          },
          function(next) {
            queue.addIfMissing(1, {abc:123}, {}, function(err, id) {
              t.ok(!err, 'There is no error.')
              t.ok(!id, 'No id is returned.');
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing in the queue at all')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'There is currently one item in the queue')
              next()
            })
          },
          function(next) {
            queue.get({}, function(err, msg){
              t.ok(!err, 'There is no error.')
              t.ok(!msg, 'The message is not retrieved again.')
              next()
            })
          },
          function(next) {
            queue.addIfMissing('abc456', {}, {}, function(err, id){
              t.ok(!err, 'There is no error.')
              t.equal(id, 'abc456', 'The id matches what was specified')
              next()
            })
          }
        ],
        function(err) {
          if (err) t.fail(err)
          t.pass('Finished test ok')
          t.end()
        }
    )
  })

  test('db.close()', function(t) {
    t.pass('db.close()')
    db.close()
    t.end()
  })

})

