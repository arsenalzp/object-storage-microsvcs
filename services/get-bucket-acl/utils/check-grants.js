const clientAuthSvc = require('../clients/svc');

function isAuth(ent_id, ent_type, op, user) {
  const session = clientAuthSvc.connect();

  return new Promise((resolve, reject) => {
    session.on('error', (err) => { 
      reject(500)
    });
    
    // instantiate HTTP/2 stream by requesting remote URL
    const serviceResp = session.request({
      ':path': `/auth/?id=${ent_id}&type=${ent_type}&op=${op}&userName=${user}`,
      ':method' : 'GET',
      ':scheme': 'https'
    });

    // The 'response' event is emitted when a response HEADERS frame has been received for this stream from the connected HTTP/2 server. 
    serviceResp.on('response', (headers) => {
      const statusCode = headers[':status'];
      resolve(statusCode)
    });
  });
}

module.exports = isAuth;