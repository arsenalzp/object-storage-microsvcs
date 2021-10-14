'use strict'

const bucket = require('../models/bucket');

/**
 * Service.
 * Get list of user buckets.
 * 
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resole Array [Number, JSON]
 */
async function getListBuckets(userId) {
  try {
      const [statusCode, buckets] = await bucket.getBuckets(userId); 

      return [statusCode, buckets]
    } catch (err) {
      throw {
        errorCode: 500,
        message: err.message
      }
    }
}

module.exports = getListBuckets;