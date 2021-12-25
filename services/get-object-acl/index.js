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
server.addService(svc.GetObjectAcl.service,
  {
    "GetObjectAcl": getObjectACL
  }
);

async function getObjectACL({request}, cb) {
  const { bucketName, objectName, userId } = request;
  try {

    const [_, isExist] = await bucket.isBucketExists(bucketName);
    if (!isExist) return cb(null, { statusCode:404, grants: null })
    
    {
      const [_, grants] = await bucket.getObjectOrBucketACL(bucketName, null); // retrieve grants
      const manageAuth = new Grants(userId, grants, null, null);
      const isAuthorized = manageAuth.checkAccess('get'); // check user grants against GET method
      if (!isAuthorized) return cb(null, { statusCode:403, grants: null })
    }

    {
      const [isObjectExists, _]  = await bucket.isFileExists(bucketName, objectName)
      if (!isObjectExists) return cb(null, { statusCode:404, grants: null })

      const [statusCode, grants] = await bucket.getObjectOrBucketACL(bucketName, objectName);
      const serializedGrants = JSON.stringify(grants);

      return cb(null, {statusCode, grants: serializedGrants})
    }
  } catch (err) {
    return cb(err, null)
  }
}
