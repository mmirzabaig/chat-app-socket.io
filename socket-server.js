  const io = require('socket.io');
  const User = require('./models/user');
  const CreatedChatPost = require('./models/createdChatPost');
  const bcrypt = require('bcrypt');

  const messages = [];

module.exports = function(server){


  const socketServer = io(server);
  const session = require("express-session")({
    secret: "this yo database",
    resave: true,
    saveUninitialized: true
  })
  const sharedsession = require("express-socket.io-session");



  socketServer.use(sharedsession(session));



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

      try {
        const password = userData.password;
        // Create our hash
        const passwordHash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
        console.log(passwordHash)
        // Create an object to put into our database into the User Model
        const userEntry = {};
          userEntry.email = userData.email;
          userEntry.username = userData.username;
          userEntry.password = passwordHash;
          userEntry.linkedin = userData.linkedin;

        const createdUser = await User.create(userEntry);
        console.log(createdUser, 'MongoDB data');
      } catch(err) {
        console.log(err);
      }
    });

    socket.on('loginUser', async (userData) => {
      try {

        const foundUser = await User.findOne({'username': userData.username});

        if (foundUser) {

          if ((bcrypt.compareSync(userData.password, foundUser.password))) {

            socket.handshake.username = userData.username;
            socket.handshake.session.logged = true;
            socket.handshake.session.save();
            console.log(socket.handshake.session);
            socket.emit('auth', 'Login Successful');

          } else {
            socket.emit('auth', 'Incorrect Username Or Password');
          }
        } else {
          socket.emit('auth', 'Incorrect Username Or Password');
        } // end of foundUser
      } catch (err) {
        console.log(err)
      }
    })

    socket.on('createNewPost', async (newPostData) => {
      console.log(newPostData, 'socket data');
      try {
        newPostData.username = foundUser.username;
        const createdChatPost = await CreatedChatPost.create(newPostData);
      } catch(err) {
        console.log(err);
      }
    });
    // ------------------------------------------------------
    // ----------Find Mathematics--------------------
    // ----------Find Mathematics--------------------
    socket.on('findMathematics', async (data) => {
      console.log(data, 'FIND')

      if (socket.handshake.logged === 'true') {

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
      if (socket.handshake.logged === 'true') {

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
  socket.on('requestTalk', async (data) => {

    try {
      const foundPost = await CreatedChatPost.findById(data.id);
      foundPost.guest.push(foundUser);
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
  console.log(foundUser.username, 'USERNAM3')
  const foundActivePosts = await CreatedChatPost.find({username: foundUser.username});

  socket.emit('foundActivePosts', foundActivePosts);
  console.log('PLEASE WORK',foundActivePosts);

} catch(err) {
  console.log(err);
}
});


socket.on('handleChosen',  async (id) => {
console.log(id);
try {
  let chosen = await CreatedChatPost.find({_id: id});
  console.log(chosen, 'YESSSS')
} catch (err) {
  console.log(err);
}


})


socket.on('disconnect', function(){
console.log('user disconnected');
});

// ------------------------------------------------------
// ------------------------------------------------------


  });/// end of connection
};// end of the function
