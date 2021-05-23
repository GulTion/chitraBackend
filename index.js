
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http,{
  cors: {
    origin: '*',
  }
});
const cors = require('cors')

const {Drawing, User, Line} = require("./Models/index")
const {log} = console;
app.use(function (req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});
app.use(cors({origin:"*"}))
function createDrawing({name,key, client}) {
  const drawing = new Drawing({name,key, timestamp:new Date() });
    drawing.save().then(e=>{
      // log(e);
    }).catch(err=>{
      log(err)
    })
}

function subscribeForDrawingList({client}) {
  log("drawing is getting")
  Drawing.find({}).sort({"timestamp":-1}).exec((err, data)=>{

    client.emit("drawingList", data)

})

}

function subscribeForDrawing({client}){
  Drawing.watch().on("change", (data)=>{
    log(data)
    client.emit('drawing', data);
  })
}


const handlePublishLine = ({ line}) =>{
  const lin = new Line({...line, timestamp:new Date()});
  lin.save().then(e=>{
      // log(e);
    }).catch(err=>{
      log(err)
    })

}

const subscribeForPublishLine = ({ client, drawingId}) =>{

  Line.watch().on("change", (data)=>{
    if(data.operationType=='insert'&&data.fullDocument.drawingId==drawingId){
      client.emit(`drawing:${drawingId}`, data.fullDocument);
    }
  })

}

const subscribeForAllPublishLine = ({ client, drawingId})=>{
  Line.find({drawingId}).then(list=>{
    list.forEach(e=>client.emit(`drawingAll:${drawingId}`, e))
  })
}



// Drawing.watch().on("change", (data)=>{

// })

// ServerConnections
mongoose.connect("mongodb+srv://gultion:pMDXt4uvHwgua5WJ@clientapi.zmhiz.mongodb.net/clientAPI?retryWrites=true&w=majority", {useNewUrlParser: true}).then(e=>{

    log("db is connected");
    // createDrawing({name:"MyDrawing"});
    io.on("connect", (client) => {
      client.on('subscribeForDrawings', () => subscribeForDrawing({client}));
      client.on('createDrawing', ({name, key}) => createDrawing({name,key,client}));
      client.on('subscribeForDrawingList', ()=>subscribeForDrawingList({client}))
      client.on('publishLine', (line)=>{handlePublishLine({line})});
      client.on('subscribeForPublishLine', (drawingId)=>subscribeForPublishLine({client, drawingId}));
      client.on('subscribeForAllPublishLine', (drawingId)=>subscribeForAllPublishLine({client, drawingId}));
      // client.on('getDrawingById', (id)=>getDrawingById({id, client}))
  })

}).catch(e=>log({e}))

// index route
app.get("/", (req,res)=>res.send("ok"))

http.listen(3001, ()=>log("Server is starting"))



User.watch().on("change", data=>{
    log(data)
});

