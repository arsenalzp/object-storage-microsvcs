'use strict'

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
  srvcert: fs.readFileSync(path.join(__dirname, 'tls', 'tls.crt')),
  srvkey: fs.readFileSync(path.join(__dirname, 'tls', 'tls.key'))
};

const server = new grpc.Server();
server.bindAsync(
  `0.0.0.0:${SERVICE_PORT}`,
  grpc.ServerCredentials.createSsl(tlsCreds.cacert, [{private_key: tlsCreds.srvkey, cert_chain:tlsCreds.srvcert}]), 
  () => {
    server.start()
  }
);
server.addService(svc.GetBucketMeta.service,
  {
    "GetBucketMeta": getBucketMeta
  }
);

/**
 * Service.
 * Get metadata of a bucket: 
 * - does bucket exist?
 * - is user authorized to access object ?
 * 
 * @param {String} bucketName bucket name
 * @param {String} requesterUName requester ID
 * @returns {Promise<Object>} resolve Object
 */

async function getBucketMeta({ request }, cb) {
  const { bucketName, requesterUName } = request;

  try {
    const statusCode = await checkAuth(bucketName, "", "B", "get", requesterUName);
    if (statusCode !== 200) return cb(null, { statusCode: statusCode })

    return cb(null, { statusCode: 200 })
  } catch (err) {
    console.log('%s %s', new Date().toLocaleString(), err);
    
    return cb(err, { statusCode: 500 })
  }
}

console.log('%s Listening on %s port', new Date().toLocaleString(), SERVICE_PORT);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});