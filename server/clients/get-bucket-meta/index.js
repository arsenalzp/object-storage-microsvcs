const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');
const PROTO_PATH = cwd + '/clients/get-bucket-meta/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);

if (process.env.NODE_ENV === "development") {
  var GET_BUCKET_META_SVC_HOST = 'localhost';
  var GET_BUCKET_META_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var GET_BUCKET_META_SVC_HOST = process.env.GET_BUCKET_META_SVC_HOST;
  var GET_BUCKET_META_SVC_PORT  = process.env.GET_BUCKET_META_SVC_PORT;
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  clntcert: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.crt')),
  clntkey: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.key'))
};

const client = new protoDescriptor.services.GetBucketMeta(
  `${GET_BUCKET_META_SVC_HOST}:${GET_BUCKET_META_SVC_PORT}`,
  grpc.credentials.createSsl(tlsCreds.cacert, tlsCreds.clntkey, tlsCreds.clntcert),
  {'grpc.ssl_target_name_override' : 'client.objstorage.local'}
);

module.exports = client;