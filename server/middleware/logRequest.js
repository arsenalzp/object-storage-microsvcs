function genReqId(req, res, next) {
  try {
    next() 
  } catch (err) {
    err.type = 'middleware';
    next(err)
  }
}

module.exports = genReqId;