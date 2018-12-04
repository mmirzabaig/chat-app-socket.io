const io = require('socket.io');
const express = require('express');
const app = express();
const User = require('./models/user');
const CreatedChatPost = require('./models/createdChatPost');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const usernames = {};
const messages = [];



module.exports = function(server){
  const socketServer = io(server);

  socketServer.on('connection', socket => {
    console.log('socket is connected')


    socket.on('message', (message) => {
      console.log(message, 'messaaaage')
      messages.push(message);
      socketServer.emit('messages', messages);
      console.log(messages);
    });
// --------- REGISTER USER ----------------
// --------- REGISTER USER ----------------
    socket.on('registerUser', async (userData) => {
      console.log(userData, 'socket data');
      try {
        const createdUser = await User.create(userData);
        console.log(createdUser, 'MongoDB data');
      } catch(err) {
        console.log(err);
      }
    });
// ------------------------------------------------------
// ----------CREATE NEW CHAT POST--------------------
// ----------CREATE NEW CHAT POST--------------------
    socket.on('createNewPost', async (newPostData) => {
      console.log(newPostData, 'socket data');
      try {
        const createdChatPost = await CreatedChatPost.create(newPostData);
        console.log(createdChatPost, 'MongoDB data');
      } catch(err) {
        console.log(err);
      }
    });
    // ------------------------------------------------------
    // ----------Find Mathematics--------------------
    // ----------Find Mathematics--------------------
    socket.on('findMathematics', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Mathematics'});
        socket.emit('foundMathematics', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
    // ------------------------------------------------------
    // ----------Find Music--------------------
    // ----------Find Music--------------------
    socket.on('findMusic', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Music'});
        socket.emit('foundMusic', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
    // ------------------------------------------------------
    // ----------Find Philosophy--------------------
    // ----------Find Philosophy--------------------
    socket.on('findPhilosophy', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Philosophy'});
        socket.emit('foundPhilosophy', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
    // ------------------------------------------------------
    // ----------Find Computer Science & Web Design--------------------
    // ----------Find Computer Science & Web Design--------------------
    socket.on('findCompScieWebDes', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'CompScieWebDes'});
        socket.emit('foundCompScieWebDes', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
    // ------------------------------------------------------
    // ----------Find Books--------------------
    // ----------Find Books--------------------
    socket.on('findBooks', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Books'});
        socket.emit('foundBooks', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
    // ------------------------------------------------------
    // ----------Find Science--------------------
    // ----------Find Science--------------------
    socket.on('findScience', async (data) => {
      console.log(data, 'FIND')
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Science'});
        socket.emit('foundScience', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    })
  // ------------------------------------------------------

  });/// end of connection
};// end of the function
