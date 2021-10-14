'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Get ACLs of object.
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Array[Object]]
 */
async function getObjectACL(bucketName, objectName, userId) {
  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return [404, null]

      const manageAuth = new Grants(userId, 'get', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    {
      const [isObjectExists, _]  = await bucket.isFileExists(bucketName, objectName)
      if (!isObjectExists) return [404, null]
    }

    const [statusCode, grants] = await bucket.getObjectOrBucketACL(bucketName, objectName);

    return [statusCode, grants]
  } catch (err) {
      throw {
        errorCode: 500,
        message: err.message
      }
  }
}

module.exports = getObjectACL;