const cwd = require("process").cwd();
const { CREATE_BUCKET_SVC_HOST, CREATE_BUCKET_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/create-bucket/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.CreateBucket(
  `${CREATE_BUCKET_SVC_HOST}:${CREATE_BUCKET_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;