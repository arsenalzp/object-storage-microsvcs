'use strict'

const Error = require('../errors');
const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../clients/db');

/**
 * Enable versioning for the given bucket
 * 
 * @param {String} bucketName bucket name
 * @param {Boolean} versioningStatus status of versioning
 * @returns {Promise<Object>} resolve Object
 */
async function putBucketVersioning(bucketName, versioningStatus) {
  try {
    const db = (await client()).db(DBNAME);
    const col = db.collection(BCOLLECTION);

    const findResult = await col.findOne(
      { 
        "bucketName": bucketName, 
        "access.userName": targetUName 
      })
    
    // if results found - enable versioning for the given bucket
    if (findResult) {
      const updateResult = await col.updateOne(
        { 
          "bucketName": bucketName
        },
        { 
          $set: { "versioning": versioningStatus } 
        })
        
        return updateResult
    }
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  putBucketVersioning
}