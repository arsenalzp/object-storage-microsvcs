'use strict'

const HEADERS = {'Content-Type': 'application/json'};

const User = require('../models/user');
// const getBucketMeta = require('../services/get-meta');
// const getObjectMeta = require('../services/get-object-meta');

const clientGetBucketMeta = require('../clients/get-bucket-meta');
const clientGetObjectMeta = require('../clients/get-object-meta');

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
async function head(req, res) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.fileName ? req.params.fileName : null; // retrieve a file name
  const key = req.query.key; // retrieve the API key

  if (!key) {
    return res
    .status(422)
    .end()
  }

  const userId = user.getUserId(key);

  if (!userId) {
    return res
    .status(401)
    .end(JSON.stringify({body: 'Key is not authenticated'}));
  }

  try {
    if (bucketName && !objectName) {
      /**
       * bucketName is defined, fileName is undefined
       * invoke getBucketMeta service
       * to check existance and access to the particular bucket
       */
      clientGetBucketMeta.GetBucketMeta(
        {bucketName, userId},
        (err, resp) => {
          if (err) throw err

          const { statusCode } = resp;

          return res
          .set(HEADERS)
          .status(statusCode)
          .end()
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
          if (err) throw err

          const { statusCode } = resp;
          return res
          .set(HEADERS)
          .status(statusCode)
          .end()
        }
      )
    }
  } catch (err) {
    // need to put error into a journal
    return res
    .status(500)
    .set(HEADERS)
    .end();
  }
  
}

module.exports = head;