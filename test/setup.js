var mongodb = require('mongodb')

var conStr = 'mongodb://localhost:27017/mongodb-queue'

module.exports = function(callback) {
    mongodb.MongoClient.connect(conStr, function(err, db) {
        if (err) throw err
        var done = 0
        // let's empty out some collections to make sure there are no messages
        var collections = [
            'default', 'delay', 'multi', 'visibility', 'clean', 'ping',
            'stats1', 'stats2',
            'queue', 'dead-queue', 'queue-2', 'dead-queue-2'
        ]
        collections.forEach(function(col) {
            db.collection(col).remove(function() {
                done += 1
                if ( done === collections.length ) {
                    callback(db)
                }
            })
        })
    })
}
