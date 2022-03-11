'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../utils/db');

/**
 * Get list of buckets belonging to the particular user
 * 
 * @param {String} requesterUName requester ID
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function getBuckets(requesterUName) {
  try {
    const db = (await client()).db(DBNAME);

    const dbFindResult = await db
      .collection(BCOLLECTION)
      .find(
        {
          "owner": requesterUName
        },
        {
        projection: { grants: 0, owner: 0, files: 0}
        })
      .toArray();

    return [200, dbFindResult]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}


module.exports = {
  getBuckets
}