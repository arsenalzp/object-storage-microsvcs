'use strict'

const bucket = require('./models/bucket');
const Grants = require('./utils/check-grants');

const cwd = require('process').cwd();
const https = require('https');
const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');

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
};

const httpsSrv = https.createServer(OPTIONS, async (req, res) => {
  try {  
    const data = [];
    const url = new URL(`https://localhost:7001${req.url}`);

    const bucketName = url.searchParams.get('bucketName');
    const objectName = url.searchParams.get('objectName');
    const requesterId = url.searchParams.get('requesterId');

    {
      const [_, isExist] = await bucket.isBucketExists(bucketName);
      if (!isExist) {
        res.statusCode = 404;
        return res.end()
      }
    }

    const [_, grants] = await bucket.getObjectOrBucketACL(bucketName, null); // retrieve grants
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

httpsSrv.on('tlsClientError', (err) => {
	console.error(`TLS Client Error ${JSON.stringify(err)}`);
});

httpsSrv.on('error', (err) => {
  console.error(`HTTPS server error ${JSON.stringify(err)}`);
});

httpsSrv.listen(SERVICE_PORT);


