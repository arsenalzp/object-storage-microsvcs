'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../utils/db');

/**
 * Check bucket existence.
 * If exist - return a bucket document 
 * with included bucket grants
 * 
 * @param {String} bucketName bucket name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function isBucketExists(bucketName) {
  try {
    const db = (await client()).db(DBNAME)

    const isExist = await db
      .collection(BCOLLECTION)
      .findOne(
        {bucketname: bucketName},
        {$exists: true}
      )
    
    return [200, isExist]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Create a new bucket in the bucket collection
 * 
 * @param {String} bucketName bucket name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function createBucket(bucketName, userId) {
  try {
    const db = (await client()).db(DBNAME)
    
    const col = db.collection(BCOLLECTION);
    const insertDbResult = await col.insertOne({
      bucketname: bucketName, 
      createdAt: new Date(),
      owner: userId,
      grants: [{
        [userId]: 7 // bitmask "111"
      }],
      files: []
    })

    return [201, {id: insertDbResult.insertedId, name: bucketName}]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

module.exports = {
  isBucketExists,
  createBucket
}