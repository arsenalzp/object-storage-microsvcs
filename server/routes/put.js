'use strict'

const HEADERS = {'Content-Type': 'application/json'};

const User = require('../models/user');
const createBucket = require('../services/create-bucket');
const getHeaders = require('../models/get-headers');
const putObjectACL = require('../services/put-object-acl');
const putBucketACL = require('../services/put-bucket-acl');
const putObject = require('../services/put-object');

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
async function put(req, res) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const fileName = req.params.fileName ? req.params.fileName : null; // retrieve a file name
  const key = req.query.key; // retrieve the API key
  const aclMethod = req.query.acl ? req.query.acl : null; // retrieve acl query param

  if (!key) {

    return res
    .status(422)
    .set(HEADERS)
    .end()
  }

  const userId = user.getUserId(key);

  if (!userId) {
    return res.status(401).set(HEADERS).end();
  }

  try {
    if (bucketName && !fileName && !aclMethod) {    
      /**
       * bucketName is defined, fileName, aclMethod are null
       * invoke createBucket service
       * to create a new bucket
       */
      const [statusCode, _] = await createBucket(bucketName, userId);
  
      return res.status(statusCode).set(HEADERS).end()
    } else if (bucketName && fileName && aclMethod) {
      /**
       * bucketName, fileName, aclMethod are defined
       * invoke putObjectACL
       * to put a new ACLs for the object in the bucket
       */
      const [statusCode, userId, grants] = getHeaders(req);
      if (statusCode !== 200) return res.status(statusCode).set(HEADERS).end()
  
      const [wasPut, _] = await putObjectACL(bucketName, fileName, userId, grants);
      if (wasPut === 404) return res.status(404).set(HEADERS).end()
  
      return res.status(201).set(HEADERS).end()
    } else if (bucketName && !fileName && aclMethod) {
      /**
       * bucketName, aclMethod are defned, fileName is null
       * invoke putBucketACL service
       * to put a new ACLs for the bucket
       */
      const [statusCode, targetUserId, targetGrants] = getHeaders(req);
      if (statusCode !== 200) return res.status(statusCode).set(HEADERS).end()

      const [wasPut, _] = await putBucketACL(bucketName, userId, targetUserId, targetGrants);
      if (wasPut !== 200) return res.status(403).set(HEADERS).end()
  
      return res.status(201).set(HEADERS).end()
    } else if (bucketName && fileName && !aclMethod) {
      /**
       * bucketName, fileName are defined, aclMethod is null
       * invoke putObject service
       * to put (upload) a new object into the bucket
       */

      // if file property if null - set status code 400
      if (!req.file) return res.status(400).set(HEADERS).end();
  
      const { buffer: fileBuffer } = req.file;
      const [statusCode, _] = await putObject(bucketName, fileName, fileBuffer, userId);
      
      return res
      .status(statusCode)
      .set(HEADERS)
      .end()
    } else {
      /**
       * if services didn't match
       * set status code 405
       */

      return res
      .status(405)
      .set(HEADERS)
      .end();
    }
  } catch ({errorCode}) {

    return res
    .status(errorCode)
    .set(HEADERS)
    .end();
  }
}

module.exports = put;