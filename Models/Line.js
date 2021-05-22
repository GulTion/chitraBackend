const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LineSchema = new Schema({
  drawingId:String,
  brushColor:String,
  from:{
      x:Number,
      y:Number
  },
  to:{
    x:Number,
    y:Number
  },
  linewidth:Number,
  timestamp:Date


});

const Line = mongoose.model('Line', LineSchema);
module.exports = Line;