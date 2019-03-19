const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: String,
  username: String,
  password: String,
  linkedin: String,
  ownChats: [{ type: Schema.Types.ObjectId, ref: 'ChatSession' }],
  foreignChats: [String],
  destroyChats: [String]
});



module.exports = mongoose.model('User', UserSchema);
