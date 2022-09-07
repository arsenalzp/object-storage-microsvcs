const clientAuthSvc = require('../clients/svc');

function isAuth(bucketName, objectName, ent_type, op, user) {
  const session = clientAuthSvc.connect();

  return new Promise((resolve, reject) => {
    session.on('error', (err) => { 
      reject(err)
    });
    
    // instantiate HTTP/2 stream by requesting remote URL
    const serviceResp = session.request({
      ':path': `/auth/?bucketName=${bucketName}&objectName=${objectName}&type=${ent_type}&op=${op}&userName=${user}`,
      ':method' : 'GET',
      ':scheme': 'https'
    });

    // The 'response' event is emitted when a response HEADERS frame has been received for this stream from the connected HTTP/2 server. 
    serviceResp.on('response', (headers) => {
      const statusCode = headers[':status'];
      resolve(statusCode)
    });

    serviceResp.on('error', (err) => {
      reject(err)
    });
  });
}

module.exports = isAuth;