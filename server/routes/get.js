'use strict'

// const {SERVICE_HOST, SERVICE_PORT} = process.env;
const SERVICE_HOST = 'localhost';
const SERVICE_PORT = 8100;

const HEADERS = {'Content-Type': 'application/json'};

const User = require('../models/user');
// const getObject = require('../services/get-object');
// const getListBuckets = require('../services/get-list-buckets');
// const getListObjects = require('../services/get-list-objects');
// const getObjectACL = require('../services/get-object-acl');
// const getBucketACL = require('../services/get-bucket-acl');
const clientGetBucketAcl = require('../clients/get-bucket-acl');
const clientGetListObjects = require('../clients/get-list-objects');
const clistnGetListBuckets = require('../clients/get-list-buckets');
const clientGetObjectAcl = require('../clients/get-object-acl');
const http2 = require('http2');
const fs = require('fs');

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
async function get(req, res) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.fileName ? req.params.fileName : null; // retrieve a file name
  const aclMethod = req.query.acl ? req.query.acl : null; // retrieve acl query param
  const key = req.query.key; // retrieve the API key


  if (!key) {
    return res
    .status(422)
    .end();
  }

  const userId = user.getUserId(key);

  if (!userId) {
    return res
    .status(401)
    .end(JSON.stringify({body: 'Key is not authenticated'}));
  }

  try {
    if (!bucketName && !aclMethod) {
      /** 
       * bucketName, aclMethod are null
       * invoke getListBucket service
       * to get list of user's buckets
       */
      clistnGetListBuckets.GetListBuckets(
        {userId},
        (err, resp) => {
          if (err) throw err

          const { statusCode, buckets } = resp;
          return res
          .status(statusCode)
          .set(HEADERS)
          .end(buckets)
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
          if (err) throw err

          const {statusCode, objects} = resp;

          return res
          .status(statusCode)
          .set(HEADERS)
          .end(objects)
        }
      )
    } else if (bucketName && objectName && !aclMethod) {
      /**
       * bucketName, objectName are defined, aclMethod is null
       * invoke remote service
       * to retreive object from the bucket
       */

      // connect to remote service and instantiate HTTP/2 session
      const client = http2.connect(`http://${SERVICE_HOST}:${SERVICE_PORT}`);
      client.on('error', (err) => {throw err});

      // instantiate HTTP/2 stream by requesting remote URL
      const serviceResp = client.request({
        ':path': `/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`
      });

      // The 'response' event is emitted when a response HEADERS frame has been received for this stream from the connected HTTP/2 server. 
      serviceResp.on('response', (headers) => {
        res
        .set(HEADERS)
        .status(headers[':status'])
        const ws = fs.createWriteStream('/tmp/writableFile');
        return serviceResp.pipe(res)
      });

      serviceResp.on('close', () => {
        client.close()
      });

      serviceResp.on('error', () => {
        res
        .status(500)
        .end()
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
          if (err) throw err

          const { statusCode, grants } = resp;
          return res
          .status(statusCode)
          .set(HEADERS)
          .end(grants)
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
          if (err) throw err

          const { statusCode, grants } = resp;
          return res
          .status(statusCode)
          .set(HEADERS)
          .end(grants)
        }
      )
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
  } catch(err) {
    // need to put error into a journal
    return res
    .status(500)
    .set(HEADERS)
    .end();
  }
}

module.exports = get;