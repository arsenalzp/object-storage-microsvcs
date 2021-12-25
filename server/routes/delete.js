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
async function del(req, res, next) {
  const bucketName = req.params.bucketId; // retrieve a bucket name
  const objectName = req.params.objectName; // retrieve a object name
  const key = req.key; // Authorization signature

  try { 
    const userId = user.getUserId(key);

    if (!userId) {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      return next(err)
    }

    /**
     * invoke deleteKey service
     * to delete the object from the bucket
     */
    clientDeleteKey.DeleteKey(
      {bucketName, objectName, userId},
      (err, resp) => {

        if (err) {
          err.statusCode = 500;
          return next(err)
        }

        const {statusCode} = resp;

        return res.status(statusCode).end()
      }
    );
  } catch (err) {
    err.type = 'routes';
    err.statusCode = 500;
    next(err)
  }
}

module.exports = del;
