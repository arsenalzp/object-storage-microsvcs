'use strict'

const clientDeleteKey = require('../clients/delete-key');
const User = require('../models/user');

const user = new User();
user.setUserId();

/**
 * DELETE route.
 * 
 * Invoke deleteKey service.
 * 
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @returns {Object} HTTP response or Error
 */
async function del(req, res, next) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.objectName; // retrieve a object name
  const key = req.key; // Authorization signature

  try { 
    const userId = user.getUserId(key);

    if (!userId) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    /**
     * invoke deleteKey service
     * to delete the object from the bucket
     */

     const session = clientDeleteKey.connect();
     session.on('error', (err) => { 
       err.statusCode = 500;
       return next(err)
     });
     
     // instantiate HTTP/2 stream by requesting remote URL
     const serviceResp = session.request({
       ':path': `/del/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`,
       ':method' : 'DELETE',
       ':scheme': 'https'
     });

     serviceResp.end();
     
     // The 'response' event is emitted when a response HEADERS frame has been received for this stream from the connected HTTP/2 server. 
     serviceResp.on('response', (headers) => {
       res.status(headers[':status'])

       return serviceResp.pipe(res)
     });

     serviceResp.on('close', () => {
       session.close()
     });

     serviceResp.on('error', (err) => { 
       err.statusCode = 500;
       return next(err)
     });
    //----
    //  const tlsCreds = {
    //   cacert: fs.readFileSync(path.join(cwd, 'clients', 'put-object', 'tls', 'rootCA.crt')),
    // }
    
    // const OPTIONS = {
    //   host: DELETE_KEY_SVC_HOST,
    //   port: DELETE_KEY_SVC_PORT,
    //   ca: tlsCreds.cacert,
    //   method: 'DELETE',
    //   path: `/${bucketName}/${objectName}`,
    //   rejectUnauthorized: false
    // };

    // const rq = https.request(OPTIONS, (rs) => {
    //   rs.read()
    //   res.statusCode = rs.statusCode;

    //   return res.end()
    // });

    // rq.end();

    // rq.on('error', (err) => {
    //   err.statusCode = 500;
    //   return next(err)
    // })

    // clientDeleteKey.DeleteKey(
    //   {bucketName, objectName, userId},
    //   (err, resp) => {

    //     if (err) {
    //       err.statusCode = 500;
    //       return next(err)
    //     }

    //     const {statusCode} = resp;

    //     return res.status(statusCode).end()
    //   }
    // );
  } catch (err) {
    err.type = 'routes';
    err.statusCode = 500;
    next(err)
  }
}

module.exports = del;
