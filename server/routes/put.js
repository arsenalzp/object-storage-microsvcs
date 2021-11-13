'use strict'

const { PUT_OBJECT_SVC_HOST, PUT_OBJECT_SVC_PORT } = process.env;

const clientCreateBucket = require('../clients/create-bucket');
const clientPutObjectAcl = require('../clients/put-object-acl');
const clientPutBucketAcl = require('../clients/put-bucket-acl');
const User = require('../models/user');
const http = require('http');

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
  const objectName = req.params.fileName ? req.params.fileName : null; // retrieve a file name
  const aclMethod = req.query.acl ? req.query.acl : null; // retrieve acl query param
  const key = req.key; // Authorization signature

  try {
    const userId = user.getUserId(key);

    if (!userId) return res.status(401).end();

    if (bucketName && !objectName && !aclMethod) {    
      /**
       * bucketName is defined, objectName, aclMethod are null
       * invoke createBucket service
       * to create a new bucket
       */
      clientCreateBucket.CreateBucket(
        {bucketName, userId},
        (err, resp) => {
          if (err) throw err
          
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
      const targetUserId = req.targetUserId;

      if (!targetGrants || !targetUserId) return res.status(400).end()

      const serializedGrants = JSON.stringify(targetGrants); // gRPC requires strings

      clientPutObjectAcl.PutObjectAcl(
        {bucketName, objectName, requesterId: userId, targetUserId, targetGrants: serializedGrants},
        (err, resp) => {
          if (err) throw err

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
      const targetUserId = req.targetUserId;

      if (!targetGrants || !targetUserId) return res.status(400).end()
      
      const serializedGrants = JSON.stringify(targetGrants); // gRPC requires strings

      clientPutBucketAcl.PutBucketAcl(
        {bucketName, requesterId: userId, targetUserId, targetGrants: serializedGrants},
        (err, resp) => {
          if (err) throw err

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
      if (!req.file) return res.status(400).end();
      
      const { buffer: fileBuffer } = req.file;

      const rq = http.request({
        port: PUT_OBJECT_SVC_PORT,
        host: PUT_OBJECT_SVC_HOST,
        method: 'POST',
        path: `/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`,
      }, (rs) => {
        rs.read()
        res.statusCode = rs.statusCode;

        return res.end()
      })
      rq.write(fileBuffer)
      rq.end()

    } else {
      /**
       * if services didn't match
       * set status code 405
       */
      return res.status(405).end();
    }
  } catch (err) {
    // need to put error into a journal
    return res.status(500).end();
  }
}

module.exports = put;