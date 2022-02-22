'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const { client } = require('../clients/db');

/**
 * Check object existence in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function isFileExists(bucketName, objectName) {
  try {
    const db = (await client()).db(DBNAME)

    const doc = await db
      .collection(FCOLLECTION)
      .findOne({
          "bucketName": bucketName,
          "fileName": objectName
      })
    
    return [200, doc]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

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
  isFileExists,
  getObjectOrBucketACL
}