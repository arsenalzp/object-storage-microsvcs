const { v4: uuidv4 } = require('uuid');

function genReqId(req, res, next) {
  try {
    const UUID = uuidv4();
    req.uuid = UUID;
    res.uuid = UUID;

    res.setHeader('x-amz-request-id', UUID); // set UUID for the response

    next() 
  } catch (err) {
    return res.status(500).end()
  }
}

module.exports = genReqId;