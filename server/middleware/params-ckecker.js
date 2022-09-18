class ParamsChecker {
  constructor() {
    this._oNameLen = 24; // default object name length
    this._bNameLen = 12; // default bucket name length

    const f = (req, res, next) => {
      const oNameRgxp = new RegExp(`^[A-Za-z0-9\-_.]{3,${this._oNameLen}}$`); // regexp for object name
      const bNameRgxp = new RegExp(`^[A-Za-z0-9]{3,${this._bNameLen}}$`); // regexp for bucket name

      const bucketName = req.params.bucketId; // retrieve a bucket name
      const objectName = req.params.objectName; // retrieve a object name
      
      /**
       * check bucket name and object name synatx
       * if false - throw error
       */
      if (objectName && bucketName) {

        if(!oNameRgxp.test(objectName) || !bNameRgxp.test(bucketName)) {
          console.log(oNameRgxp.test(objectName));
          console.log(bNameRgxp.test(bucketName));
          const err = new Error("name complience error");
          err.type = 'middleware';
          next(err)
          return
        }

        next()
      } else if (bucketName && !objectName) {

        if(!bNameRgxp.test(bucketName)) {
          const err = new Error("name complience error");
          err.type = 'middleware';
          next(err)
          return
        }

        next()
        return
      } else {
        next()
        return
      }

    }

    // set object name length
    f.objNameLen = (oNameLen) => {
      this._oNameLen = oNameLen;
      return this
    }

    // set bucket name length
    f.bucketNameLen = (bNameLen) => {
      this._bNameLen = bNameLen;
      return this
    }

    return f
  }
}

module.exports = new ParamsChecker();