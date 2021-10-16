'use strict'

const { SERVICE_PORT } = process.env;

const cwd = require('process').cwd();
const PROTO_PATH = cwd + '/proto/index.proto';
const bucket = require('./models/bucket');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { log } = require('console');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;

try {
  const server = new grpc.Server();
  server.bindAsync(
    `0.0.0.0:${SERVICE_PORT}`, 
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
} catch (err) {
  console.log(err);
}

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
    return cb(err, null)
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});