'use strict'

const { PUT_OBJECT_SVC_HOST, PUT_OBJECT_SVC_PORT } = process.env;

const clientCreateBucket = require('../clients/create-bucket');
const clientPutObjectAcl = require('../clients/put-object-acl');
const clientPutBucketAcl = require('../clients/put-bucket-acl');

const User = require('../models/user');

const cwd = require('process').cwd();
const path = require('path');
const https = require('https');
const fs = require('fs');

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
    const userId = user.getUserId(key);

    if (!userId) {
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
        {bucketName, userId},
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
      const targetUserId = req.targetUserId;

      if (!targetGrants || !targetUserId) {
        const err = new Error('InvalidArgument')
        err.statusCode = 400;
        return next(err)
      }

      const serializedGrants = JSON.stringify(targetGrants); // gRPC requires strings

      clientPutObjectAcl.PutObjectAcl(
        {bucketName, objectName, requesterId: userId, targetUserId, targetGrants: serializedGrants},
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
      const targetUserId = req.targetUserId;

      if (!targetGrants || !targetUserId) {
        const err = new Error('InvalidArgument')
        err.statusCode = 400;
        return next(err)
      }
      
      const serializedGrants = JSON.stringify(targetGrants); // gRPC requires strings

      clientPutBucketAcl.PutBucketAcl(
        {bucketName, requesterId: userId, targetUserId, targetGrants: serializedGrants},
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
      
      if (process.env.NODE_ENV === "development") {
        var PUT_OBJECT_SVC_HOST = 'localhost';
        var PUT_OBJECT_SVC_PORT = 7001;
      }
      
      if (process.env.NODE_ENV === "production") {
        var PUT_OBJECT_SVC_HOST = process.env.PUT_OBJECT_SVC_HOST;
        var PUT_OBJECT_SVC_PORT  = process.env.PUT_OBJECT_SVC_PORT;
      }
      

      const tlsCreds = {
        cacert: fs.readFileSync(path.join(cwd, 'clients', 'put-object', 'tls', 'rootCA.crt')),
      }
      
      const OPTIONS = {
        port: PUT_OBJECT_SVC_PORT,
        host: PUT_OBJECT_SVC_HOST,
        ca: tlsCreds.cacert,
        method: 'POST',
        path: `/?bucketName=${bucketName}&objectName=${objectName}&requesterId=${userId}`,
        rejectUnauthorized: false
      };

      const rq = https.request(OPTIONS, (rs) => {
        rs.read()
        res.statusCode = rs.statusCode;

        return res.end()
      });

      rq.write(objBuffer);
      rq.end();

      rq.on('error', (err) => {
        err.statusCode = 500;
        return next(err)
      })
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