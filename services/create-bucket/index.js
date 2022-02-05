'use strict'

const path = require('path');
const cwd = require('process').cwd();
const fs = require('fs');
const PROTO_PATH = cwd + '/proto/index.proto';
const bucket = require('./models/bucket');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { log } = require('console');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;

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

try {
  const server = new grpc.Server();
  server.bindAsync(
    `0.0.0.0:${SERVICE_PORT}`,
    grpc.ServerCredentials.createSsl(tlsCreds.cacert, [{private_key: tlsCreds.srvkey, cert_chain:tlsCreds.srvcert}]), 
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