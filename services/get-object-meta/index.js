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
server.addService(svc.GetObjectMeta.service,
  {
    "GetObjectMeta": getObjectMeta
  }
);

/**
 * Service.
 * Get metadata of object: 
 * - is object exist?
 * - is user authorized to access object ?
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} requesterUName requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function getObjectMeta({ request }, cb) {
  const { bucketName, objectName, requesterUName } = request;

  try {
    const [_, doc] = await bucket.isBucketExists(bucketName);
    if (!doc) return cb(null, {statusCode: 404})
    const {_id} = doc;

    {
    const statusCode = await checkAuth(_id, "B", "get", requesterUName);
    if (statusCode === 403) return cb(null, { statusCode: 403, grants: null })
    }

    {
    const [_, doc]  = await bucket.isFileExists(bucketName, objectName)
    if (!doc) return cb(null, {statusCode: 404})
    const {_id} = doc;
    
    const statusCode = await checkAuth(_id, "O", "get", requesterUName);
    if (statusCode === 403) return cb(null, { statusCode: 403, grants: null })
    }

    return cb(null, {statusCode: 200})
    
  } catch (err) {
    return cb(err, null)
  }
}

