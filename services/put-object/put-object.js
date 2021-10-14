'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Put a new object into the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileName object name
 * @param {Buffer} fileBuffer Buffer of file data (multer)
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function uploadFileIntoBucket(bucketName, fileName, fileBuffer, userId) {
  try {
    {
      const [_, grants] = await bucket.isBucketExists(bucketName);
      if (!grants) return [404, null]

      const manageAuth = new Grants(userId, 'put', grants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    const [statusCode, _] = await bucket.uploadFile(bucketName, fileName, userId, fileBuffer);
    
    return [statusCode, null]
  } catch(err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = uploadFileIntoBucket;