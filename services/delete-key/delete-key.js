'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Delete object from the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function deleteKey(bucketName, objectName, userId) {
  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return [404, null]

      const manageAuth = new Grants(userId, 'del', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    const [isFileExists, objectId] = await bucket.isFileExists(bucketName, objectName);
    if (!isFileExists) return [404, null]
      
    const [statusCode, _] = await bucket.deleteKey(bucketName, objectName, objectId);

    return [statusCode, null]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = deleteKey;