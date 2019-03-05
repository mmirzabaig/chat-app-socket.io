const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  creatorID: String,
  topic: String,
  participantID: String,
  timeCreated: String,
  cronTimeScheduled: String,
  duration: String,
  timezone: String
})

module.exports = mongoose.model('ChatSession', chatSessionSchema);
