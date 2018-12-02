const io = require('socket.io');

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







  });/// end of connection
};// end of the function
