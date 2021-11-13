'use strict'

const clientGetBucketAcl = require('../clients/get-bucket-acl');
const clientGetListObjects = require('../clients/get-list-objects');
const clistnGetListBuckets = require('../clients/get-list-buckets');
const clientGetObjectAcl = require('../clients/get-object-acl');
const clientGetObject = require('../clients/get-object');
const User = require('../models/user');

const user = new User();
user.setUserId();

/**
 * GET route.
 * 
 * Invoke the following services:
 * - getListBuckets - get list of user buckets 
 * - getListObjects - get list of object in the particular bucket
 * - getObject - retrieve the object from the bucket
 * - getObjectACL - get object ACL
 * - getBucketACL - get bucket ACL
 * 
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @returns {Object} HTTP response or Error
 */
async function get(req, res, next) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.fileName ? req.params.fileName : null; // retrieve a file name
  const aclMethod = req.query.acl ? req.query.acl : null; // retrieve acl query param
  const key = req.key; // Authorization signature

  try {
    const userId = user.getUserId(key);

    if (!userId) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    if (!bucketName && !aclMethod) {
      /** 
       * bucketName, aclMethod are null
       * invoke getListBucket service
       * to get list of user's buckets
       */
      clistnGetListBuckets.GetListBuckets(
        {userId},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }
          
          const { statusCode, buckets } = resp;

          return res.status(statusCode).end(buckets)
        }
      )
    } else if (bucketName && !objectName && !aclMethod) {
      /**
       * bucketName is defined, objectName is null
       * invoke getListObjects service
       * to get list of objects from the bucket
       */

      clientGetListObjects.GetListObjects(
        {bucketName, userId},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const {statusCode, objects} = resp;
          
          return res.status(statusCode).end(objects)
        }
      )
    } else if (bucketName && objectName && !aclMethod) {
      /**
       * bucketName, objectName are defined, aclMethod is null
       * invoke remote service
       * to retreive object from the bucket
       */
      // connect to remote service and instantiate HTTP/2 session
      const session = clientGetObject.connect();
      session.on('error', (err) => { 
        err.statusCode = 500;
        return next(err)
      });

      // instantiate HTTP/2 stream by requesting remote URL
      const serviceResp = session.request({
        ':path': `/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`
      });

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
    } else if (bucketName && objectName && aclMethod) {
      /**
       * bucketName, objectName, aclMethod are defined
       * invoke getObjectACL service
       * to get ACLs of the object
       */
      clientGetObjectAcl.GetObjectAcl(
        {bucketName, objectName, userId},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode, grants } = resp;
          
          return res.status(statusCode).end(grants)
        }
      )
    } else if (bucketName && !objectName && aclMethod) {
      /**
       * bucketName, aclMethod are defined, objectName is null
       * invoke getBucketACL service
       * to get ACLs of the bucket
       */
      clientGetBucketAcl.GetBucketAcl(
        { bucketName, userId },
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode, grants } = resp;

          return res.status(statusCode).end(grants)
        }
      )
    } else {
      /**
       * if services didn't match
       * set status code 405
       */
      const err = new Error('MethodNotAllowed')
      err.statusCode = 405
      return next(err)
    }
  } catch(err) {
    err.type = 'routes';
    err.statusCode = 500;
    next(err)
  }
}

module.exports = get;