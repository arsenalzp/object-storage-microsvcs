'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const {client, gridFs} = require('../utils/db');
const { ObjectId } = require('mongodb');

/**
 * Check object existence in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @returns {Promise<Array>} resolve Array [Boolean, String]
 */
async function isFileExists(bucketName, objectName) {
  try {
    const db = (await client()).db(DBNAME)

    const findFileResult = await db
      .collection(FCOLLECTION)
      .findOne({
          bucket: bucketName,
          filename: objectName
      })
    
    // if no result found in DB - return false
    if (!findFileResult) return [false, null]

    const { _id } = findFileResult;
    return [true, _id]
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
        .findOne({
          bucketname: bucketName,
        },
        {
          projection: { grants:1 }
        }
      )

      return [200, result]
    } else if (bucketName && objectName) {
      const result = await db
        .collection(FCOLLECTION)
        .findOne({
          bucket: bucketName,
          filename: objectName
        },
        {
          projection: { grants:1 }
        }
      )

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
 * Delete object in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} fileId object ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function deleteKey(bucketName, objectName, fileId) {
  try {
    const db = (await client()).db(DBNAME);

    const bucket = gridFs(db, { bucketName: bucketName });

    await db
      .collection(FCOLLECTION)
      .findOneAndDelete({ 
        bucket: bucketName, 
        filename: objectName
      });

    await bucket.delete(ObjectId(fileId));

    return [200, null]
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
  getObjectOrBucketACL,
  deleteKey
}