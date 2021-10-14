'use strict'

const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');

const cwd = require('process').cwd();
const PROTO_PATH = cwd + '/proto/index.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;

const server = new grpc.Server();
server.bindAsync(
  "0.0.0.0:8004", 
  grpc.ServerCredentials.createInsecure(), 
  () => {
    server.start()
  }
);
server.addService(svc.DeleteKey.service,
  {
    "DeleteKey": deleteKey
  }
);

async function deleteKey({ request }, cb) {
  const { bucketName, objectName, userId } = request;

  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return cb(null, {statusCode:404})

      const manageAuth = new Grants(userId, 'del', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return cb(null, {statusCode:403})
    }

    const [isFileExists, objectId] = await bucket.isFileExists(bucketName, objectName);
    if (!isFileExists) return cb(null, {statusCode:404})
      
    const [statusCode, _] = await bucket.deleteKey(bucketName, objectName, objectId);

    cb(null, {statusCode})
  } catch (err) {
    cb(err, null)
  }
}

module.exports = deleteKey;