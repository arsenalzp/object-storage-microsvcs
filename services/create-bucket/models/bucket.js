'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../clients/db');

/**
 * Create a new bucket in the bucket collection
 * 
 * @param {String} bucketName bucket name
 * @param {String} requesterUName requester ID
 * @returns {Promise<Object>} resolve Object
 */
async function createBucket(bucketName, requesterUName) {
  try {
    const db = (await client()).db(DBNAME)
    
    const col = db.collection(BCOLLECTION);
    const insertResult = await col.insertOne(
      {
        "bucketName": bucketName, 
        "created": new Date(),
        "owner": requesterUName,
        "access": [{
          "userName":requesterUName,
          "grants": 7 // bitmask "111"
        }],
        filesList: []
      })

    return insertResult
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

module.exports = {
  createBucket
}