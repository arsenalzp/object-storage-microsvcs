'use strict'

const Error = require('../errors');
const DBNAME = 'buckets'; // MongoDB DB name
const OCOLLECTION = 'objectsCollection'; // MongoDB collection of objects

const { client } = require('../clients/db');

/**
 * List objects in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @returns {Promise<Array>} resolve Array
 */
async function listObjects(bucketName) {
  try {
    const db = (await client()).db(DBNAME);

    const findResult = await db
      .collection(OCOLLECTION)
      .find(
        { 
          "bucketName": bucketName,
        },
        {
          projection: { _id: 0 , access: 0, createdAt: 0, lastUpdate: 0}
        }).toArray()

    return findResult
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  listObjects
}