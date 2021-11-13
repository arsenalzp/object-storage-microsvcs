function genReqId(req, res, next) {
  try {
    next() 
  } catch (err) {
    return res.status(500).end()
  }
}

module.exports = genReqId;