const cwd = require("process").cwd();
const { DELETE_KEY_SVC_HOST, DELETE_KEY_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/delete-key/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.DeleteKey(
  `${DELETE_KEY_SVC_HOST}:${DELETE_KEY_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;