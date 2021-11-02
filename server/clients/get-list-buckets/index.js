const cwd = require("process").cwd();
const { GET_LIST_BUCKETS_SVC_HOST, GET_LIST_BUCKETS_SVC_PORT } = process.env;
const PROTO_PATH = cwd + '/clients/get-list-buckets/index.proto';
const grpc = require("@grpc/grpc-js");
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const client = new protoDescriptor.services.GetListBuckets(
  `${GET_LIST_BUCKETS_SVC_HOST}:${GET_LIST_BUCKETS_SVC_PORT}`,
  grpc.credentials.createInsecure()
);

module.exports = client;