const http2 = require('http2');
const cwd = require("process").cwd();
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === "development") {
  var DELETE_KEY_SVC_HOST = 'localhost';
  var DELETE_KEY_SVC_PORT = 7001;
}

if (process.env.NODE_ENV === "production") {
  var DELETE_KEY_SVC_HOST = process.env.DELETE_KEY_SVC_HOST;
  var DELETE_KEY_SVC_PORT  = process.env.DELETE_KEY_SVC_PORT;
}

const tlsCreds = {
  cacert: fs.readFileSync(path.join(__dirname, 'tls', 'rootCA.crt')),
  clntcert: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.crt')),
  clntkey: fs.readFileSync(path.join(__dirname, 'tls', 'client.objstorage.key'))
};

const OPTIONS = {
  ca: tlsCreds.cacert,
  rejectUnauthorized: false, // only for dev environment!!
};

const service = {
  URL: `https://${DELETE_KEY_SVC_HOST}:${DELETE_KEY_SVC_PORT}`,
  connect() {
    return http2.connect(this.URL, OPTIONS)
  }
};

module.exports = service;