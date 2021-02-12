var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

var total = 250

setup(function(client, db) {

    test('multi: add ' + total + ' messages, get ' + total + ' back', function(t) {
        var queue = mongoDbQueue(db, 'multi')
        var msgs = []

        async.series(
            [
                async function() {
                    var i, done = 0
                    for(i=0; i<total; i++) {
                        await queue.add('no=' + i);
                        done++
                    }
                    if (done === total) {
                      t.pass('All ' + total + ' messages sent to MongoDB')
                    }
                },
                async function() {
                  var msg;

                  while(msg = await queue.get()) {
                    msgs.push(msg)
                  }
                  if (msgs.length === total) {
                    t.pass('Received all ' + total + ' messages')
                  } else {
                    t.fail('Failed to get all messages');
                  }
                },
                async function() {
                    var acked = 0
                    var i, done = 0
                    try {
                      for(i=0; i<total; i++) {
                        var msg = msgs[i];
                        await queue.ack(msg.ack);
                        acked++
                      }
                      t.ok(acked === total, 'Acked all ' + total + ' messages');
                    } catch (err) {
                      t.fail('Failed acking message');
                    }
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
