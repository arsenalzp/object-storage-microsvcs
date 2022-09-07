const http2 = require('http2');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === "development") {
  var AUTH_SVC_HOST = 'localhost';
  var AUTH_SVC_PORT = 7002;
} else if (process.env.NODE_ENV === "production") {
  var AUTH_SVC_HOST = process.env.AUTH_SVC_HOST;
  var AUTH_SVC_PORT  = process.env.AUTH_SVC_PORT;
}

const tlsCreds = {
  ca: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  cert: fs.readFileSync(path.join(__dirname, 'tls', 'tls.crt')),
  key: fs.readFileSync(path.join(__dirname, 'tls', 'tls.key'))
};

const OPTIONS = {
  ca: [tlsCreds.ca],
  key: tlsCreds.key,
  cert: tlsCreds.cert,
  requestCert: true
};

const service = {
  URL: `https://${AUTH_SVC_HOST}:${AUTH_SVC_PORT}`,
  connect() {
    return http2.connect(this.URL, OPTIONS)
  }
};

module.exports = service;