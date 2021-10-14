'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Get list of objects in the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Array[JSON]]
 */
async function getListObjects(bucketName, userId) {
  try {
    const [_, grants] = await bucket.isBucketExists(bucketName);
    if (!grants) return [404, null]

    const manageAuth = new Grants(userId, 'get', grants);
    const isAuthorized = manageAuth.check(); // check user grants for certain method
    if (!isAuthorized) return [403, null]

    const [statusCode, objects]  = await bucket.listObjects(bucketName);

    return [statusCode, objects]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = getListObjects;