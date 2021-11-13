'use strict'

const clientDeleteKey = require('../clients/delete-key');
const User = require('../models/user');

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
  const objectName = req.params.fileName; // retrieve a file name
  const key = req.key; // Authorization signature

  try { 
    const userId = user.getUserId(key);

    if (!userId) return res.status(401).end();

    /**
     * invoke deleteKey service
     * to delete the object from the bucket
     */
    clientDeleteKey.DeleteKey(
      {bucketName, objectName, userId},
      (err, resp) => {
        if (err) throw err

        const {statusCode} = resp;

        return res.status(statusCode).end()
      }
    );
  } catch (err) {
    // need to put error into a journal
    return res.status(500).end()
  }
}

module.exports = del;
