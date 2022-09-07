const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');
const PROTO_PATH = cwd + '/clients/put-object-acl/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);

if (process.env.NODE_ENV === "development") {
  var PUT_OBJECT_ACL_SVC_HOST = 'localhost';
  var PUT_OBJECT_ACL_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var PUT_OBJECT_ACL_SVC_HOST = process.env.PUT_OBJECT_ACL_SVC_HOST;
  var PUT_OBJECT_ACL_SVC_PORT  = process.env.PUT_OBJECT_ACL_SVC_PORT;
}

const tlsCreds = {
  ca: fs.readFileSync(path.join(__dirname, '..','tls', 'rootCA.crt')),
  cert: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.crt')),
  key: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.key'))
};

const client = new protoDescriptor.services.PutObjectAcl(
  `${PUT_OBJECT_ACL_SVC_HOST}:${PUT_OBJECT_ACL_SVC_PORT}`,
  grpc.credentials.createSsl(tlsCreds.ca, tlsCreds.key, tlsCreds.cert)
);

module.exports = client;