# mongodb-queue #

## Synopsis ##

Create a connection to MongoDB to create a queue object:

```js
var mongodb = require('mongodb')
mongodb.MongoClient.connect(conStr, function(err, db) {
    var queue = Queue(db, 'my-queue')
})
```

Add a message to a queue:

```js
queue.add('Hello, World!', function(err) {
   // message with payload 'Hello, World!' added
})
```

Get a message from the queue:

```js
queue.get(function(err, msg) {
    console.log('msg.id=' + msg.id)
    console.log('msg.ack=' + msg.ack)
    // msg.payload is 'Hello, World!'
})
```

Ack a message (and remove it from the queue):

```js
queue.ack(msg.id, msg.ack, function(err) {
    // msg removed from queue
})
```

## Options ##

### collectionName ###

Default: `'msgs'`

This is the name of the MongoDB Collection you wish to use to store the messages.
By default we only use this one MongoDB Collection, unless you specify an
alternate one.

e.g. both of these queues use the same `'msgs'` collection by default:

```
var resizeQueue = Queue(db, 'resize-image')
var uploadQueue = Queue(db, 'upload-image')
```

e.g. both of these queue use the MongoDB Collection named `'app'`:

```
var resizeQueue = Queue(db, 'resize-image', { collectionName : 'app' })
var uploadQueue = Queue(db, 'upload-image', { collectionName : 'app' })
```

e.g. these two queue use different MongoDB Collections, `'msgs'` and `'app'` respectively:

```
var resizeQueue = Queue(db, 'resize-image')
var uploadQueue = Queue(db, 'upload-image', { collectionName : 'app' })
```

Using the default MongoDB Collection for all of your queues shouldn't cause a problem
but you may wish to use a different collection per queue if you have a high throughput.

### Message Visibility Window ###

Default: `30`

By default, if you don't ack a message within the first 30s after receiving it,
it is placed back in the queue so it can be fetched again. This is called the
visibility window.

You may set this visibility window on a per queue basis. For example, to set the
visibility to 15 seconds:

```
var queue = Queue(db, 'my-queue', { visibility : 15 })
```

All messages in this queue now have a visibility window of 15s, instead of the
default 30s.

## Author ##

Written by [Andrew Chilton](http://chilts.org/) -
[Twitter](https://twitter.com/andychilton).

## License ##

MIT - http://chilts.mit-license.org/2014/

(Ends)
