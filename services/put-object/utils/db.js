const URL = 'mongodb://localhost:27017';

const {MongoClient, GridFSBucket} = require('mongodb');
const { Connection } = require('mongodb/lib/core');
const options = {
  useUnifiedTopology: true,
  poolSize: 100,
  maxPoolSize: 200
}


const client = new MongoClient.connect(URL, options);
exports.client = client;

exports.gridFs = (db, options) => {
  const gridFs = new GridFSBucket (db, options);
  return gridFs
}