const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/user');
const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('util');


const CreatedChatPost = require('./models/createdChatPost');
const ChatSession = require('./models/chatSession');
const bcrypt = require('bcrypt');
const cron = require('node-cron');

let messages = [];
require('./db/db');


// app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


const server = require('http').createServer(app);
// io = require('socket.io')(http, { pingInterval: 500 });

app.get('/testing', async (req, res) => {
  res.send("HELLO!!!")
})


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
  console.log(socket.id, 'SOCKET ID')
  let time = 'earfafawf';
  let utcTimeHours = '';
  let utcTimeMinutes = '';
  let utcTime = '';
  console.log('socket is connected')
  console.log('BEFORE CRON!!!')

  function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    });
  }
  let files = {};

  socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
    console.log('HELLO')

        var fileName = data['Name'];
        files[fileName] = {  //Create a new Entry in The files Variable
            FileSize : data['Size'],
            Data     : "",
            Downloaded : 0
        }
        var place = 0;
        try{
            var Stat = fs.statSync('Temp/' +  fileName);
            if(Stat.isFile())
            {
                files[fileName]['Downloaded'] = Stat.size;
                place = Stat.size / 524288;
            }
        }
        catch(er){} //It's a New File
        fs.open("Temp/" + fileName, "a", 0755, function(err, fd){
            if(err)
            {
                console.log(err);
            }
            else
            {
                files[fileName]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', { 'Place' : place, Percent : 0 });
            }
        });
});

  socket.on('Upload', function (data){
    console.log('HELLO')
    console.log(data)
        var fileName = data['Name'];
        files[fileName]['Downloaded'] += data['Data'].length;
        files[fileName]['Data'] += data['Data'];
        if(files[fileName]['Downloaded'] == files[fileName]['FileSize']) //If File is Fully Uploaded
        {
            socket.emit('uploadComplete', 'true');
            console.log('UPLOAD COMPLETE SALAY')

            fs.write(files[fileName]['Handler'], files[fileName]['Data'], null, 'Binary', function(err, Writen){
                //Get Thumbnail Here
            });
        }
        else if(files[fileName]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
          console.log('ELSE IF')
            fs.write(files[fileName]['Handler'], files[fileName]['Data'], null, 'Binary', function(err, Writen){
                files[fileName]['Data'] = ""; //Reset The Buffer
                var place = files[fileName]['Downloaded'] / 524288;
                var Percent = (files[fileName]['Downloaded'] / files[fileName]['FileSize']) * 100;
                socket.emit('MoreData', { 'Place' : place, 'Percent' :  Percent});
            });
        }
        else
        {
          console.log('ELSE')
            var place = files[fileName]['Downloaded'] / 524288;
            var Percent = (files[fileName]['Downloaded'] / files[fileName]['FileSize']) * 100;
            socket.emit('MoreData', { 'Place' : place, 'Percent' :  Percent});
        }
    });


