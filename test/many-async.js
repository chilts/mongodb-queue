var async = require('async')
var test = require('tape')

var setup = require('./setup.js')
var mongoDbQueue = require('../')

var total = 250

setup(function(client, db) {

    test('many: add ' + total + ' messages, get ' + total + ' back', function(t) {
        var queue = mongoDbQueue(db, 'many')
        var msgs = []
        var msgsToQueue = []

        async.series(
            [
                async function() {
                    var i
                    for(i=0; i<total; i++) {
                        msgsToQueue.push('no=' + i)
                    }
                    await queue.add(msgsToQueue);
                    t.pass('All ' + total + ' messages sent to MongoDB')
                },
                async function() {
                  var msg;
                  while(msg = await queue.get()) {
                    msgs.push(msg)
                  }

                  t.ok(msgs.length === total, 'Received all ' + total + ' messages');
                },
                async function() {
                    var acked = 0
                    try {
                      for(i=0; i<total; i++) {
                        var msg = msgs[i];
                        await queue.ack(msg.ack);
                        acked++
                      }
                      t.ok(acked === total, 'Acked all ' + total + ' messages')
                    } catch (err) {
                      t.fail('Failed to ack message');
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

    test('many: add no messages, receive err in callback', async function(t) {
        var queue = mongoDbQueue(db, 'many')
        var messages = []
        try {
          await queue.add([]);
          t.fail('Empty array should fail');
        } catch (err) {
          t.pass('Finished test ok')
        }
        t.end()
    })

    test('client.close()', function(t) {
        t.pass('client.close()')
        client.close()
        t.end()
    })

})
