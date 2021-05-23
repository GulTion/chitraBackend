const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Need User name'],
    lowercase:true,
    unique:true
  },
  password:{
    type:String
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;