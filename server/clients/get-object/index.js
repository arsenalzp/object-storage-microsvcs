const http2 = require('http2');
const { GET_OBJECT_SVC_HOST, GET_OBJECT_SVC_PORT } = process.env;
// const GET_OBJECT_SVC_HOST = 'localhost';
// const GET_OBJECT_SVC_PORT = 7002;
const OPTIONS = {
  maxSessionMemory: 2048
}

const service = {
  HOST: `http://${GET_OBJECT_SVC_HOST}:${GET_OBJECT_SVC_PORT}`,
  connect() {
    return http2.connect(this.HOST, OPTIONS)
  }
};

module.exports = service;