const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/user');


const CreatedChatPost = require('./models/createdChatPost');
const ChatSession = require('./models/chatSession');
const bcrypt = require('bcrypt');
var cron = require('node-cron');

const messages = [];

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
});

socketServer.on('connection', socket => {
  let time = 'earfafawf';
  let utcTimeHours = '';
  let utcTimeMinutes = '';
  let utcTime = '';
  console.log('socket is connected')
  console.log('BEFORE CRON!!!')

//// DELETE DATABASE | DELETE DATABASE | DELETE DATABASE
  // User.deleteMany({}).then((item) => {
  //   console.log('all users deleted');
  //   console.log(item);
  // })
  //
  // ChatSession.deleteMany({}).then((item) => {
  //   console.log('all sessions deleted');
  //   console.log(item);
  // })
  // CreatedChatPost.deleteMany({}).then((item) => {
  //   console.log('all chats deleted');
  //   console.log(item);
  // })
//// DELETE DATABASE | DELETE DATABASE | DELETE DATABASE


  socket.on('subscribeToTimer', async (interval) => {
    await console.log('client is subscribing to timer with interval ', interval);
    await setInterval( async () => {
        time = new Date();
        await console.log(time.toLocaleTimeString());
        // document.getElementById("demo").innerHTML = d.toLocaleTimeString();
        // console.log(time.getHours() + ':' + time.getMinutes());
        await console.log(time.getUTCHours() + ':' + time.getUTCMinutes());
        utcTime = time.getUTCHours() + ':' + time.getUTCMinutes();
        // await console.log(typeof(utcTime), utcTime)

      await socketServer.emit('timer', time);
    }, interval);
  });

  // CHANNEL TO INVOKE ACTIVE CHATS BEING CREATED WHILE USER IS LOGGED IN BECAUSE
  // THERE IS ALREADY A FUNCTION INPLACE TO INVOKE ALL CHATS WHEN USER LOGS IN
  socket.on(socket.handshake.session.creatorID, (info) => {
    console.log('LIVELAUNCH')
    if(info.message === 'LIVE-LAUNCH') {
      console.log(info);
      console.log('LIVA LAUNCH HITSSSS')
      User.findById(socket.handshake.session.creatorID).then((foundUser) => {
        invokeChatGuest(info.chatSessionID, foundUser);
      });
    }
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
        await socketServer.emit('session', 'loggedIn');
        await socketServer.emit('currentUser', socket.handshake.session.username)
      }
    } catch(err) {
      console.log(err);
    }
  });

  socket.on('loginUser', async (userData) => {
    try {

      const foundUser = await User.findOne({'username': userData.username});

      if (foundUser) {
        console.log(userData.password, foundUser.password)
        if ((bcrypt.compareSync(userData.password, foundUser.password))) {

          socket.handshake.session.username = userData.username;
          socket.handshake.session.creatorID = foundUser._id;
          socket.handshake.session.logged = true;
          socket.handshake.session.save();
          console.log(socket.handshake.session);
          const currentUserL = foundUser;
          console.log(foundUser.ownChats, '64567890');

          if(foundUser.ownChats.length > 0) {
            foundUser.ownChats.forEach((sessionItemID) => {
              invokeChat(sessionItemID, foundUser);
          });
          }
          if(foundUser.foreignChats.length > 0) {
            foundUser.foreignChats.forEach((sessionItemID) => {
              invokeChatGuest(sessionItemID, foundUser);
          });
          }
          foundUser.save();

          console.log('DONEDONE');

          socketServer.emit('auth', 'Login Successful');
          socketServer.emit('session', 'loggedIn');
          socketServer.emit('currentUser', socket.handshake.session.username)

        } else {
          socketServer.emit('auth', 'Incorrect Username Or Password');
        }
      } else {
        socketServer.emit('auth', 'Incorrect Username Or Password');
      } // end of foundUser
    } catch (err) {
      console.log(err)
    }
  });

  socket.on('logoutUser', (data) => {
    socketServer.emit('session', 'loggedIn');
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
        socketServer.emit('foundMathematics', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socketServer.emit('foundMathematics', 'Incorrect Username Or Password');
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
        socketServer.emit('foundMusic', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socketServer.emit('foundMathematics', 'Incorrect Username Or Password');
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
        socketServer.emit('foundPhilosophy', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socketServer.emit('foundMathematics', 'Incorrect Username Or Password');
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
        socketServer.emit('foundCompScieWebDes', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socketServer.emit('foundMathematics', 'Incorrect Username Or Password');
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
        socketServer.emit('foundBooks', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }

    } else {
      socketServer.emit('foundBooks', 'Incorrect Username Or Password');
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
        socketServer.emit('foundScience', foundData);
        console.log(foundData, 'FOUND DATAAAaa');
      } catch(err) {
        console.log(err);
      }
    } else {
      socketServer.emit('foundMathematics', 'Incorrect Username Or Password');
    }

  })
// ------------------------------------------------------
socket.on('requestTalk', async (data) => {

  try {
    const foundPost = await CreatedChatPost.findById(data.id);
    foundPost.participantID = socket.handshake.session.creatorID;
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


socketServer.emit('foundActivePosts', foundActivePosts);
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

  let cronDestroyTime = ((newDate.getUTCMinutes() + 2 ) + ' ' + newDate.getUTCHours() + ' ' +  newDate.getUTCDate() + ' ' +  bMonth.toString() + ' *');
  console.log(cronDestroyTime, 'CRON DESTROY TIME')

  let newChatSession = {
    creatorID: socket.handshake.session.creatorID,
    topic: chosen.topic,
    participantID: chosen.participantID,
    timeCreated: time.toLocaleTimeString(),
    cronTimeScheduled: cronTime,
    cronDestroyTime: cronDestroyTime,
    duration: chosen.duration,
    relatedChatPost: chosen._id,
    timezone: 'UTC'
  };

  let newSesh = await ChatSession.create(newChatSession);

  let currentUserL = await User.findById(socket.handshake.session.creatorID);
  currentUserL.ownChats.push(newSesh._id);
  currentUserL.save();

  let guestUser = await User.findById(chosen.participantID);
  guestUser.foreignChats.push(newSesh._id);
  guestUser.save();

  console.log(guestUser, 'GUEST USER | GUEST USER');

  console.log('before schedule')

  // INVOKE CHATROOOM
  invokeChat(newSesh._id, currentUserL);


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


const invokeChatGuest = (sessionItemID, currentUserL) => {
  let currentSession = ChatSession.findById(sessionItemID);
  currentSession.then((newSesh) => {
    console.log(newSesh, 'NEWSESHSSIONN')

    // console.log(currentUserL, 'CURRENT LOOGED IN USER');
    console.log('before schedule')
    // CRON CRON CRON CRON CRON
    let task = cron.schedule(newSesh.cronTimeScheduled, () => {
      console.log('AWEFAFWEAFWEA')
    let customRoom = newSesh._id + "IDID" + newSesh.creatorID;
    let chatObj = {
        roomID : customRoom,
        message: 'LAUNCH'
    }
    console.log('HELLLOO MIRZA');

    socketServer.emit('initiateRoomLaunch', chatObj);

    socketServer.emit('uniqueRoomId', customRoom);



    socket.on(customRoom + 'Pmessage', async (message) => {
    if (socket.handshake.session.logged) {
      const msgObj = await {
        username: socket.handshake.session.username,
        message: message
      }
      await messages.push(msgObj);
      console.log(messages);
      socketServer.emit(customRoom + 'Pmessages', messages);
      console.log(msgObj, 'msgObj');
    } else {
      socketServer.emit(customRoom + 'Pmessages', 'Incorrect Username Or Password');
    }
    });
    }, {
      scheduled: true,
      timezone: "Europe/London"
    });


console.log(currentUserL, 'CURRENT LOOGED IN USER');
console.log('before schedule')


let dTask = cron.schedule(newSesh.cronDestroyTime,  () => {
  console.log('Destroy')
  socketServer.emit('initiateRoomDestroy', 'DESTROY');
  task.destroy();
  dTask.destroy();

  console.log('THIS SHOULD NOT LOG!!!!!')
 }, {
   scheduled: true,
   timezone: "Europe/London"
 });
});
 console.log('NOTDONENOTDONE')

}



  const invokeChat = (sessionItemID, currentUserL) => {

    let currentSession = ChatSession.findById(sessionItemID);
    currentSession.then((newSesh) => {
      console.log(newSesh, 'NEWSESHSSIONN')

      let intiateGuestChat = {
        message: 'LIVE-LAUNCH',
        guest: newSesh.participantID,
        chatSessionID: newSesh._id
      }

      socketServer.emit('redirectMessageToServer', intiateGuestChat)

      // console.log(currentUserL, 'CURRENT LOOGED IN USER');
      console.log('before schedule')
      // CRON CRON CRON CRON CRON
      let task = cron.schedule(newSesh.cronTimeScheduled, () => {
        console.log('AWEFAFWEAFWEA')
      let customRoom = newSesh._id + "IDID" + newSesh.creatorID;
      let chatObj = {
          roomID : customRoom,
          message: 'LAUNCH'
      }
      console.log('HELLLOO MIRZA');

      socketServer.emit('initiateRoomLaunch', chatObj);

;

      socketServer.emit('uniqueRoomId', customRoom);



      socket.on(customRoom + 'Pmessage', async (message) => {
      if (socket.handshake.session.logged) {
        const msgObj = await {
          username: socket.handshake.session.username,
          message: message
        }
        await messages.push(msgObj);
        console.log(messages);
        socketServer.emit(customRoom + 'Pmessages', messages);
        console.log(msgObj, 'msgObj');
      } else {
        socketServer.emit(customRoom + 'Pmessages', 'Incorrect Username Or Password');
      }
      });
      }, {
        scheduled: true,
        timezone: "Europe/London"
      });


  console.log(currentUserL, 'CURRENT LOOGED IN USER');
  console.log('before schedule')


  let dTask = cron.schedule(newSesh.cronDestroyTime,  () => {
    console.log('Destroy')
    socketServer.emit('initiateRoomDestroy', 'DESTROY');

    let deleteOriginalPost = CreatedChatPost.findByIdAndRemove(newSesh.relatedChatPost);
    deleteOriginalPost.then((item) => {
      console.log('deletedOriginalPost', item);
    })
    let currentChatSession = ChatSession.findByIdAndRemove(newSesh._id);
    currentChatSession.then((item) => {
      let foreignChatDelete = User.findById(item.participantID);
      foreignChatDelete.then((user) => {
        let sessionIndexF = user.foreignChats.indexOf(item._id);
        user.foreignChats.splice(sessionIndexF, 1);
        user.save();
      })
      console.log('deletedChatSession', item);
    })
    let sessionIndex = currentUserL.ownChats.indexOf(newSesh._id);
    currentUserL.ownChats.splice(sessionIndex, 1);
    currentUserL.save();
    console.log(currentUserL, 'CURREBNT USER LOOGED IN');
    task.destroy();
    dTask.destroy();

    console.log('THIS SHOULD NOT LOG!!!!!')
   }, {
     scheduled: true,
     timezone: "Europe/London"
   });
  });
   console.log('NOTDONENOTDONE')

  }
});/// end of connection
