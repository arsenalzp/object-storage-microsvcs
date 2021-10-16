const { DB_HOST, DB_PORT } = process.env;

const URL = `mongodb://${DB_HOST}:${DB_PORT}`;

const { MongoClient, GridFSBucket } = require('mongodb');
const options = {
  useUnifiedTopology: true,
  maxPoolSize: 200
}


const mongoClient = new MongoClient(URL, options);
exports.client = async () => { 
  try {
    return await mongoClient.connect() 
  } catch(err) {
    console.log(err)
  }
}

exports.gridFs = (db, options) => {
  const gridFs = new GridFSBucket (db, options);
  return gridFs
}
