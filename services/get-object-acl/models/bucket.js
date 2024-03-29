'use strict'

const Error = require('../errors');
const DBNAME = 'buckets'; // MongoDB DB name
const OCOLLECTION = 'objectsCollection'; // MongoDB collection of objects

const { client } = require('../clients/db');

/**
 * Get ACL of the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @returns {Promise<Object>} resolve Object
 */
async function getObjectACL(bucketName, objectName) {
  try {
    const db = (await client()).db(DBNAME);
    const findResult = await db
      .collection(OCOLLECTION)
      .findOne(
        {
          "bucketName": bucketName, 
          "objectName": objectName
        },
        {
          projection: { _id: 1, access: 1 }
        })

    return findResult
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  getObjectACL
}