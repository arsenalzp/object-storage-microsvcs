'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

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
        { 
          "bucketName": bucketName 
        },
        { 
          $exists: true 
        })
    
    return [200, isExist]
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
      const result = await db
        .collection(BCOLLECTION)
        .findOne(
          {
            "bucketName": bucketName
          },
          {
            projection: { grants:1 }
          })

      return [200, result]
    } else if (bucketName && objectName) {
      const result = await db
        .collection(FCOLLECTION)
        .findOne(
          { 
            "bucketName": bucketName, 
            "fileName": objectName 
          },
          { 
            projection: { grants:1 }
          })

      return [200, result]
    }
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * List objects in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function listObjects(bucketName) {
  try {
    const db = (await client()).db(DBNAME);

    const filesList = await db
      .collection(FCOLLECTION)
      .find(
        { "bucketName": bucketName 
        }).toArray()

    return [200, filesList]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

module.exports = {
  isBucketExists,
  getObjectOrBucketACL,
  listObjects
}