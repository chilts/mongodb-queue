# mongodb-queue #

[![Build Status](https://travis-ci.org/chilts/mongodb-queue.png)](https://travis-ci.org/chilts/mongodb-queue) [![NPM](https://nodei.co/npm/mongodb-queue.png?mini=true)](https://nodei.co/npm/mongodb-queue/)

## Synopsis ##

Create a connection to your MongoDB database, and use it to create a queue object:

```js
var mongodb = require('mongodb')
var con = 'mongodb://localhost:27017/test'
mongodb.MongoClient.connect(con, function(err, db) {
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

## Use of MongoDB ##

Whilst using MongoDB recently and having a need for lightweight queues, I realised
that the atomic operations that MongoDB provides are ideal for this kind of job.

Since everything it atomic, it is impossible to lose messages in or around your
application. I guess MongoDB could lose them but it's a safer bet it won't compared
to your own application.

As an example of the atomic nature being used, messages stay in the same collection
and are never moved around or deleted, just a couple of fields are set, incremented
or deleted. We always use MongoDB's excellent `collection.findAndModify()` so that
each message is updated atomically inside MongoDB and we never have to fetch something,
change it and store it back.

## Releases ##

### 0.2.0 (2014-03-18) ###

* [NEW] messages now return number of tries (times they have been fetched)

### 0.1.0 (2014-03-18) ###

* [NEW] add messages to queues
* [NEW] fetch messages from queues
* [NEW] ack messages on queues
* [NEW] set up multiple queues
* [NEW] set your own MongoDB Collection name
* [NEW] set a visibility timeout on a queue

## Author ##

Written by [Andrew Chilton](http://chilts.org/) -
[Twitter](https://twitter.com/andychilton).

## License ##

MIT - http://chilts.mit-license.org/2014/

(Ends)
