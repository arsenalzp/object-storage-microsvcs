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
server.addService(svc.GetBucketMeta.service,
  {
    "GetBucketMeta": getBucketMeta
  }
);

async function getBucketMeta({ request }, cb) {
  const { bucketName, userId } = request;

  try {
    const [_, isExist] = await bucket.isBucketExists(bucketName);
    if (!isExist) return cb(null, {statusCode: 404})

    {
    const [_, grants] = await bucket.getObjectOrBucketACL(bucketName, null); // retrieve grants
    const manageAuth = new Grants(userId, grants, null, null);
    const isAuthorized = manageAuth.checkAccess('get'); // check user grants against GET method
    if (!isAuthorized) return cb(null, {statusCode: 403})

    return cb(null, {statusCode: 200})
    }
  } catch (err) {
    return cb(err, null)
  }
}
