'use strict'

const { SERVICE_PORT } = process.env;

const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');
const http2 = require('http2');

const server = http2.createServer()
;
/**
 * Service.
 * Put a new object into the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {Stream} stream Buffer of file data (multer)
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */

server.on('stream', async (stream, headers) => {
  try {
    const PATH = headers[':path']
    const url = new URL(`http://localhost:8101${PATH}`);

    const bucketName = url.searchParams.get('bucketName');
    const objectName = url.searchParams.get('objectName');
    const requesterId = url.searchParams.get('requesterId');

    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) {
        stream.respond({':status': 404})
        return stream.end()
      }


      const manageAuth = new Grants(requesterId, 'put', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) {
        stream.respond({':status': 403})
        return stream.end()
      }
    }

      const [statusCode, _] = await bucket.uploadFile(bucketName, objectName, requesterId, stream);
      stream.respond({ ':status': statusCode });
      return stream.end()
  } catch (err) {
    stream.respond({':status': 500})
    return stream.end()
  }
});

server.listen(SERVICE_PORT);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});