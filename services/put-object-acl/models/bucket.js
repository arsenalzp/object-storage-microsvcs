'use strict'

const Error = require('../errors');
const DBNAME = 'buckets'; // MongoDB DB name
const OCOLLECTION = 'objectsCollection'; // MongoDB collection of objects

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
    const col = db.collection(OCOLLECTION)

    const findResult = await col.findOne(
      { 
        "bucketName": bucketName,
        "objectName": objectName, 
        "access.userName": targetUName
      })
    
    // if no results found - push a new grants for a new user
    if (!findResult) {
      const updateResult = await col.updateOne(
        { 
          "bucketName": bucketName, 
          "objectName": objectName
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
        "objectName": objectName, 
        "access.userName": targetUName
      },
      { 
        $set: { "access.$.grants": newGrants } 
      })
    
    return updateResult
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  putObjectACL,
}