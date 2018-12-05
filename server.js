const express = require('express');
const app = express();
const chatAppServer = require('./socket-server');
const bodyParser = require('body-parser');
const cors = require('cors');
// Attach session

require('./db/db');



app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, // This allows the session cookie to be sent back and forth
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));




const server = app.listen(8000, () => {
  console.log('Your server is listening on port 8000');
});

chatAppServer(server);
