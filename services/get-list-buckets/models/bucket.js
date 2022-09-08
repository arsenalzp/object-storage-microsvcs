'use strict'

const Error = require('../errors');
const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets

const { client } = require('../clients/db');

/**
 * Get list of buckets belonging to the particular user
 * 
 * @param {String} requesterUName requester ID
 * @returns {Promise<Array>} resolve Array
 */
async function getListBuckets(requesterUName) {
  try {
    const db = (await client()).db(DBNAME);

    const findResult = await db
      .collection(BCOLLECTION)
      .find(
        {
          "owner": requesterUName
        },
        {
          projection: { _id: 0 , access: 0, owner: 0, filesList: 0, createdAt: 0}
        })
      .toArray();

    return findResult
  } catch (err) {
    err = new Error('bucket error', Error.BcktReqErr, err);
    throw err
  }
}

module.exports = {
  getListBuckets
}