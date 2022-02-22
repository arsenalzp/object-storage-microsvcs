const DEL_ACL = 1; // [0,0,1] 
const PUT_ACL = 2; // [0,1,0] 
const GET_ACL = 4; // [1,0,0] 

function modGrants(grants, targetUserId, targetGrants) {
  try {
    for (const [i, v] of grants.entries()) {
      if (v.hasOwnProperty(targetUserId)) {
        grants[i][targetUserId] = _parseGrants(targetGrants);
        return grants
      }
    }
    
    const newBitMask = _parseGrants(targetGrants);
    this.grants.grants.push({[targetUserId]:newBitMask})

    return this.grants.grants
  } catch (err) {
    throw err
  }
}

function _parseGrants(targetGrants) {
  try {
    let bitMask = 0;
    const grantsObj = JSON.parse(targetGrants);
    bitMask = grantsObj['del']=='true' ? (bitMask|DEL_ACL) : bitMask;
    bitMask = grantsObj['put']=='true' ? (bitMask|PUT_ACL) : bitMask;
    bitMask = grantsObj['get']=='true' ? (bitMask|GET_ACL) : bitMask;

    return bitMask
  } catch(err) {
    throw err
  }
}

module.exports = modGrants;