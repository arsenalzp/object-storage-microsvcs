'use strict'

const { SERVICE_PORT } = process.env;
const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');
const http2 = require('http2');

const server = http2.createServer({maxSessionMemory: 2048});
server.on('stream', async (stream, headers) => {
  try {
    const PATH = headers[':path']
    const url = new URL(`http://localhost:7001${PATH}`);

    const bucketName = url.searchParams.get('bucketName');
    const objectName = url.searchParams.get('objectName');
    const requesterId = url.searchParams.get('requesterId');
    const [_, grants] = await bucket.isBucketExists(bucketName);
    if (!grants) { 
      stream.respond({':status': 404})
      return stream.end()
    }

    const manageAuth = new Grants(requesterId, grants, null, null);
    const isAuthorized = manageAuth.checkAccess('get'); // check user grants against GET method
    if (!isAuthorized) {
      stream.respond({':status': 403})
      return stream.end()
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

server.listen(SERVICE_PORT);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});