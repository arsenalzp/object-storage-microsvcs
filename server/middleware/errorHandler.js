function errorHandler(err, req, res, next) {
  const uuid = req.uuid; // retrieve the request ID
  const statusCode = err.statusCode;
  const message = err.message;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <Error>
    <Code>${statusCode}</Code>
    <Message>${message}</Message>
    <Resource>${req.path}</Resource>
    <RequestId>${uuid}</RequestId>
  </Error>`

  res.setHeader('Content-Type', 'text/xml')
  res.status(statusCode)
  return res.end(xml)
}

module.exports = errorHandler;

/**
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchKey</Code>
  <Message>The resource you requested does not exist</Message>
  <Resource>/mybucket/myfoto.jpg</Resource>
  <RequestId>4442587FB7D0A2F9</RequestId>
</Error>
 */