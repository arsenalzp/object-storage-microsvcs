'use strict'

const clientGetBucketMeta = require('../clients/get-bucket-meta');
const clientGetObjectMeta = require('../clients/get-object-meta');
const User = require('../models/user');

const user = new User();
user.setUserId();

/**
 * HEAD route.
 * 
 * Invoke the following services:
 * - getBucketMeta to get metadata of the bucket
 * - getObjectMeta to get metadata of the object
 * 
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @returns {Object} HTTP response or Error
 */
async function head(req, res, next) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.objectName ? req.params.objectName : null; // retrieve a file name
  const key = req.key; // Authorization signature
  
  try {
    const userId = user.getUserId(key);

    if (!userId) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    if (bucketName && !objectName) {
      /**
       * bucketName is defined, objectName is undefined
       * invoke getBucketMeta service
       * to check existance and access to the particular bucket
       */
      clientGetBucketMeta.GetBucketMeta(
        {bucketName, userId},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode } = resp;

          return res.status(statusCode).end()
        }
      )
    } else {
      /**
       * bucketName, objectName is defined
       * invoke getObjectMeta
       * to check existance and access to the particular object
       */
      clientGetObjectMeta.GetObjectMeta(
        {bucketName, objectName, userId},
        (err, resp) => {

          if (err) {
            err.statusCode = 500;
            return next(err)
          }

          const { statusCode } = resp;

          return res.status(statusCode).end()
        }
      )
    }
  } catch (err) {
    err.type = 'routes';
    err.statusCode = 500;
    next(err)
  }
}

module.exports = head;