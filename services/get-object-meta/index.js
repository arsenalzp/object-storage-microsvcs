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
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function getObjectMeta({ request }, cb) {
  const { bucketName, objectName, userId } = request;

  try {
    const [_, grants] = await bucket.isBucketExists(bucketName);
    if (!grants) return cb(null, {statusCode: 404})

    const manageAuth = new Grants(userId, 'get', grants);
    const isAuthorized = manageAuth.check(); // check user grants for certain method
    if (!isAuthorized) return cb(null, {statusCode: 403})

    {
      const [isFileExists, _]  = await bucket.isFileExists(bucketName, objectName)
      if (!isFileExists) return cb(null, {statusCode: 404})
    }

    return cb(null, {statusCode: 200})
    
  } catch (err) {
    return cb(err, null)
  }
}

