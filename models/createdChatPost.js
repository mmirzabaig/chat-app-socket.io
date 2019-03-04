const mongoose = require('mongoose');

const createdChatPost = new mongoose.Schema({
  username: String,
  topic: String,
  description: String,
  category: String,
  date: String,
  createdAt: Date,
  guest: [],
  chosen: {type: Boolean, default: false}
});



module.exports = mongoose.model('CreatedChatPost', createdChatPost);
