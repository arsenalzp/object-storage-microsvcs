const cwd = require("process").cwd();
const { PUT_OBJECT_ACL_SVC_HOST, PUT_OBJECT_ACL_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/put-object-acl/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.PutObjectAcl(
  `${PUT_OBJECT_ACL_SVC_HOST}:${PUT_OBJECT_ACL_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;