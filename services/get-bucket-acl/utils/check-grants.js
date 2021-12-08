const DEL_ACL = 1; // [0,0,1] 
const PUT_ACL = 2; // [0,1,0] 
const GET_ACL = 4; // [1,0,0] 

class Grants {
  constructor(userId, grants, targetUserId, targetGrants) {
    this.grants = grants;
    this.userId = userId;
    this.targetUserId = targetUserId;
    this.targetGrants = targetGrants;
  }


  checkAccess(method) {
    if (!this.grants.grants || this.grants.grants.length === 0) return false
    for (const v of this.grants.grants) {
      if (v[this.userId]) {
        const bitMask = v[this.userId];
        if (method === 'del') {
          return (bitMask & DEL_ACL) === DEL_ACL
        } else if (method === 'put') {
          return (bitMask & PUT_ACL) === PUT_ACL
        } else if (method === 'get') {
          return (bitMask & GET_ACL) === GET_ACL
        } else {
          return false
        }
      }
    }
    return false
  }
  
  modAccess() {
    try {
      for (const [i, v] of this.grants.grants.entries()) {
        if (v[this.targetUserId]) {
          this.grants.grants[i][this.targetUserId] = this._parseGrants(this.targetGrants);
          return this.grants.grants
        }
      }
      
      const newBitMask = this._parseGrants(this.targetGrants);
      this.grants.grants.push({[this.targetUserId]:newBitMask})
  
      return this.grants.grants
    } catch (err) {
      throw err
    }
  }

  _parseGrants(targetGrants) {
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
  /*
  del(targetUserId) {

  }
  */
}

module.exports = Grants;