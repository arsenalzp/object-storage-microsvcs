'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../clients/db');

/**
 * Apply a new ACL to the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} targetUName target user name
 * @param {Object} newGrants new grants
 * @returns {Promise<Object>} resolve Object
 */
async function putBucketACL(bucketName, targetUName, newGrants) {
  try {
    const db = (await client()).db(DBNAME);
    const col = db.collection(BCOLLECTION);

    const findResult = await col.findOne(
      { 
        "bucketName": bucketName, 
        "access.userName": targetUName 
      })
    
    // if no results found - push a new grants for a new user
    if (!findResult) {
      const updateResult = await col.updateOne(
        { 
          "bucketName": bucketName
        },
        { 
          $push: { "access": {"userName": targetUName, "grants":newGrants} } 
        })
        
        return updateResult
    }

    // update a grants by a new one
    const updateResult = await col.updateOne(
      { 
        "bucketName": bucketName, 
        "access.userName": targetUName 
      },
      { 
        $set: { "access.$.grants": newGrants } 
      } 
    )

    return updateResult
  } catch (err) {
    throw err
  }
}

module.exports = {
  putBucketACL
}