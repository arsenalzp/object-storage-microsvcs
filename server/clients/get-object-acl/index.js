const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');
const PROTO_PATH = cwd + '/clients/get-object-acl/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);

if (process.env.NODE_ENV === "development") {
  var GET_OBJECT_ACL_SVC_HOST = 'localhost';
  var GET_OBJECT_ACL_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var GET_OBJECT_ACL_SVC_HOST = process.env.GET_OBJECT_ACL_SVC_HOST;
  var GET_OBJECT_ACL_SVC_PORT  = process.env.GET_OBJECT_ACL_SVC_PORT;
}

const tlsCreds = {
  ca: fs.readFileSync(path.join(__dirname, '..','tls', 'rootCA.crt')),
  cert: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.crt')),
  key: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.key'))
};

const client = new protoDescriptor.services.GetObjectAcl(
  `${GET_OBJECT_ACL_SVC_HOST}:${GET_OBJECT_ACL_SVC_PORT}`,
  grpc.credentials.createSsl(tlsCreds.ca, tlsCreds.key, tlsCreds.cert)
);

module.exports = client;