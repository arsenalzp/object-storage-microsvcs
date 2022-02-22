'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const { client } = require('../clients/db');

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

    const doc = await db
      .collection(BCOLLECTION)
      .findOne(
        {"bucketName": bucketName},
        {$exists: true}
      )
    
    return [200, doc]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Apply a new ACL to the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {Object} newGrants new grants
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function putObjectOrBucketACL(bucketName, objectName, newGrants) {
  try {
    /**
     * if an object name is not defined then
     * apply grants to a bucket
     */
    if (bucketName && !objectName) {
      const db = (await client()).db(DBNAME);

      const col = db.collection(BCOLLECTION)
      const updateResult = await col.updateOne(
        {"bucketName": bucketName},
        {$set: {grants:newGrants}} 
      )

      return [200, updateResult]
    } else if (bucketName && objectName) {
      const db = (await client()).db(DBNAME);
      
      const col = db.collection(FCOLLECTION)
      const updateResult = await col.updateOne(
        {"bucketName": bucketName, "fileName": objectName},
        {$set: {grants: newGrants}} 
      )

    return [200, updateResult]
    }
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Get ACL of the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function getObjectOrBucketACL(bucketName, objectName) {
  try {
    const db = (await client()).db(DBNAME);
    /**
     * if object name is not defined then
     * return a bucket ACL
     */
    if (bucketName && !objectName) {
      const doc = await db
        .collection(BCOLLECTION)
        .findOne(
          {"bucketName": bucketName},
          {projection: { grants:1 }}
        )

      return [200, doc]
    } else if (bucketName && objectName) {
      const doc = await db
        .collection(FCOLLECTION)
        .findOne(
          {"bucketName": bucketName, "fileName": objectName},
          {projection: { grants:1 }}
        )

      return [200, doc]
    }
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

module.exports = {
  isBucketExists,
  putObjectOrBucketACL,
  getObjectOrBucketACL
}