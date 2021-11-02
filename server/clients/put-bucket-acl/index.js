const cwd = require("process").cwd();
const { PUT_BUCKET_ACL_SVC_HOST, PUT_BUCKET_ACL_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/put-bucket-acl/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.PutBucketAcl(
  `${PUT_BUCKET_ACL_SVC_HOST}:${PUT_BUCKET_ACL_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;