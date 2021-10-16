'use strict'

const { SERVICE_PORT } = process.env;

const bucket = require('./models/bucket');

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
server.addService(svc.GetListBuckets.service,
  {
    "GetListBuckets": getListBuckets
  }
);

async function getListBuckets({request}, cb) {
  const { userId } = request;
  try {
      const [statusCode, buckets] = await bucket.getBuckets(userId); 
      const serializedBuckets = JSON.stringify(buckets);

      return cb(null, {statusCode, buckets: serializedBuckets})
    } catch (err) {
      return cb(err, null)
    }
}
