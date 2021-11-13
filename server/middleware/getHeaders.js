'use strict'

function _parseAcl(args) {
  if (typeof args !== 'string' || args.length === 0) {
    return [null, 200]
  }
  const headersArray = args.split(',');
  let acl = {};

  for (let [i, v] of headersArray.entries()) {
    const item = v.split('=');
    let [key, val] = item; 
    key = key.trim(); val = val.trim();
    
    if (key !== 'put' && key !== 'get' && key !== 'del') {
      return [null, 400] // invalidArgument
    }

    if (val !== 'true' && val !== 'false') {
      return [null, 400] // invalidArgument
    }

    Object.defineProperty(acl, key, { 
      value: val,
      writable: true,
      enumerable: true
    })
  }

  return [acl, 200]
}

function getHeaders(req, res, next) {
  try {
    const [acl, statusCode] = _parseAcl(req.get('x-amz-acl'));
    if (statusCode != 200) return res.status(statusCode).end() // invalid argument

    req.acl = acl; // attach acl
    
    req.targetUserId = req.get('targetUserId'); // retrieve and attach the target user ID

    req.key = req.get('Authorization'); // retrieve and attach the Authorization signature
    
    next()
  } catch (err) {
    return res.status(500).end()
  }
}

module.exports = getHeaders;