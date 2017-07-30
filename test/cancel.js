var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

setup(function(db) {

  test('clean: check deleted messages are deleted', function(t) {
    var queue = mongoDbQueue(db, 'clean', { visibility : 3 })
    var msg

    async.waterfall(
        [
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing on the queue')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing in the queue at all')
              next()
            })
          },
          function(next) {
            queue.clean(function(err) {
              t.ok(!err, 'There is no error.')
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing on the queue')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'There is currently nothing in the queue at all')
              next()
            })
          },
          function(next) {
            queue.add('Hello, World!', function(err, id) {
              t.ok(!err, 'There is no error when adding a message.')
              next(null, id)
            })
          },
          function(id, next) {
            queue.clean(function(err) {
              t.ok(!err, 'There is no error.')
              next(null, id)
            })
          },
          function(id, next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'Queue size is correct')
              next(null, id)
            })
          },
          function(id, next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'Queue total is correct')
              next(null, id)
            })
          },
          function(id, next) {
            queue.cancel(id, function(err) {
              t.ok(!err, 'There is no error.')
              next(null, id)
            })
          },
          function(id, next) {
            queue.get(function(err, msg) {
              t.ok(!err, 'There is no error.')
              t.ok(!msg, 'No msg received')
              next(null, id)
            })
          },
          function(id, next) {
            queue.cancel(id, function(err) {
              t.ok(err, 'There is an error.')
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'Queue size is correct')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 1, 'Queue total is correct')
              next()
            })
          },
          function(next) {
            queue.clean(function(err) {
              t.ok(!err, 'There is no error.')
              next()
            })
          },
          function(next) {
            queue.size(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'Queue size is correct')
              next()
            })
          },
          function(next) {
            queue.total(function(err, size) {
              t.ok(!err, 'There is no error.')
              t.equal(size, 0, 'Queue total is correct')
              next()
            })
          },
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

