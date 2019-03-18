const mongoose = require('mongoose');

const createdChatPost = new mongoose.Schema({
  creatorID: String,
  topic: String,
  description: String,
  category: String,
  date: String,
  time: String,
  createdAt: Date,
  guest: [],
  chosen: {type: Boolean, default: false},
  duration: String
});



module.exports = mongoose.model('CreatedChatPost', createdChatPost);
