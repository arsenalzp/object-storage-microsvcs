'use strict'

function getHeaders(req) {
  const userId = req.get('id');
  const xAmzAcl = req.get('x-amz-acl');
  
  console.log(req.headers);

  if (!userId) {
    return [400] // MissingSecurityHeader
  } else if (!xAmzAcl) {
    return [400] // MissingSecurityHeader
  }

  const headersArray = xAmzAcl.split(',');
  let grants = {};

  for (let [i, v] of headersArray.entries()) {
    const item = v.split('=');
    let [key, val] = item; 
    key = key.trim(); val = val.trim();

    if (key !== 'put' && key !== 'get' && key !== 'del') {
      return [400] // InvalidArgument
    }

    if (val !== 'true' && val !== 'false') {
      return [400] // InvalidArgument
    }

    Object.defineProperty(grants, key, { 
      value: val,
      writable: true,
      enumerable: true
    })
  }

  return [200, userId, grants]

}

module.exports = getHeaders;