// // DELETE DATABASE | DELETE DATABASE | DELETE DATABASE
//   User.deleteMany({}).then((item) => {
//     console.log('all users deleted');
//     console.log(item);
//   })
//
//   ChatSession.deleteMany({}).then((item) => {
//     console.log('all sessions deleted');
//     console.log(item);
//   })
//   CreatedChatPost.deleteMany({}).then((item) => {
//     console.log('all chats deleted');
//     console.log(item);
//   })
// // DELETE DATABASE | DELETE DATABASE | DELETE DATABASE


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

      await socket.emit('timer', time);
    }, interval);
  });

  // CHANNEL TO INVOKE ACTIVE CHATS BEING CREATED WHILE USER IS LOGGED IN BECAUSE
  // THERE IS ALREADY A FUNCTION INPLACE TO INVOKE ALL CHATS WHEN USER LOGS IN

    socket.on('LIVE-LAUNCH', async (info) => {
    await console.log(socket.handshake.session.creatorID === info.guest);

      await console.log(socket.handshake.session.creatorID, info, '234567890p');
      await console.log('LIVELAUNCH')
      if(info.message === 'LIVE-LAUNCH') {
      await console.log(info);
      await console.log('LIVA LAUNCH HITSSSS')
        await User.findById(socket.handshake.session.creatorID).then((foundUser) => {
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
      console.log(messages)
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
      userEntry.socketID = socket.id;

      const createdUser = await User.create(userEntry);


      if (createdUser._id) {
        socket.emit('registeredUser', 'registration successfull');
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
        console.log(userData.password, foundUser.password)
        if ((bcrypt.compareSync(userData.password, foundUser.password))) {

          socket.handshake.session.username = userData.username;
          socket.handshake.session.creatorID = foundUser._id;
          socket.handshake.session.logged = true;
          socket.handshake.session.save();
          const currentUserL = foundUser;

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

          foundUser.socketID = socket.id;
          foundUser.save();
          console.log(foundUser, '64567890');


          let sessionObj = {
            status: 'loggedIn',
            userID: foundUser._id
          }

          socket.emit('auth', 'Login Successful');
          socket.emit('session', sessionObj);
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

  socket.on('logoutUser', async (data) => {
    socket.emit('session', 'loggedIn');
    let logoutUser = await User.findByIdAndUpdate(socket.handshake.session.creatorID);
    logoutUser.socketID = 'offline';
    await logoutUser.save();
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

  let currentUserL = await User.findByIdAndUpdate(socket.handshake.session.creatorID);
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
    let task = cron.schedule(newSesh.cronTimeScheduled, async () => {
      console.log('AWEFAFWEAFWEA GUEST', socket.handshake.session.creatorID)
    let customRoom = newSesh._id + "IDID" + newSesh.creatorID;
    let chatObj = {
        roomID : customRoom,
        message: 'LAUNCH'
    }
    await console.log('HELLLOO MIRZA');

    await socket.emit('initiateRoomLaunch', chatObj);

    await socket.emit('uniqueRoomId', customRoom);

    await console.log('JOINED ROOM!');
    await socket.join(customRoom);

    socket.on(customRoom + 'Pmessage', async (message) => {
    if (socket.handshake.session.logged) {
      const msgObj = {
        username: socket.handshake.session.username,
        message: message
      }
        await messages.push(msgObj);
      console.log(messages);
        await socketServer.in(customRoom).emit(customRoom + 'Pmessages', messages);
      console.log(msgObj, 'msgObj');
    } else {
        await socketServer.in(customRoom).emit(customRoom + 'Pmessages', 'Incorrect Username Or Password');
    }
    });
    }, {
      scheduled: true,
      timezone: "Europe/London"
    });


console.log(currentUserL, 'CURRENT LOOGED IN USER');
console.log('before schedule')


let dTask = cron.schedule(newSesh.cronDestroyTime,  () => {
  console.log('Destroy');
  socket.emit('initiateRoomDestroy', 'DESTROY');
  task.destroy();
  dTask.destroy();
  socket.leave(customRoom);

 }, {
   scheduled: true,
   timezone: "Europe/London"
 });
});

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

      // let guestUserInvite = User.findById(newSesh.participantID);
      // guestUserInvite.then((user) => {
      //   console.log(user.socketID, 'LIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREPLIVELAUNCHPREP')
      //   socketServer.to(user.socketID).emit('LIVE-LAUNCH', intiateGuestChat);
      // })

      // socketServer.emit('redirectMessageToServer', intiateGuestChat)
      socket.broadcast.emit('redirectMessageToServer', intiateGuestChat);


      // console.log(currentUserL, 'CURRENT LOOGED IN USER');
      console.log('before schedule')
      // CRON CRON CRON CRON CRON
      let task = cron.schedule(newSesh.cronTimeScheduled, async () => {
        await console.log('AWEFAFWEAFWEA CLIENT', socket.handshake.session.creatorID)
      let customRoom = newSesh._id + "IDID" + newSesh.creatorID;
      let chatObj = {
          roomID : customRoom,
          message: 'LAUNCH'
      }
      await console.log('HELLLOO MIRZA');

      await socket.emit('initiateRoomLaunch', chatObj);

      await console.log('JOINED ROOM!');
      await socket.join(customRoom);

      await socket.emit('uniqueRoomId', customRoom);



      socket.on(customRoom + 'Pmessage', async (message) => {
      if (socket.handshake.session.logged) {
        const msgObj = {
          username: socket.handshake.session.username,
          message: message
        }
          await messages.push(msgObj);
        console.log(messages);
          await socketServer.in(customRoom).emit(customRoom + 'Pmessages', messages);
        console.log(msgObj, 'msgObj');
      } else {
          await socketServer.in(customRoom).emit(customRoom + 'Pmessages', 'Incorrect Username Or Password');
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
    socket.emit('initiateRoomDestroy', 'DESTROY');
    socket.leave(customRoom);

    let deleteOriginalPost = CreatedChatPost.findByIdAndRemove(newSesh.relatedChatPost);
    deleteOriginalPost.then((item) => {
      console.log('deletedOriginalPost', item);
    })
    let currentChatSession = ChatSession.findByIdAndRemove(newSesh._id);
    currentChatSession.then((item) => {
      let guestUser = User.findByIdAndUpdate(item.participantID);
      guestUser.then((user) => {
        let sessionIndexF = user.foreignChats.indexOf(item._id);
        user.foreignChats.splice(sessionIndexF, 1);
        user.save();
      })
      guestUser.save();
      console.log('deletedChatSession', item);
    })
    let sessionIndex = currentUserL.ownChats.indexOf(newSesh._id);
    currentUserL.ownChats.splice(sessionIndex, 1);
    currentUserL.save();
    console.log(currentUserL, 'CURREBNT USER LOOGED IN');
    task.destroy();
    dTask.destroy();

   }, {
     scheduled: true,
     timezone: "Europe/London"
   });
  });

  }
});/// end of connection
