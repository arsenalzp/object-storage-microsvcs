const URL = 'mongodb://localhost:27017';

const { MongoClient, GridFSBucket } = require('mongodb');
const options = {
  useUnifiedTopology: true,
  maxPoolSize: 200
}


const client = new MongoClient(URL, options);
exports.client = client.connect();

exports.gridFs = (db, options) => {
  const gridFs = new GridFSBucket (db, options);
  return gridFs
}