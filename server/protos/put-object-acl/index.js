const cwd = require("process").cwd();
const PROTO_PATH = cwd + '/protos/create-bucket/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.CreateBucket(
  "0.0.0.0:8002",
  grpc.credentials.createInsecure()
);

module.exports = client;