'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const { client } = require('../clients/db');

/**
 * Apply a new ACL to the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} targetUName target user name
 * @param {Object} newGrants new grants
 * @returns {Promise<Object>} resolve Object
 */
async function putObjectACL(bucketName, objectName, targetUName, newGrants) {
  try {
    const db = (await client()).db(DBNAME);
    const col = db.collection(FCOLLECTION)

    const findResult = await col.findOne(
      { 
        "bucketName": bucketName,
        "fileName": objectName, 
        "access.userName": targetUName
      })
    
    // if no results found - push a new grants for a new user
    if (!findResult) {
      const updateResult = await col.updateOne(
        { 
          "bucketName": bucketName, 
          "fileName": objectName
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
        "fileName": objectName, 
        "access.userName": targetUName
      },
      { 
        $set: { "access.$.grants": newGrants } 
      })
    
    return updateResult
  } catch (err) {
    throw err
  }
}

module.exports = {
  putObjectACL,
}