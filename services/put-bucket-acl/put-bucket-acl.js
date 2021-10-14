'use strict'

const bucket = require('../models/bucket');
const Grants = require('../utils/check-grants');

/**
 * Service.
 * Put a new ACL to the bucket.
 * 
 * @param {String} bucketName bucket name
 * @param {String} requesterId requester userID
 * @param {String} targetUserId target ID
 * @param {Object} targetGrants the target grants
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function putBucketACL(bucketName, requesterId, targetUserId, targetGrants) {
  let manageAuth = null;

  try {
    {
      const [_, bucketGrants] = await bucket.isBucketExists(bucketName);
      if (!bucketGrants) return [404, null]

      manageAuth = new Grants(requesterId, 'put', bucketGrants);
      const isAuthorized = manageAuth.check(); // check user grants for certain method
      if (!isAuthorized) return [403, null]
    }

    const modifiedGrants = manageAuth.set(targetUserId, targetGrants); // set bucket ACL
    const [statusCode, _] = await bucket.putObjectOrBucketACL(bucketName, null, modifiedGrants);

    return [statusCode, null]
  } catch (err) {
    throw {
      errorCode: 500,
      message: err.message
    }
  }
}

module.exports = putBucketACL;