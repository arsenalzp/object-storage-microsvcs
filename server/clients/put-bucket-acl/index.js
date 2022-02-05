const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');
const PROTO_PATH = cwd + '/clients/put-bucket-acl/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);

if (process.env.NODE_ENV === "development") {
  var PUT_BUCKET_ACL_SVC_HOST = 'localhost';
  var PUT_BUCKET_ACL_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var PUT_BUCKET_ACL_SVC_HOST = process.env.PUT_BUCKET_ACL_SVC_HOST;
  var PUT_BUCKET_ACL_SVC_PORT  = process.env.PUT_BUCKET_ACL_SVC_PORT;
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  clntcert: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.crt')),
  clntkey: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.key'))
};

const client = new protoDescriptor.services.PutBucketAcl(
  `${PUT_BUCKET_ACL_SVC_HOST}:${PUT_BUCKET_ACL_SVC_PORT}`,
  grpc.credentials.createSsl(tlsCreds.cacert, tlsCreds.clntkey, tlsCreds.clntcert),
  {'grpc.ssl_target_name_override' : 'client.objstorage.local'}
);

module.exports = client;