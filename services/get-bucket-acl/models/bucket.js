'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../clients/db');

/**
 * Get ACL of a bucket
 * 
 * @param {String} bucketName bucket name
 * @returns {Promise<Object>} resolve Object 
 */
async function getBucketACL(bucketName) {
  try {
    const db = (await client()).db(DBNAME);

      const findResult = await db
        .collection(BCOLLECTION)
        .findOne(
          {
            "bucketName": bucketName
          },
          {
            projection: { access:1, _id: 1 }
          })

      return findResult
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

module.exports = {
  getBucketACL
}