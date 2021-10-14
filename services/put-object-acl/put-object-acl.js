'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Put a new ACL to the object.
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @param {Object} newGrants the target grants
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function putObjectACL(bucketName, objectName, requesterId, targetUserId, targetGrants) {
  let manageAuth = null;

  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return [404, null]

      manageAuth = new Grants(requesterId, 'put', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    {
      const [isFileExists, _] = await bucket.isFileExists(bucketName, objectName);
      if (!isFileExists) return [404, null]
    }

    const modifiedGrants = manageAuth.set(targetUserId, targetGrants); // set object ACL
    const [statusCode, _] = await bucket.putObjectOrBucketACL(bucketName, objectName, modifiedGrants);
    
    return [statusCode, null]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = putObjectACL;