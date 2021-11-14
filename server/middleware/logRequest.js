const os = require('os');

function logRequest(req, res, next, logger) {
  try {
    const time = new Date();
    const method = req.method;
    const path = req.path;
    const hostname = os.hostname();
    const uuid = req.uuid;

    logger.info(`${time.toUTCString()} ${hostname} ${method} ${path} ${uuid} `);
    
    req.on('error', (err) => {
      next(err)
    });

    next() 
  } catch (err) {
    err.type = 'middleware';
    next(err)
  }
}

module.exports = logRequest;