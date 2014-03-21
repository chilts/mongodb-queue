# mongodb-queue #

[![Build Status](https://travis-ci.org/chilts/mongodb-queue.png)](https://travis-ci.org/chilts/mongodb-queue) [![NPM](https://nodei.co/npm/mongodb-queue.png?mini=true)](https://nodei.co/npm/mongodb-queue/)

A really light-weight way to create queue with a nice API if you're already
using MongoDB.

## Synopsis ##

Create a connection to your MongoDB database, and use it to create a queue object:

```js
var mongodb = require('mongodb')
var mongoDbQueue = require('mongodb-queue')

var con = 'mongodb://localhost:27017/test'

mongodb.MongoClient.connect(con, function(err, db) {
    mongoDbQueue(db, 'my-queue', function(err, queue) {
        // the 'queue'
    })
})
```

Add a message to a queue:

```js
queue.add('Hello, World!', function(err, id) {
    // Message with payload 'Hello, World!' added.
    // 'id' is returned, useful for logging.
})
```

Get a message from the queue:

```js
queue.get(function(err, msg) {
    console.log('msg.id=' + msg.id)
    console.log('msg.ack=' + msg.ack)
    console.log('msg.payload=' + msg.payload) // 'Hello, World!'
    console.log('msg.tries=' + msg.tries)
})
```

Ping a message to keep it's visibility open for long-running tasks

```js
queue.ping(msg.ack, function(err, id) {
    // Visibility window now increased for this message id.
    // 'id' is returned, useful for logging.
})
```

Ack a message (and remove it from the queue):

```js
queue.ack(msg.ack, function(err) {
    // This msg removed from queue for this message id.
    // 'id' is returned, useful for logging.
})
```

## Creating a Queue ##

To create a queue, call the exported function with the `MongoClient`, the name
and a set of opts. The MongoDB collection used is the same name as the name
passed in:

```
var mongoDbQueue = require('mongodb-queue')

mongoDbQueue(db, 'a-queue', function(err, queue) {
    // a queue
})
mongoDbQueue(db, 'a-queue', function(err, queue) {
    // another queue which uses the same collection as above
})
```

Note: but don't use the same queue name twice with different options, otherwise things might get confusing.

To pass options, try this:

```
mongoDbQueue(db, 'resize-queue', { visibility : 30, delay : 15 }, function(err, resizeQueue) {
    // the resizeQueue
})
```

## Options ##

### name ###

This is the name of the MongoDB Collection you wish to use to store the messages.
Each queue you create will be it's own collection.

e.g.

```
mongoDbQueue(db, 'resize-queue', function(err, resizeQueue) {
    // the resizeQueue
})
mongoDbQueue(db, 'notify-queue', function(err, notifyQueue) {
    // the notifyQueue
})
```

This will create two collections in MongoDB called `resize-image` and `notify-owner`.

### Message Visibility Window ###

Default: `30`

By default, if you don't ack a message within the first 30s after receiving it,
it is placed back in the queue so it can be fetched again. This is called the
visibility window.

You may set this visibility window on a per queue basis. For example, to set the
visibility to 15 seconds:

```
mongoDbQueue(db, 'queue', { visibility : 15 }, function(err, queue) {
    // the queue
})
```

All messages in this queue now have a visibility window of 15s, instead of the
default 30s.

### Delay Messages on Queue ###

Default: `0`

When a message is added to a queue, it is immediately available for retrieval.
However, there are times when you might like to delay messages coming off a queue.
ie. if you set delay to be `10`, then every message will only be available for
retrieval 10s after being added.

To delay all messages by 10 seconds, try this:

```
mongoDbQueue(db, 'queue', { delay : 10 }, function(err, queue) {
    // the queue
})
```

This is now the default for every message added to the queue.

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

### 0.6.0 (not yet released) ###

* [NEW] The msg.id is now returned on successful Queue.ping() and Queue.ack() calls
* [NEW] Call quueue.ensureIndexes(callback) to create them
* [CHANGE] When a message is acked, 'deleted' is now set to the current time (not true)
* [CHANGE] The queue is now created synchronously

### 0.5.0 (2014-03-21) ###

* [NEW] Now adds two indexes onto the MongoDB collection used for the message
* [CHANGE] The queue is now created by calling the async exported function
* [DOC] Update to show how the queues are now created

### 0.4.0 (2014-03-20) ###

* [NEW] Ability to ping retrieved messages a. la. 'still alive' and 'extend visibility'
* [CHANGE] Removed ability to have different queues in the same collection
* [CHANGE] All queues are now stored in their own collection
* [CHANGE] When acking a message, only need ack (no longer need id)
* [TEST] Added test for pinged messages
* [DOC] Update to specify each queue will create it's own MongoDB collection
* [DOC] Added docs for option `delay`
* [DOC] Added synopsis for Queue.ping()
* [DOC] Removed use of msg.id when calling Queue.ack()

### 0.3.1 (2014-03-19) ###

* [DOC] Added documentation for the `delay` option

### 0.3.0 (2014-03-19) ###

* [NEW] Return the message id when added to a queue
* [NEW] Ability to set a default delay on all messages in a queue
* [FIX] Make sure old messages (outside of visibility window) aren't deleted when acked
* [FIX] Internal: Fix `queueName`
* [TEST] Added test for multiple messages
* [TEST] Added test for delayed messages

### 0.2.1 (2014-03-19) ###

* [FIX] Fix when getting messages off an empty queue
* [NEW] More Tests

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
