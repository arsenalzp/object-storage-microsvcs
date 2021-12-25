const { DB_HOST, DB_PORT } = process.env;
// const DB_HOST = "localhost";
// const DB_PORT = 27017;

const URL = `mongodb://${DB_HOST}:${DB_PORT}`;

const { MongoClient, GridFSBucket } = require('mongodb');
const options = {
  useUnifiedTopology: true,
  maxPoolSize: 200
}

let connection = null;

const mongoClient = new MongoClient(URL, options);
exports.client = async () => { 
  try {
    if (!connection) {
      connection = await mongoClient.connect();
      return connection
    }
    return connection
  } catch(err) {
    throw err
  }
}

exports.gridFs = (db, options) => {
  const gridFs = new GridFSBucket (db, options);
  return gridFs
}
