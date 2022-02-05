const https = require('https');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === "development") {
  var PUT_OBJECT_SVC_HOST = 'localhost';
  var PUT_OBJECT_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var PUT_OBJECT_SVC_HOST = process.env.PUT_OBJECT_SVC_HOST;
  var PUT_OBJECT_SVC_PORT  = process.env.PUT_OBJECT_SVC_PORT;
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
};

async function PutObject(bucketName, objectName, userId, objBuffer) {
  const rq = https.request({
    host: PUT_OBJECT_SVC_HOST,
    port: PUT_OBJECT_SVC_PORT,
    ca: tlsCreds.cacert,
    method: 'POST',
    path: `/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`,
    rejectUnauthorized: false
  }, (rs) => {
    const timeout = setTimeout(() => {throw new Error('request timed out')}, 5000);
    rs.read();
    clearTimeout(timeout);
    
    return rs;
  });

  rq.write(objBuffer)
  rq.end()

  rq.on('error', (err) => {
    throw err
  });
}

module.exports = {
  PutObject
}