'use strict'

const http = require('http');
const express = require('express');
const multer = require('multer');

// Import routes
const put = require('./routes/put');
// const get = require('./routes/get');
// const head = require('./routes/head');
// const del = require('./routes/delete');

// Create new memory storage for multer
const storage = multer.memoryStorage()
const upload = multer({storage: storage})

// Init Express
const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

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
// app.head('/:bucketId', head);
// app.head('/:bucketId/:fileName', head);

// GET routes
// app.get('/', get);
// app.get('/:bucketId', get);
// app.get('/:bucketId/:fileName', get);

// PUT routes
app.put('/:bucketId/:fileName', upload.single('upload'), put);
app.put('/:bucketId', put)
app.put('/:bucketId/:fileName', put)

// DELETE routes
// app.delete('/:bucketId/:fileName', del);

app.listen(8080, () => {
	console.log('Listening on 8080 port');
	// Catch unhandled promise rejection
  process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  });
})