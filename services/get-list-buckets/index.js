'use strict'

const bucket = require('./models/bucket');
const path = require('path');
const cwd = require('process').cwd();
const fs = require('fs');
const PROTO_PATH = cwd + '/proto/index.proto';
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const protoDescriptor =  grpc.loadPackageDefinition(packageDef);
const svc = protoDescriptor.services;

if (process.env.NODE_ENV === "development") {
  var SERVICE_PORT = 7001
}

if (process.env.NODE_ENV === "production") {
  var SERVICE_PORT = process.env.SERVICE_PORT
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  srvcert: fs.readFileSync(path.join(__dirname, 'tls', 'tls.crt')),
  srvkey: fs.readFileSync(path.join(__dirname, 'tls', 'tls.key'))
};

const server = new grpc.Server();
server.bindAsync(
  `0.0.0.0:${SERVICE_PORT}`, 
  grpc.ServerCredentials.createSsl(tlsCreds.cacert, [{private_key: tlsCreds.srvkey, cert_chain:tlsCreds.srvcert}]), 
  () => {
    server.start()
  }
);
server.addService(svc.GetListBuckets.service,
  {
    "GetListBuckets": getListBuckets
  }
);

async function getListBuckets({request}, cb) {
  const { requesterUName } = request;
  try {
    const findResult = await bucket.getListBuckets(requesterUName); 
    const buckets = JSON.stringify(findResult);

     return cb(null, { statusCode: 200, buckets })
    } catch (err) {
      console.log('%s %s', new Date().toLocaleString(), err);
      
      return cb(err, { statusCode: 200 })
    }
}

console.log('%s Listening on %s port', new Date().toLocaleString(), SERVICE_PORT);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});