'use strict'

const HEADERS = {'Content-Type': 'application/json'};

const clientDeleteKey = require('../clients/delete-key');
const getHeaders = require('../models/get-headers');
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

  try {
    // retrieve the Authorization signature
    const [{Authorization: key}, statusCode] = getHeaders(req, 'Authorization');
    if (statusCode != 200) return res.status(422).set(HEADERS).end();
    
    const userId = user.getUserId(key);

    if (!userId) {
      return res
      .status(401)
      .end();
    }

    /**
     * invoke deleteKey service
     * to delete the object from the bucket
     */
    clientDeleteKey.DeleteKey(
      {bucketName, objectName, userId},
      (err, resp) => {
        if (err) throw err

        const {statusCode} = resp;
        return res.status(statusCode).set(HEADERS).end()
      }
    );
  } catch (err) {
    // need to put error into a journal
    return res
    .status(500)
    .set(HEADERS)
    .end()
  }
}

module.exports = del;
