'use strict'

const { APP_PORT } = process.env;
// const APP_PORT = 8080
const { LOGS_PATH } = process.env;
// const LOGS_PATH = './logs';

const path = require('path');
const express = require('express');
const multer = require('multer');
const winston = require('winston');

// Import routes
const put = require('./routes/put');
const get = require('./routes/get');
const head = require('./routes/head');
const del = require('./routes/delete');

// Import middlewares
const getHeaders = require('./middleware/headers-getter');
const genReqId = require('./middleware/reqid-generator');
const handleError = require('./middleware/error-handler');
const logRequest = require('./middleware/request-logger');
const checkParams = require('./middleware/params-ckecker');

// Create new memory storage for multer
const storage = multer.memoryStorage()
const upload = multer({storage: storage})

checkParams.fileNameLen(64);
checkParams.bucketNameLen(16);

// Init express
const app = express();

// Init winston logger
const logConfiguration = {
	'transports': [
			new winston.transports.File({
				level: 'info',
				filename: path.join(LOGS_PATH, 'access_log')
			}),
			new winston.transports.File({
				level: 'error',
				filename: path.join(LOGS_PATH, 'errors_log')
		})

	]
};
const logger = winston.createLogger(logConfiguration);
// const paramCheck = checker.config()

// Disable X-Powered-By header
app.disable('x-powered-by');

// Retrieve headers from the request
app.use(getHeaders);

// Generate the uniq ID for incoming request
app.use(genReqId);
app.use((req, res, next) => {
	logRequest(req, res, next, logger)
});

app.all('/:bucketId/:objectName', (req, res, next) => {
  // Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, DELETE');
	res.setHeader('Access-Control-Allow-Headers', '*');

	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}
  next()
})

// HEAD routes
app.head('/:bucketId', checkParams, head);
app.head('/:bucketId/:objectName', checkParams, head);

// GET routes
app.get('/', get);
app.get('/:bucketId', checkParams, get);
app.get('/:bucketId/:objectName', checkParams, get);

// PUT routes
app.put('/:bucketId/:objectName', checkParams, upload.single('upload'), put);
app.put('/:bucketId', checkParams, put)
app.put('/:bucketId/:objectName', checkParams, put)

// DELETE routes
app.delete('/:bucketId/:objectName', checkParams, del);

app.use((err, req, res, next) => {
	handleError(err, req, res, next, logger)
});

app.listen(APP_PORT, () => {
	console.log(`Listening on ${APP_PORT} port`);
	// Catch unhandled promise rejection
  process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  });
})