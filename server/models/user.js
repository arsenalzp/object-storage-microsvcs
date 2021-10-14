'use strict'

class User {
  constructor() {
    this._storage = new Map();
  }

  getUserId(key) {
    return this._storage.get(key)
  }

  setUserId(key) {
    this._storage.set('40ab6da8b840', 'user1');
    this._storage.set('f9810c6884fc', 'user2');
  }
}

module.exports = User;