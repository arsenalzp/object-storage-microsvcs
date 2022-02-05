'use strict'

const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');

const cwd = require('process').cwd();
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === "development") {
  var SERVICE_PORT = 7001
}

if (process.env.NODE_ENV === "production") {
  var SERVICE_PORT = process.env.SERVICE_PORT
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  srvcert: fs.readFileSync(path.join(__dirname, 'tls', 'server.objstorage.crt')),
  srvkey: fs.readFileSync(path.join(__dirname, 'tls', 'server.objstorage.key'))
};

const OPTIONS = {
  key: tlsCreds.srvkey,
  cert: tlsCreds.srvcert,
  ca: tlsCreds.cacert,
  maxSessionMemory: 2048,
  peerMaxConcurrentStreams: 1024,
  unknownProtocolTimeout: 1000
};

const server = http2.createSecureServer(OPTIONS);

server.on('stream', async (stream, headers) => {
  try {
    const PATH = headers[':path']
    const url = new URL(`http://localhost:7001${PATH}`);

    const bucketName = url.searchParams.get('bucketName');
    const objectName = url.searchParams.get('objectName');
    const requesterId = url.searchParams.get('requesterId');
    const [_, isExist] = await bucket.isBucketExists(bucketName);
    if (!isExist) { 
      stream.respond({':status': 404})
      return stream.end()
    }

    {
      const [_, grants] = await bucket.getObjectOrBucketACL(bucketName, null); // retrieve grants
      const manageAuth = new Grants(requesterId, grants, null, null);
      const isAuthorized = manageAuth.checkAccess('get'); // check user grants against GET method
      if (!isAuthorized) {
        stream.respond({':status': 403})
        return stream.end()
      }
    }
    
    {
      const [isFileExists, _] = await bucket.isFileExists(bucketName, objectName);
      if (!isFileExists) {
        stream.respond({':status': 404})
        return stream.end()
      }
    }

    const [statusCode, readableStream] = await bucket.getFile(bucketName, objectName);
    stream.respond({ ':status': statusCode });
    
    return readableStream.pipe(stream)
  } catch(err) {
    stream.respond({':status': 500})
    return stream.end()
  }
});

server.on('error', (err) => {
  console.log(err);
});

server.on('tlsClientError', (msg) => {
  console.log(msg);
})

server.listen(SERVICE_PORT);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});