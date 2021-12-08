'use strict'

const { SERVICE_PORT } = process.env;
//const SERVICE_PORT = 7001;

const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');
const http = require('http');
const {Readable} = require('stream');

const httpSrv = http.createServer(async (req, res) => {
  try {  
    const data = [];
    const url = new URL(`http://localhost:7001${req.url}`);

    const bucketName = url.searchParams.get('bucketName');
    const objectName = url.searchParams.get('objectName');
    const requesterId = url.searchParams.get('requesterId');

    const [_, grants] = await bucket.isBucketExists(bucketName);
    if (!grants) {
      res.statusCode = 404;
      return res.end()
    }

    const manageAuth = new Grants(requesterId, grants, null, null);
    const isAuthorized = manageAuth.checkAccess('put'); // check user grants against PUT method
    if (!isAuthorized) {
      res.statusCode = 403;
      return res.end()
    }

    req.on('data', (chunk) => {
      data.push(chunk)
    });

    req.on('end', async () => {
      const buf = Buffer.concat(data);

      // convert Buffer to readable stream
      const readable = new Readable()
      readable._read = () => {}
      readable.push(buf)
      readable.push(null)
      const [statusCode, _] = await bucket.uploadFile(bucketName, objectName, requesterId, readable);

      res.statusCode = statusCode;
      return res.end()
    });
    
    req.on('error', (err) => {
      throw err
    });

  } catch (err) {
    res.statusCode = 500
    return res.end()
  }
})

httpSrv.listen(SERVICE_PORT);


