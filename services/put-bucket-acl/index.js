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
server.addService(svc.PutBucketAcl.service,
  {
    "PutBucketAcl": putBucketACL
  }
);

async function putBucketACL({ request }, cb) {
  const { bucketName, requesterId, targetUserId, targetGrants } = request;
  let manageAuth = null;

  try {
    {
      const [_, bucketGrants] = await bucket.isBucketExists(bucketName);
      if (!bucketGrants) return cb(null, {statusCode:404})

      manageAuth = new Grants(requesterId, 'put', bucketGrants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return cb(null, {statusCode:403})
    }

    const modifiedGrants = manageAuth.set(targetUserId, targetGrants); // set bucket ACL
    const [statusCode, _] = await bucket.putObjectOrBucketACL(bucketName, null, modifiedGrants);

    return cb(null, {statusCode})
  } catch (err) {
    return cb(err, null)
  }
}
