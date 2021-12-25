'use strict'

const { SERVICE_PORT } = process.env;

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
  `0.0.0.0:${SERVICE_PORT}`, 
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
    const [_, isExist] = await bucket.isBucketExists(bucketName);
    if (!isExist) return cb(null, {statusCode:404})
    }

    {
    const [_, grants] = await bucket.getObjectOrBucketACL(bucketName, null); // retrieve grants
    const manageAuth = new Grants(userId, grants, null, null);
    const isAuthorized = manageAuth.checkAccess('del'); // check user grants against DEL method
    if (!isAuthorized) return cb(null, {statusCode:403})
    }

    const [isFileExists, objectId] = await bucket.isFileExists(bucketName, objectName);
    if (!isFileExists) return cb(null, {statusCode:404})
      
    const [statusCode, _] = await bucket.deleteKey(bucketName, objectName, objectId);

    return cb(null, {statusCode})
  } catch (err) {
    return cb(err, null)
  }
}
