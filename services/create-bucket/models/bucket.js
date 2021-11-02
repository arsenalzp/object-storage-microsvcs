'use strict'

const DBNAME = 'buckets'; // MongoDB DB name
const COLLECTION = 'bucketsCollection'; // MongoDB collection of buckets
const FILECOLLECTION = 'filesCollection'; // MongoDB collection of files

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
      .collection(FILECOLLECTION)
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

    const result = await db
      .collection(COLLECTION)
      .findOne(
        {bucketname: bucketName},
        {projection: {grants: 1}}
      )
    
    return [200, result]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Create a new bucket in the bucket collection
 * 
 * @param {String} bucketName bucket name
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function createBucket(bucketName, userId) {
  try {
    const db = (await client()).db(DBNAME)
    
    const col = db.collection(COLLECTION);
    const insertDbResult = await col.insertOne({
      bucketname: bucketName, 
      createdAt: new Date(),
      owner: userId,
      grants: [{
        [userId]: {
          get: "true",
          put: "true",
          del: "true"
        }
      }],
      files: []
    })

    return [201, {id: insertDbResult.insertedId, name: bucketName}]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

// async function putObjectACL(bucketName, fileName, grants) {
//   try {
//     const dbClient = await client;
//     const db = dbClient.db(DBNAME);
//     const col = db.collection(FILECOLLECTION)
//     const dbUpdateResult = await col.updateOne(
//       {
//         bucket: bucketName,
//         filename: fileName
//       },
//       {
//         $set: {grants: grants}
//       } 
//     )

//     return [200, dbUpdateResult]
//   } catch (err) {
//     throw {
//       exitCode: 500,
//       message: err.message
//     }
//   }
// }

// async function putBucketACL(bucketName, userId, grants) {
//   try {
//     const dbClient = await client;
//     const db = dbClient.db(DBNAME);
//     const col = db.collection(COLLECTION)
//     const dbUpdateResult = await col.updateOne(
//       {
//         bucketname: bucketName,
//         grants: userId
//       },
//       {
//         $set: {[userId]:grants}
//       } 
//     )

//     return [200, dbUpdateResult]
//   } catch (err) {
//     throw {
//       exitCode: 500,
//       message: err.message
//     }
//   }
// }

/**
 * Get grants of the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function getBucketGrants(bucketName) {
  try {
    const db = (await client()).db(DBNAME)

    const { _id, grants } = await col.findOne(
      { bucketname: bucketName }, 
      { projection : {"grants": 1} }
    )

    return [200, { id: _id, grants: grants }]
  } catch(err) {
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
 * @param {String} fileName object name
 * @param {String} userId requester ID
 * @param {Buffer} fileBuffer buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function _createFile(bucketName, fileName, userId, fileBuffer) {
  try {
    const db = (await client()).db(DBNAME)
    
    const bucket = gridFs(db, { bucketName: bucketName });
    
    // Create writable stream of the gridFS
    const uploadStream = bucket.openUploadStream(
      fileName, 
      { metadata: {
          keywords: [],
          bucket: bucketName
        }
    });
    
    const rStream = new stream.Readable();
    rStream._read = () => {}; // need to implement private _read method 
    rStream.push(fileBuffer); // push data into readable stream
    rStream.push(null); // end of the stream (EOF)
    rStream.pipe(uploadStream); // write data from the readable stream to the writable one
    const fileId = uploadStream.id;

    // Insert file metadata into MongoDB file collection
    const dbInsertResult = await db
      .collection(FILECOLLECTION)
      .insertOne({
        _id: fileId,
        bucket: bucketName,
        filename: fileName,
        grants: [{
          [userId]: {
            get: "true",
            put: "true",
            del: "true"
          }
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
 * @param {String} fileName object name
 * @param {String} userId requester ID
 * @param {Buffer} fileBuffer buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function _updateFile(bucketName, fileId, fileName, userId, fileBuffer) {
  try {
    const db = (await client()).db(DBNAME);

    const bucket = gridFs(db, { bucketName: bucketName });

    // Delete old object in the gridFS 
    await bucket.delete(ObjectId(fileId));
    
    // Create writable stream of the gridFS
    const uploadStream = bucket.openUploadStream(fileName, 
      {
        metadata: {
          keywords: [],
          bucket: bucketName
        }
    });

    const rStream = new stream.Readable(); // create readable stream
    rStream._read = () => {}; // need to implement private _read method 
    rStream.push(fileBuffer); // push data into readable stream
    rStream.push(null); // end of the stream (EOF)
    rStream.pipe(uploadStream); // write data from the readable stream to the writable one
    const newFileId = uploadStream.id;

    /**
     * delete old object in the file collection
     * and 
     * insert metadata of a new object into file collection;
     * bulk mode is used
     */
    const dbUpdateResult = await db
    .collection(FILECOLLECTION)
    .bulkWrite([
      { deleteOne: { 
        filter: {_id: fileId} } 
      },
      { insertOne: {
        _id: newFileId, 
        filename: fileName, 
        bucket: bucketName, 
        grants: [{
          [userId]: {
            get: "true",
            put: "true",
            del: "true"
          }
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
 * @param {String} fileName object name
 * @param {String} userId requester ID
 * @param {Buffer} fileBuffer buffer of file data
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function uploadFile(bucketName, fileName, userId, fileBuffer) {
  try {
    const [_, fileId] = await isFileExists(bucketName, fileName);
    if (!fileId) {
      await _createFile(bucketName, fileName, userId, fileBuffer);

      return [201, null]
    } else {
      await _updateFile(bucketName, fileId, fileName, userId, fileBuffer);

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
 * Get object from the particular bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileName object name
 * @returns {Promise<Array>} return Array [Number, Stream]
 */
async function getFile(bucketName, fileName) {
  try {
    const db = (await client()).db(DBNAME);

    const bucket = gridFs(db, { bucketName: bucketName });

    // Create readable stream of the gridFS
    const downloadStream = bucket.openDownloadStreamByName(fileName);

    return [200, downloadStream]
  } catch (err) {
    throw {
      exitCode: 500,
      message: err.message
    }
  }
}

/**
 * Get list of buckets belonging to the particular user
 * 
 * @param {String} userId requester ID
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function getBuckets(userId) {
  try {
    const db = (await client()).db(DBNAME);

    const dbFindResult = await db
      .collection(COLLECTION)
      .find({
        owner: userId
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

/**
 * Apply a new ACL to the object or bucket
 * 
 * @param {String} bucketName bucket name
 * @param {String} fileName object name
 * @param {Object} newGrants new grants
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function putObjectOrBucketACL(bucketName, fileName, newGrants) {
  try {
    /**
     * if an object name is not defined then
     * apply grants to a bucket
     */
    if (!fileName) {
      const db = (await client()).db(DBNAME);

      const col = db.collection(COLLECTION)
      const dbUpdateResult = await col.updateOne(
        {
          bucketname: bucketName,
        },
        {
          $set: {grants:newGrants}
        } 
      )

      return [200, dbUpdateResult]
    } else {
      const db = (await client()).db(DBNAME);
      
      const col = db.collection(FILECOLLECTION)
      const dbUpdateResult = await col.updateOne(
        {
          bucket: bucketName,
          filename: fileName
        },
        {
          $set: {grants: newGrants}
        } 
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
 * @param {String} fileName object name
 * @returns {Promise<Array>} resolve Array [Number, Object]
 */
async function getObjectOrBucketACL(bucketName, fileName) {
  try {
    const db = (await client()).db(DBNAME);
    /**
     * if object name is not defined then
     * return a bucket ACL
     */
    if (bucketName && !fileName) {
      const result = await db
        .collection(COLLECTION)
        .findOne({
          bucketname: bucketName,
        },
        {
          projection: { grants:1 }
        }
      )

      return [200, result]
    } else if (bucketName && fileName) {
      const result = await db
        .collection(FILECOLLECTION)
        .findOne({
          bucket: bucketName,
          filename: fileName
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
 * 
 * @param {*} bucketName 
 * @param {*} userId 
 * @returns 
 */
function getMeta(bucketName, userId) {

  return new Promise((resolve, reject) => {
    client.connect()
    .then(client => {
      const db =client.db(DBNAME);
      return db
        .collection(COLLECTION)
        .findOne({
          bucketname: bucketName,
          users: [userId]
        },
        {
          projection: { grants: 1 }
        })
    })
    .then(bucket => {
      const statusCode = bucket === null ? 403 : 200
      resolve({
        statusCode: statusCode, 
        body: bucket
      })
    })
    .catch(err => reject({
      exitCode: 500, 
      message: err.message
    }))
  })
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
      .collection(FILECOLLECTION)
      .find({ bucket: bucketName }).toArray()

    return [200, filesList]
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
 * @param {String} fileName object name
 * @param {String} fileId object ID
 * @returns {Promise<Array>} resolve Array [Number, Error]
 */
async function deleteKey(bucketName, fileName, fileId) {
  try {
    const db = (await client()).db(DBNAME);

    const bucket = gridFs(db, { bucketName: bucketName });

    await db
      .collection(FILECOLLECTION)
      .findOneAndDelete({ 
        bucket: bucketName, 
        filename: fileName 
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
  createBucket,
  getBucketGrants,
  putObjectOrBucketACL,
  uploadFile,
  getFile,
  getBuckets,
  // getMeta,
  getObjectOrBucketACL,
  listObjects,
  deleteKey
}