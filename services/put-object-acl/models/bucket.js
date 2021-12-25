'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const { client } = require('../utils/db');

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
      .findOne(
        {bucket: bucketName, filename: objectName}
      )
    
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
      const dbUpdateResult = await col.updateOne(
        {bucketname: bucketName},
        {$set: {grants:newGrants}} 
      )

      return [200, dbUpdateResult]
    } else if (bucketName && objectName) {
      const db = (await client()).db(DBNAME);
      
      const col = db.collection(FCOLLECTION)
      const dbUpdateResult = await col.updateOne(
        {bucket: bucketName, filename: objectName},
        {$set: {grants: newGrants}} 
      )

      return [200, dbUpdateResult]
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
      const result = await db
        .collection(BCOLLECTION)
        .findOne(
          {bucketname: bucketName},
          {projection: { grants:1 }}
        )

      return [200, result]
    } else if (bucketName && objectName) {
      const result = await db
        .collection(FCOLLECTION)
        .findOne(
          {bucket: bucketName, filename: objectName},
          {projection: { grants:1 }}
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

module.exports = {
  isBucketExists,
  isFileExists,
  putObjectOrBucketACL,
  getObjectOrBucketACL,
}