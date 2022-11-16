'use strict'

const Error = require('../errors');
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
    const db = (await client()).db(DBNAME);
    
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
        objectsList: [],
        "versioning": false
      })

    return insertResult
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  createBucket
}