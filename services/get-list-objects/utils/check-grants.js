
class Grants {
  constructor(userId, method, grants) {
    this.grants = grants
    this.userId = userId,
    this.method = method
  }

  check() {
    if (!this.grants.grants || this.grants.grants.length === 0) return false
    for (const v of this.grants.grants) {
      if (v[this.userId]) {
        if (v[this.userId][this.method] === 'true') return true
      }
    }
    return false
  }
  
  set(targetUserId, targetGrants) {
    for (const [i, v] of this.grants.grants.entries()) {
      if (v[targetUserId]) {
        this.grants.grants[i][targetUserId] = targetGrants;
        return this.grants.grants
      }
    }

    this.grants.grants.push({[targetUserId]:targetGrants})

    return this.grants.grants
  }

  /*
  del(targetUserId) {

  }
  */
}

module.exports = Grants;