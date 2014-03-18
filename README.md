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

This is the name of the collection you wish to use. Note: we only use one
collection for each queue instantiated. In fact, you can use the same collection
for multiple queues.

e.g. both of these queue use the same `'msgs'` collection:

```
var resizeQueue = Queue(db, 'resize-image')
var uploadQueue = Queue(db, 'upload-image')
```

e.g. these both use the `'app'` collection:

```
var resizeQueue = Queue(db, 'resize-image', { collectionName : 'app' })
var uploadQueue = Queue(db, 'upload-image', { collectionName : 'app' })
```

e.g. these use both the `'msgs'` and `'app'` collections:

```
var resizeQueue = Queue(db, 'resize-image')
var uploadQueue = Queue(db, 'upload-image', { collectionName : 'app' })
```

It shouldn't be a problem if you generally use the same MongoDB Collection
however you may wish to change this if you have high throughput.

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

All messages in this queue now have a visibility window of 15s.

## Author ##

Written by [Andrew Chilton](http://chilts.org/) -
[Twitter](https://twitter.com/andychilton).

## License ##

MIT - http://chilts.mit-license.org/2014/

(Ends)
