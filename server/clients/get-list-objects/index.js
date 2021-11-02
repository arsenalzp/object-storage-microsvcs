const cwd = require("process").cwd();
const { GET_LIST_OBJECTS_SVC_HOST, GET_LIST_OBJECTS_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/get-list-objects/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.GetListObjects(
  `${GET_LIST_OBJECTS_SVC_HOST}:${GET_LIST_OBJECTS_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;