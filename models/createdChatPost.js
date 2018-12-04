const mongoose = require('mongoose');

const createdChatPost = new mongoose.Schema({
  username: String,
  topic: String,
  description: String,
  category: String,
  timeHour: String,
  timeMinute: String,
  guest: String,
});



module.exports = mongoose.model('CreatedChatPost', createdChatPost);
