const express = require('express');
const app = express();
const chatAppServer = require('./socket-server');

const server = app.listen(8000, () => {
  console.log('Your server is listening on port 8000');
});

chatAppServer(server);
