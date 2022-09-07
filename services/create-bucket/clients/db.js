if (process.env.NODE_ENV === "development") {
  var DB_HOST = 'localhost';
  var DB_PORT = 27017;
}

if (process.env.NODE_ENV === "production") {
  var DB_HOST = process.env.DB_HOST;
  var DB_PORT = process.env.DB_PORT;
}

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
    throw {
      statusCode: 500,
      message: err.message
    }
  }
}

exports.gridFs = (db, options) => {
  const gridFs = new GridFSBucket (db, options);
  return gridFs
}
