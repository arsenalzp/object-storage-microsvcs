'use strict'

const HEADERS = {'Content-Type': 'application/json'};

const User = require('../models/user');
const deleteKey = require('../services/delete-key');

const user = new User();
user.setUserId();

/**
 * DELETE route.
 * 
 * Invoke deleteKey service.
 * 
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @returns {Object} HTTP response or Error
 */
async function del(req, res) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const fileName = req.params.fileName; // retrieve a file name
  const key = req.query.key; // retrieve the API key

  // Is key provided? If no, respond 422 
  if (!key) {
    return res
    .status(422)
    .end();
  }

  const userId = user.getUserId(key);

  if (!userId) {
    return res
      .status(401)
      .end();
  }
  
  try {
    /**
     * invoke deleteKey service
     * to delete the object from the bucket
     */
    const [statusCode, _] = await deleteKey(bucketName, fileName, userId);

    return res
      .status(statusCode)
      .set(HEADERS)
      .end()
  } catch ({errorCode}) {
    
    return res
      .status(errorCode)
      .set(HEADERS)
      .end()
  }
  
}

module.exports = del;
