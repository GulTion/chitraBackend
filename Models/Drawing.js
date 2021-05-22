const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DrawingSchema = new Schema({
  name: {
    type: String,
    unique:true,
    required: [true, 'Need User name']
  },
  key:String,

  timestamp:{
      type:Date
  }

});

const Drawing = mongoose.model('Drawing', DrawingSchema);
module.exports = Drawing;