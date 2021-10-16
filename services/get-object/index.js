'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Retrieve object from the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileName object name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Stream]
 */
async function getObject(bucketName, fileName, userId) {
  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return [404, null]

      const manageAuth = new Grants(userId, 'get', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    const [isFileExists, _] = await bucket.isFileExists(bucketName, fileName);
    if (!isFileExists) return [404, null]

    const [statusCode, downloadStream] = await bucket.getFile(bucketName, fileName);

    return [statusCode, downloadStream]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = getObject;