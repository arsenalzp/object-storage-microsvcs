'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const BCOLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FCOLLECTION = 'filesCollection'; // MongoDB collection of files

const {client, gridFs} = require('../utils/db');
const stream = require('stream');
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
 * Private function - create a new object in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @param {Stream} rs buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function _createFile(bucketName, objectName, userId, rs) {
  try {
    const db = (await client()).db(DBNAME)
    
    const bucket = gridFs(db, { bucketName: bucketName });
    
    // Create writable stream of the gridFS
    const uploadStream = bucket.openUploadStream(
      objectName, 
      { metadata: {
          keywords: [],
          bucket: bucketName
        }
    });
    
    // const rStream = new stream.Readable();
    // rStream._read = () => {}; // need to implement private _read method 
    // rStream.push(fileBuffer); // push data into readable stream
    // rStream.push(null); // end of the stream (EOF)
    // rStream.pipe(uploadStream); // write data from the readable stream to the writable one
    const fileId = uploadStream.id;
    rs.pipe(uploadStream);

    // Insert file metadata into MongoDB file collection
    const dbInsertResult = await db
      .collection(FCOLLECTION)
      .insertOne({
        _id: fileId,
        bucket: bucketName,
        filename: objectName,
        grants: [{
          [userId]: 6 // [110] PUT and GET grants
        }]
      })

    return [201, dbInsertResult]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Private function - update existing object in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileId object ID
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @param {Stream} rs buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function _updateFile(bucketName, fileId, objectName, userId, rs) {
  try {
    const db = (await client()).db(DBNAME);

    const bucket = gridFs(db, { bucketName: bucketName });

    // Delete old object in the gridFS 
    await bucket.delete(ObjectId(fileId));
    
    // Create writable stream of the gridFS
    const uploadStream = bucket.openUploadStream(objectName, 
      {
        metadata: {
          keywords: [],
          bucket: bucketName
        }
    });

    // const rStream = new stream.Readable(); // create readable stream
    // rStream._read = () => {}; // need to implement private _read method 
    // rStream.push(fileBuffer); // push data into readable stream
    // rStream.push(null); // end of the stream (EOF)
    // rStream.pipe(uploadStream); // write data from the readable stream to the writable one
    const newFileId = uploadStream.id;
    rs.pipe(uploadStream);

    /**
     * delete old object in the file collection
     * and 
     * insert metadata of a new object into file collection;
     * bulk mode is used
     */
    const dbUpdateResult = await db
    .collection(FCOLLECTION)
    .bulkWrite([
      { deleteOne: { 
        filter: {_id: fileId} } 
      },
      { insertOne: {
        _id: newFileId, 
        filename: objectName, 
        bucket: bucketName, 
        grants: [{
          [userId]: 6 // [110] PUT and GET grants
        }]
        }
      }
    ])

    return [200, dbUpdateResult]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
} 

/**
 * Create or update object in the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} objectName object name
 * @param {String} userId requester ID
 * @param {Stream} rs buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function uploadFile(bucketName, objectName, userId, rs) {
  try {
    const [_, fileId] = await isFileExists(bucketName, objectName);
    if (!fileId) {
      await _createFile(bucketName, objectName, userId, rs);

      return [201, null]
    } else {
      await _updateFile(bucketName, fileId, objectName, userId, rs);

      return [200, null]
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
  uploadFile,
  getObjectOrBucketACL
}