const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');
const PROTO_PATH = cwd + '/clients/delete-key/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);

if (process.env.NODE_ENV === "development") {
  var DELETE_KEY_SVC_HOST = 'localhost';
  var DELETE_KEY_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var DELETE_KEY_SVC_HOST = process.env.DELETE_KEY_SVC_HOST;
  var DELETE_KEY_SVC_PORT  = process.env.DELETE_KEY_SVC_PORT;
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  clntcert: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.crt')),
  clntkey: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.key'))
};

const client = new protoDescriptor.services.DeleteKey(
  `${DELETE_KEY_SVC_HOST}:${DELETE_KEY_SVC_PORT}`,
  grpc.credentials.createSsl(tlsCreds.cacert, tlsCreds.clntkey, tlsCreds.clntcert),
  {'grpc.ssl_target_name_override' : 'client.objstorage.local'}
);

module.exports = client;