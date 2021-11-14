'use strict'

// const { APP_PORT } = process.env;
const APP_PORT = 8080
// const { LOGS_PATH } = process.env;
const LOGS_PATH = './logs';

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
const getHeaders = require('./middleware/getHeaders');
const genReqId = require('./middleware/genReqId');
const errorHandler = require('./middleware/errorHandler');
const logRequest = require('./middleware/logRequest');

// Create new memory storage for multer
const storage = multer.memoryStorage()
const upload = multer({storage: storage})

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


// Disable X-Powered-By header
app.disable('x-powered-by');

app.use((req, res, next, logger) => {
	console.log('log request');
	logRequest(req, res, next, logger)
});
app.use(getHeaders);
app.use(genReqId);

app.all('/:bucketId/:fileName', (req, res, next) => {
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
app.head('/:bucketId', head);
app.head('/:bucketId/:fileName', head);

// GET routes
app.get('/', get);
app.get('/:bucketId', get);
app.get('/:bucketId/:fileName', get);

// PUT routes
app.put('/:bucketId/:fileName', upload.single('upload'), put);
app.put('/:bucketId', put)
app.put('/:bucketId/:fileName', put)

// DELETE routes
app.delete('/:bucketId/:fileName', del);

app.use((err, req, res, next) => {
	errorHandler(err, req, res, next, logger)
});

app.listen(APP_PORT, () => {
	console.log(`Listening on ${APP_PORT} port`);
	// Catch unhandled promise rejection
  process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  });
})