'use strict'

/**
 * Extends Error class to provide custom
 * error messages
 * 
 * @param {String} msg custom error message
 * @param {String} code custom error code
 * @param {String} err original error object
 */
class CustomError extends Error {
  constructor(msg, code, err) {
    super(err);
    this.msg = msg;
    this.code = code;
    this.err = err;
  }

  static DbClntErr = "EDBCLNT-1002";
  static DbConnErr = "EDBCLNT-2003";
  static ChkGrantErr = "ECHGRNT-0004";
  static BcktReqErr = "EBCKTR-0005";
  static SvcClntErr = "ESVCCLNT-0006";

  toString() {
    return `${this.msg}, code: ${this.code}, ${this.err.message}`
  }
}

module.exports = CustomError;