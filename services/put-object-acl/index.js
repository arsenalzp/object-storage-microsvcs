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
const parseGrants = require('./utils/mod-grants');

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
server.addService(svc.PutObjectAcl.service,
  {
    "PutObjectAcl": putObjectACL
  }
);

async function putObjectACL({ request }, cb) {
  const { bucketName, objectName, requesterUName, targetUName, targetGrants } = request;

  try {
    const statusCodeB = await checkAuth(bucketName, "", "B", "put", requesterUName);
    if (statusCodeB !== 200) return cb(null, { statusCode: statusCodeB })
    
    const statusCodeO = await checkAuth(bucketName, objectName, "O", "put", requesterUName);
    if (statusCodeO !== 200) return cb(null, { statusCode: statusCodeO })

    const modifiedGrants = parseGrants(targetGrants); // set object ACL
    await bucket.putObjectACL(bucketName, objectName, targetUName, modifiedGrants);

    return cb(null, { statusCode: 200 })
  } catch (err) {
    return cb(err, null)
  }
}

