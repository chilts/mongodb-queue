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
    var queue = mongoDbQueue(db, 'my-queue')
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
queue.ack(msg.ack, function(err, id) {
    // This msg removed from queue for this ack.
    // The 'id' of the message is returned, useful for logging.
})
```

By default, all old messages - even processed ones - are left in MongoDB. This is so that
you can go and analyse them if you want. However, you can call the following function
to remove processed messages:

```js
queue.clean(function(err) {
    // All processed (ie. acked) messages have been deleted
})
```

And if you haven't already, you should call this to make sure indexes have
been added in MongoDB. Of course, if you've called this once (in some kind
one-off script) you don't need to call it in your program. Of course, check
the changelock to see if you need to update them with new releases:

```js
queue.ensureIndexes(function(err) {
    // The indexes needed have been added to MongoDB.
})
```

## Creating a Queue ##

To create a queue, call the exported function with the `MongoClient`, the name
and a set of opts. The MongoDB collection used is the same name as the name
passed in:

```
var mongoDbQueue = require('mongodb-queue')

// an instance of a queue
var queue1 = mongoDbQueue(db, 'a-queue')
// another queue which uses the same collection as above
var queue2 = mongoDbQueue(db, 'a-queue')
```

Note: but don't use the same queue name twice with different options, otherwise things might get confusing.

To pass options, try this:

```
var resizeQueue = mongoDbQueue(db, 'resize-queue', { visibility : 30, delay : 15 })
```

## Options ##

### name ###

This is the name of the MongoDB Collection you wish to use to store the messages.
Each queue you create will be it's own collection.

e.g.

```
var resizeQueue = mongoDbQueue(db, 'resize-queue')
var notifyQueue = mongoDbQueue(db, 'notify-queue')
```

This will create two collections in MongoDB called `resize-image` and `notify-owner`.

### visibility - Message Visibility Window ###

Default: `30`

By default, if you don't ack a message within the first 30s after receiving it,
it is placed back in the queue so it can be fetched again. This is called the
visibility window.

You may set this visibility window on a per queue basis. For example, to set the
visibility to 15 seconds:

```
var queue = mongoDbQueue(db, 'queue', { visibility : 15 })
```

All messages in this queue now have a visibility window of 15s, instead of the
default 30s.

### delay - Delay Messages on Queue ###

Default: `0`

When a message is added to a queue, it is immediately available for retrieval.
However, there are times when you might like to delay messages coming off a queue.
ie. if you set delay to be `10`, then every message will only be available for
retrieval 10s after being added.

To delay all messages by 10 seconds, try this:

```
var queue = mongoDbQueue(db, 'queue', { delay : 10 })
```

This is now the default for every message added to the queue.

### deadQueue - Dead Message Queue ###

Default: none

Messages that have been retried over `maxRetries` will be pushed to this queue so you can
automatically see problem messages.

Pass in a queue (that you created) onto which these messages will be pushed:

```js
var deadQueue = mongoDbQueue(db, 'dead-queue')
var queue = mongoDbQueue(db, 'queue', { deadQueue : deadQueue })
```

If you pop a message off the `queue` over `maxRetries` times and have still not acked it,
it will be pushed onto the `deadQueue` for you. This happens when you `.get()` (not when
you miss acking a message in it's visibility window). By doing it when you call `.get()`,
the unprocessed message will be received, pushed to the `deadQueue`, acked off the normal
queue and `.get()` will check for new messages prior to returning you one (or none).

### maxRetries - Maximum Retries per Message ###

Default: 5

This option only comes into effect if you pass in a `deadQueue` as shown above. What this
means is that if an item is popped off the queue `maxRetries` times (e.g. 5) and not acked,
it will be moved to this `deadQueue` the next time it is tried to pop off. You can poll your
`deadQueue` for dead messages much like you can poll your regular queues.

The payload of the messages in the dead queue are the entire messages returned when `.get()`ing
them from the original queue.

e.g.

Given this message:

```
msg = {
  id: '533b1eb64ee78a57664cc76c',
  ack: 'c8a3cc585cbaaacf549d746d7db72f69',
  payload: 'Hello, World!',
  tries: 1 }
}
```

If it is not acked within the `maxRetries` times, then when you receive this same message
from the `deadQueue`, it may look like this:

```
msg = {
  id: '533b1ecf3ca3a76b667671ef',
  ack: '73872b204e3f7be84050a1ce82c5c9c0',
  payload: {
    id: '533b1eb64ee78a57664cc76c',
    ack: 'c8a3cc585cbaaacf549d746d7db72f69',
    payload: 'Hello, World!',
    tries: 5 }
  },
  tries: 1
}
```

Notice that the payload from the `deadQueue` is exactly the same as the original message
when it was on the original queue (except with the number of tries set to 5).

## Operations ##

### .add() ###

You can add a string to the queue:

```js
queue.add('Hello, World!', function(err, id) {
    // Message with payload 'Hello, World!' added.
    // 'id' is returned, useful for logging.
})
```

Or add an object of your choosing:

```js
queue.add({ err: 'E_BORKED', msg: 'Broken' }, function(err, id) {
    // Message with payload { err: 'E_BORKED', msg: 'Broken' } added.
    // 'id' is returned, useful for logging.
})
```

You can delay individual messages from being visible by passing the `delay` option:

```js
queue.add('Later', { delay: 120 }, function(err, id) {
    // Message with payload 'Later' added.
    // 'id' is returned, useful for logging.
    // This message won't be available for getting for 2 mins.
})
```

### .get() ###

Retrieve a message from the queue:

```js
queue.get(function(err, msg) {
    // You can now process the message
})
```

You can choose the visibility of an individual retrieved message by passing the `visibility` option:

```js
queue.get({ visibility: 10 }, function(err, msg) {
    // You can now process the message for 10s before it goes back into the queue if not ack'd instead of the duration that is set on the queue in general
})
```

Message will have the following structure:

```js
{
  id: '533b1eb64ee78a57664cc76c', // ID of the message
  ack: 'c8a3cc585cbaaacf549d746d7db72f69', // ID for ack and ping operations
  payload: 'Hello, World!', // Payload passed when the message was addded
  tries: 1 // Number of times this message has been retrieved from queue without being ack'd
}
```

### .ack() ###

After you have received an item from a queue and processed it, you can delete it
by calling `.ack()` with the unique `ackId` returned:

```js
queue.get(function(err, msg) {
    queue.ack(msg.ack, function(err, id) {
        // this message has now been removed from the queue
    })
})
```

### .ping() ###

After you have received an item from a queue and you are taking a while
to process it, you can `.ping()` the message to tell the queue that you are
still alive and continuing to process the message:

```js
queue.get(function(err, msg) {
    queue.ping(msg.ack, function(err, id) {
        // this message has had it's visibility window extended
    })
})
```

You can also choose the visibility time that gets added by the ping operation by passing the `visibility` option:

```js
queue.get(function(err, msg) {
    queue.ping(msg.ack, { visibility: 10 }, function(err, id) {
        // this message has had it's visibility window extended by 10s instead of the visibilty set on the queue in general
    })
})
```

### .total() ###

Returns the total number of messages that has ever been in the queue, including
all current messages:

```js
queue.total(function(err, count) {
    console.log('This queue has seen %d messages', count)
})
```

### .size() ###

Returns the total number of messages that are waiting in the queue.

```js
queue.size(function(err, count) {
    console.log('This queue has %d current messages', count)
})
```

### .inFlight() ###

Returns the total number of messages that are currently in flight. ie. that
have been received but not yet acked:

```js
queue.inFlight(function(err, count) {
    console.log('A total of %d messages are currently being processed', count)
})
```

### .done() ###

Returns the total number of messages that have been processed correctly in the
queue:

```js
queue.done(function(err, count) {
    console.log('This queue has processed %d messages', count)
})
```

### .clean() ###

Deletes all processed mesages from the queue. Of course, you can leave these hanging around
if you wish, but delete them if you no longer need them. Perhaps do this using `setInterval`
for a regular cleaning:

```js
queue.clean(function(err) {
    console.log('The processed messages have been deleted from the queue')
})
```

### Notes about Numbers ###

If you add up `.size() + .inFlight() + .done()` then you should get `.total()`
but this will only be approximate since these are different operations hitting the database
at slightly different times. Hence, a message or two might be counted twice or not at all
depending on message turnover at any one time. You should not rely on these numbers for
anything but are included as approximations at any point in time.

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

## Note on MongoDB Version ##

When using MongoDB v2.6 and the v1.3.23 version of the mongodb driver from npm, I was getting
a weird error similar to "key $exists must not start with '$'". Yes, very strange. Anyway, the fix
is to install a later version of the driver. I have tried this with v1.4.9 and it seems ok.

## Releases ##

Yay! We made it to v1.0. This means that development may slow down but to be honest, I have pretty
much all of the functionality I want in this thing done. Thanks to everyone for feedback, reports
and pull requests.

### 1.0.0 (2014-10-30) ###

* [NEW] Ability to specify a visibility window when getting a message (thanks https://github.com/Gertt)

### 0.9.1 (2014-08-28) ###

* [NEW] Added .clean() method to remove old (processed) messages
* [NEW] Add 'delay' option to queue.add() so individual messages can be delayed separately
* [TEST] Test individual 'delay' option for each message

### 0.7.0 (2014-03-24) ###

* [FIX] Fix .ping() so only visible/non-deleted messages can be pinged
* [FIX] Fix .ack() so only visible/non-deleted messages can be pinged
* [TEST] Add test to make sure messages can't be acked twice
* [TEST] Add test to make sure an acked message can't be pinged
* [INTERNAL] Slight function name changes, nicer date routines

### 0.6.0 (2014-03-22) ###

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
