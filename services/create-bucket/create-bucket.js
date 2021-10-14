'use strict'

const cwd = require('process').cwd();
const PROTO_PATH = cwd + '/proto/index.proto';
const bucket = require('./models/bucket');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;

const server = new grpc.Server();
server.bindAsync(
  "0.0.0.0:8001", 
  grpc.ServerCredentials.createInsecure(), 
  () => {
    server.start()
  }
);
server.addService(svc.CreateBucket.service,
  {
    "CreateBucket": createBucket
  }
);

async function createBucket({request}, cb) {
  const {bucketName, userId} = request;
  try {
    const [_, isExist] = await bucket.isBucketExists(bucketName);

    if (!isExist) {
      const [statusCode, _] = await bucket.createBucket(bucketName, userId);
      if (statusCode === 201) return cb(null, {statusCode})
    }

    return cb(null, {statusCode:409})
  } catch(err) {
    cb(err, null)
  }
}