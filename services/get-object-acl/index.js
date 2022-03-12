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
  const { bucketName, objectName, requesterUName } = request;
  try {
    {
      const statusCode = await checkAuth(bucketName, "", "B", "get", requesterUName);
      if (statusCode === 403) return cb(null, { statusCode: 403, access: null })
      if (statusCode === 404) return cb(null, { statusCode: 404, access: null })
    }
    
    const statusCode = await checkAuth(bucketName, objectName, "O", "get", requesterUName);
    if (statusCode === 403) return cb(null, { statusCode: 403, access: null })
    if (statusCode === 404) return cb(null, { statusCode: 404, access: null })
    
    const findResult = await bucket.getObjectACL(bucketName, objectName);
    const objectACL = JSON.stringify(findResult);

    return cb(null, { objectACL, statusCode: 200 })
  } catch (err) {
    return cb(err, null)
  }
}
