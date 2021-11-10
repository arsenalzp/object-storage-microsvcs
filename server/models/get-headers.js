'use strict'

function _parseAcl(args) {
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

function getHeaders(req, ...headersList) {
  const headers = {};
  
  for (const h of headersList) {
    if (h === 'x-amz-acl') {
      const [acl, statusCode] = _parseAcl(req.get('x-amz-acl'));

      if (statusCode != 200) return [null, statusCode] // invalid argument
      
      Object.defineProperty(headers, 'targetGrants', {
        value: acl,
        writable: true,
        enumerable: true
      })
      continue
    }
    Object.defineProperty(headers, h, {
      value: req.get(h),
      writable: true,
      enumerable: true
    })
  }

  return [headers, 200]
}

/**
function setHeaders(req, headers) {
  return req
}
*/

module.exports = getHeaders;