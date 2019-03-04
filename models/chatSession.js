const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  creatorID: String,
  participantID: String,
  timeCreated: String,
  timeScheduled: String,
  duration: String,
})

module.exports = mongoose.model('ChatSession', chatSessionSchema);
