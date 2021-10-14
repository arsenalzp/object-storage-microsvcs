'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Get metadata of object: 
 * - is object exist?
 * - is user authorized to access object ?
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileName object name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function getObjectMeta(bucketName, fileName, userId) {
  try {
    const [_, grants] = await bucket.isBucketExists(bucketName);
    if (!grants) return [404, null]

    const manageAuth = new Grants(userId, 'get', grants);
    const isAuthorized = manageAuth.check(); // check user grants for certain method
    if (!isAuthorized) return [403, null]

    {
      const [isFileExists, _]  = await bucket.isFileExists(bucketName, fileName)
      if (!isFileExists) return [404, null]
    }

    return [200, null]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = getObjectMeta;
