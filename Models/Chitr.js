const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Chitr = new Schema({
  drawingId:String,
  json:Object
});

const Drawing = mongoose.model('Chitr', Chitr);
module.exports = Drawing;