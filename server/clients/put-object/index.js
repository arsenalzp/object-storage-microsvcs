const http2 = require('http2');
const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === "development") {
  var PUT_OBJECT_SVC_HOST = 'localhost';
  var PUT_OBJECT_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var PUT_OBJECT_SVC_HOST = process.env.PUT_OBJECT_SVC_HOST;
  var PUT_OBJECT_SVC_PORT  = process.env.PUT_OBJECT_SVC_PORT;
}

const tlsCreds = {
  ca: fs.readFileSync(path.join(__dirname, '..','tls', 'rootCA.crt')),
  cert: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.crt')),
  key: fs.readFileSync(path.join(__dirname, '..','tls', 'tls.key'))
};

const OPTIONS = {
  ca: [tlsCreds.ca],
  key: tlsCreds.key,
  cert: tlsCreds.cert,
  requestCert: true
};

const service = {
  URL: `https://${PUT_OBJECT_SVC_HOST}:${PUT_OBJECT_SVC_PORT}`,
  connect() {
    return http2.connect(this.URL, OPTIONS)
  }
};

module.exports = service;