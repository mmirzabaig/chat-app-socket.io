const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/user');
const CreatedChatPost = require('./models/createdChatPost');
const ChatSession = require('./models/chatSession');
const bcrypt = require('bcrypt');
var cron = require('node-cron');

const messages = [];
let time = 'earfafawf';
// Attach session

require('./db/db');


// app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


const server = require('http').createServer(app);

const io = require('socket.io');
const socketServer = io(server);
const session = require("express-session")({
  secret: "this yo backend",
  resave: true,
  saveUninitialized: true
});

const sharedsession = require("express-socket.io-session");

socketServer.use(sharedsession(session, {
  autoSave:true
}));

socketServer.listen(8000, () => {
  console.log("Your server is listening on port 8000!");
})

socketServer.on('connection', socket => {
  console.log('socket is connected')
  console.log('BEFORE CRON!!!')
  cron.schedule('0 1 * * *', () => {
    console.log('Runing a job at 01:00 at America/Sao_Paulo timezone');
  }, {
    scheduled: true,
    timezone: "Europe/London"
  });



  socket.on('subscribeToTimer', async (interval) => {
    await console.log('client is subscribing to timer with interval ', interval);
    await setInterval( async () => {
        time = new Date();
        await console.log(time.toLocaleTimeString());
        // document.getElementById("demo").innerHTML = d.toLocaleTimeString();
        // console.log(time.getHours() + ':' + time.getMinutes());
        await console.log(time.getUTCHours() + ':' + time.getUTCMinutes());


      await socketServer.emit('timer', time);
    }, interval);
  });

  socket.on('message', async (message) => {
    if (socket.handshake.session.logged) {
      const msgObj = await {
        username: socket.handshake.session.username,
        message: message
      }
      await messages.push(msgObj);
      socketServer.emit('messages', messages);
      console.log(msgObj);
    } else {
      socketServer.emit('messages', 'Incorrect Username Or Password');
    }
  });
// --------- REGISTER USER ----------------
// --------- REGISTER USER ----------------
  socket.on('registerUser', async (userData) => {

    try {
      const password = await userData.password;
      // Create our hash
      const passwordHash = await bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      console.log(passwordHash)
      // Create an object to put into our database into the User Model
      const userEntry = {};
        userEntry.email = userData.email;
        userEntry.username = userData.username;
        userEntry.password = passwordHash;
        userEntry.linkedin = userData.linkedin;

      const createdUser = await User.create(userEntry);


      if (createdUser._id) {
        socketServer.emit('registeredUser', 'registration successfull');
        socket.handshake.session.username = userData.username;
        socket.handshake.session.creatorID = createdUser._id;
        console.log(createdUser);
        console.log(socket.handshake.session.creatorID);
        socket.handshake.session.logged = true;
        socket.handshake.session.save();
        await socket.emit('session', 'loggedIn');
        await socket.emit('currentUser', socket.handshake.session.username)
      }
    } catch(err) {
      console.log(err);
    }
  });

  socket.on('loginUser', async (userData) => {
    try {

      const foundUser = await User.findOne({'username': userData.username});

      if (foundUser) {

        if ((bcrypt.compareSync(userData.password, foundUser.password))) {

          socket.handshake.session.username = userData.username;
          socket.handshake.session.creatorID = foundUser._id;
          socket.handshake.session.logged = true;
          socket.handshake.session.save();
          console.log(socket.handshake.session);
          socket.emit('auth', 'Login Successful');
          socket.emit('session', 'loggedIn');
          socket.emit('currentUser', socket.handshake.session.username)

        } else {
          socket.emit('auth', 'Incorrect Username Or Password');
        }
      } else {
        socket.emit('auth', 'Incorrect Username Or Password');
      } // end of foundUser
    } catch (err) {
      console.log(err)
    }
  });

  socket.on('logoutUser', (data) => {
    socket.emit('session', 'loggedIn');
    socket.handshake.session.username = null;
    socket.handshake.session.creatorID = null;
    socket.handshake.session.logged = false;
    // socket.handshake.session.destroy();
    console.log(socket.handshake.session, 'mirza')
  });

  socket.on('createNewPost', async (newPostData) => {
    console.log(newPostData, 'socket data');
    // console.log(req.body.date + 'T' + req.body.time);
    try {
      newPostData.creatorID = socket.handshake.session.creatorID;
      newPostData.createdAt = time;
      const createdChatPost = await CreatedChatPost.create(newPostData);
      console.log(createdChatPost);
    } catch(err) {
      console.log(err);
    }
  });
  // ------------------------------------------------------
  // ----------Find Mathematics--------------------
  // ----------Find Mathematics--------------------
  socket.on('findMathematics', async (data) => {
    console.log(data, 'FIND')

    if (socket.handshake.session.logged === true) {

      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Mathematics'});
        socket.emit('foundMathematics', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socket.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
  // ------------------------------------------------------
  // ----------Find Music--------------------
  // ----------Find Music--------------------
  socket.on('findMusic', async (data) => {
    console.log(data, 'FIND')
    if (socket.handshake.session.logged === true) {
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Music'});
        socket.emit('foundMusic', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socket.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
  // ------------------------------------------------------
  // ----------Find Philosophy--------------------
  // ----------Find Philosophy--------------------
  socket.on('findPhilosophy', async (data) => {
    console.log(data, 'FIND')
    if (socket.handshake.session.logged === true) {
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Philosophy'});
        socket.emit('foundPhilosophy', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socket.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
  // ------------------------------------------------------
  // ----------Find Computer Science & Web Design--------------------
  // ----------Find Computer Science & Web Design--------------------
  socket.on('findCompScieWebDes', async (data) => {
    console.log(data, 'FIND')

    if (socket.handshake.session.logged === true) {

      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'CompScieWebDes'});
        socket.emit('foundCompScieWebDes', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socket.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
  // ------------------------------------------------------
  // ----------Find Books--------------------
  // ----------Find Books--------------------
  socket.on('findBooks', async (data) => {
    console.log(data, 'FIND')
    if (socket.handshake.session.logged === true) {

      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Books'});
        socket.emit('foundBooks', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socket.emit('foundBooks', 'Incorrect Username Or Password');
    }

  })
  // ------------------------------------------------------
  // ----------Find Science--------------------
  // ----------Find Science-------------------
  socket.on('findScience', async (data) => {
    console.log(data, 'FIND')
    if (socket.handshake.session.logged === true) {
      try {
        console.log('FOUND IT')
        const foundData = await CreatedChatPost.find({category: 'Science'});
        socket.emit('foundScience', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socket.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
// ------------------------------------------------------
socket.on('requestTalk', async (data) => {

  try {
    const foundPost = await CreatedChatPost.findById(data.id);
    foundPost.guest.push(socket.handshake.session.username);
    foundPost.save();
    console.log(foundPost, 'YEA MIRZA')

  } catch(err) {
    console.log(err);
  }
})
// ------------------------------------------------------
// ------------------------------------------------------

socket.on('requestActivePosts', async (data) => {
try {
  console.log(socket.handshake.session.creatorID);
const foundActivePosts = await CreatedChatPost.find({});


socket.emit('foundActivePosts', foundActivePosts);
console.log('PLEASE WORK',foundActivePosts);

} catch(err) {
console.log(err);
}
});


socket.on('handleChosen',  async (id) => {
console.log(id);
try {
  let chosen = await CreatedChatPost.findById(id);
  console.log(chosen);
  console.log(chosen.date + 'T' + chosen.time);
  let newDate = new Date(chosen.date + 'T' + chosen.time);
  // let newDate = new Date('2018-03-03' + 'T' + '14:01');
  let bMonth = Number(newDate.getUTCMonth()) + 1;


  await console.log(newDate.getUTCMinutes(), newDate.getUTCHours(), newDate.getUTCDate(), (Number(newDate.getUTCMonth()) + 1).toString());
  let cronTime = (newDate.getUTCMinutes() + ' ' + newDate.getUTCHours() + ' ' +  newDate.getUTCDate() + ' ' +  bMonth.toString() + ' *');

  let newChatSession = {
    creatorID: chosen._id,
    topic: chosen.topic,
    participantID: socket.handshake.session.creatorID,
    timeCreated: time.toLocaleTimeString(),
    cronTimeScheduled: cronTime,
    duration: '15',
    timezone: 'UTC'
  };
  let newSesh = await ChatSession.create(newChatSession);

  console.log('before schedule')
  cron.schedule(cronTime, () => {
    console.log('HELLLOO MIRZA');
    socket.join('PersonalChatroom', () => {
      console.log('before signal fire');
      socketServer.in('PersonalChatroom').emit('Personal', 'YEAH BITCH');
    });
  }, {
    scheduled: true,
    timezone: "Europe/London"
  });
  console.log(newSesh);



  // console.log(chosen, 'YESSSS')
} catch (err) {
  console.log(err);
}
});


socket.on('disconnect', function(){
console.log('user disconnected');
socket.handshake.session.username = null;
socket.handshake.session.logged = false;
socket.handshake.session.save();
});

// ------------------------------------------------------
// ------------------------------------------------------


});/// end of connection
