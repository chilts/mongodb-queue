const mongodb = require('mongodb')

const url = 'mongodb://localhost:27017/'
const dbName = 'mongodb-queue'

const collections = [
  'default',
  'delay',
  'multi',
  'visibility',
  'clean',
  'ping',
  'stats1',
  'stats2',
  'queue',
  'dead-queue',
  'queue-2',
  'dead-queue-2',
]

module.exports = function(callback) {
  const client = new mongodb.MongoClient(url, { useNewUrlParser: true })

  client.connect().then(() => {
    const db = client.db(dbName)

    // empty out some collections to make sure there are no messages
    let done = 0
    collections.forEach((col) => {
      db.collection(col).deleteMany().then(() => {
        done += 1
        if ( done === collections.length ) {
          callback(client, db)
        }
      })
    })
  }).catch(err => { throw err });
}
