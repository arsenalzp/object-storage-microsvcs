'use strict'

const bucket = require('./models/bucket');

const path = require('path');
const cwd = require('process').cwd();
const fs = require('fs');
const PROTO_PATH = cwd + '/proto/index.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;
const checkAuth = require('./utils/check-grants');

if (process.env.NODE_ENV === "development") {
  var SERVICE_PORT = 7001
}

if (process.env.NODE_ENV === "production") {
  var SERVICE_PORT = process.env.SERVICE_PORT
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  srvcert: fs.readFileSync(path.join(__dirname, 'tls', 'server.objstorage.crt')),
  srvkey: fs.readFileSync(path.join(__dirname, 'tls', 'server.objstorage.key'))
};

const server = new grpc.Server();
server.bindAsync(
  `0.0.0.0:${SERVICE_PORT}`,
  grpc.ServerCredentials.createSsl(tlsCreds.cacert, [{private_key: tlsCreds.srvkey, cert_chain:tlsCreds.srvcert}]),
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

    const [_, doc] = await bucket.isBucketExists(bucketName);
    if (!doc) return cb(null, { statusCode:404, grants: null })
    const {_id} = doc;

    {
    const statusCode = await checkAuth(_id, "B", "get", userId);
    if (statusCode === 403) return cb(null, { statusCode: 403, grants: null })
    }

    {
    const [_, doc]  = await bucket.isFileExists(bucketName, objectName)
    if (!doc) return cb(null, { statusCode:404, grants: null })
    const {_id} = doc;

    const statusCode = await checkAuth(_id, "O", "get", userId);
    if (statusCode === 403) return cb(null, { statusCode: 403, grants: null })
    }
    
    const [statusCode, grants] = await bucket.getObjectOrBucketACL(bucketName, objectName);
    const serializedGrants = JSON.stringify(grants);

    return cb(null, {statusCode, grants: serializedGrants})
  } catch (err) {
    return cb(err, null)
  }
}
