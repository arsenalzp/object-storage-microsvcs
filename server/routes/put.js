'use strict'

const clientCreateBucket = require('../clients/create-bucket');
const clientPutObjectAcl = require('../clients/put-object-acl');
const clientPutBucketAcl = require('../clients/put-bucket-acl');
const clientPutObject = require('../clients/put-object');

const User = require('../models/user');
const user = new User();
user.setUserId();

/**
 * PUT route.
 * 
 * invoke the following services:
 * - createBucket to create a new bucket
 * - putObjectACL to put a new ACLs for the object
 * - putBucketACL to put a new ACLs for the bucket
 * - putObject to put a new object into the bucket
 * 
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @returns {Object} HTTP response or Error
 */
async function put(req, res, next) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.objectName ? req.params.objectName : null; // retrieve a file name
  const aclMethod = req.query.acl ? req.query.acl : null; // retrieve acl query param
  const key = req.key; // Authorization signature

  try {
    const requesterUName = user.getUserId(key);

    if (!requesterUName) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    if (bucketName && !objectName && !aclMethod) {    
      /**
       * bucketName is defined, objectName, aclMethod are null
       * invoke createBucket service
       * to create a new bucket
       */
      clientCreateBucket.CreateBucket(
        { bucketName, requesterUName },
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }
          
          const { statusCode } = resp;

          return res.status(statusCode).end()
        }
      );
    } else if (bucketName && objectName && aclMethod) {
      /**
       * bucketName, objectName, aclMethod are defined
       * invoke putObjectACL
       * to put a new ACLs for the object in the bucket
       */

      const targetGrants = req.acl;
      const targetUName = req.targetUName;

      if (!targetGrants || !targetUName) {
        const err = new Error('InvalidArgument')
        err.statusCode = 400;
        return next(err)
      }

      const serializedGrants = JSON.stringify(targetGrants); // gRPC call requires strings

      clientPutObjectAcl.PutObjectAcl(
        {bucketName, objectName, requesterUName, targetUName, targetGrants: serializedGrants},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode } = resp;

          return res.status(statusCode).end()
        }
      );

    } else if (bucketName && !objectName && aclMethod) {
      /**
       * bucketName, aclMethod are defned, objectName is null
       * invoke putBucketACL service
       * to put a new ACLs for the bucket
       */
      const targetGrants = req.acl;
      const targetUName = req.targetUName;

      if (!targetGrants || !targetUName) {
        const err = new Error('InvalidArgument')
        err.statusCode = 400;
        return next(err)
      }
      
      const serializedGrants = JSON.stringify(targetGrants); // gRPC requires strings

      clientPutBucketAcl.PutBucketAcl(
        {bucketName, requesterUName, targetUName, targetGrants: serializedGrants},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode } = resp;

          return res.status(statusCode).end()
        }
      );
    } else if (bucketName && objectName && !aclMethod) {
      /**
       * bucketName, objectName are defined, aclMethod is null
       * invoke putObject service
       * to put (upload) a new object into the bucket
       */

      // if file property if null - set status code 400
      if (!req.file) {
        const err = new Error('InvalidArgument')
        err.statusCode = 400;
        return next(err)
      }

      const { buffer: objBuffer } = req.file;

      // connect to remote service and instantiate HTTP/2 session
      const session = clientPutObject.connect();
      session.on('error', (err) => { 
        err.statusCode = 500;
        return next(err)
      });
      
      // instantiate HTTP/2 stream by requesting remote URL
      const serviceResp = session.request({
        ':path': `/post/?bucketName=${bucketName}&objectName=${objectName}&requesterUName=${requesterUName}`,
        ':method' : 'POST',
        ':scheme': 'https'
      });

      serviceResp.write(objBuffer);
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
    } else {
      /**
       * if services didn't match
       * set status code 405
       */
       const err = new Error('MethodNotAllowed')
       err.statusCode = 405
       return next(err)
    }
  } catch (err) {
    err.type = 'routes';
    err.statusCode = 500;
    next(err)
  }
}

module.exports = put;