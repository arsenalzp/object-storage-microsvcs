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
  "0.0.0.0:8002", 
  grpc.ServerCredentials.createInsecure(), 
  () => {
    server.start()
  }
);
server.addService(svc.PutObjectAcl.service,
  {
    "PutObjectAcl": putObjectACL
  }
);

//async function putObjectACL(bucketName, objectName, requesterId, targetUserId, targetGrants) {
async function putObjectACL({ request }, cb) {
  const { bucketName, objectName, requesterId, targetUserId, targetGrants } = request;
  let manageAuth = null;

  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return cb(null, {statusCode:404})

      manageAuth = new Grants(requesterId, 'put', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return cb(null, {statusCode:403})
    }

    {
      const [isFileExists, _] = await bucket.isFileExists(bucketName, objectName);
      if (!isFileExists) return cb(null, {statusCode:404})
    }

    const modifiedGrants = manageAuth.set(targetUserId, targetGrants); // set object ACL
    const [statusCode, _] = await bucket.putObjectOrBucketACL(bucketName, objectName, modifiedGrants);
    
    return cb(null, {statusCode})
  } catch (err) {
    cb(err, null)
  }
}

