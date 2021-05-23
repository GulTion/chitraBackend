
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

const {Drawing, User, Line} = require("./Models/index");
const bodyParser = require("body-parser");
const {log} = console;


app.use(bodyParser())
app.use(cors({origin:"*"}))

function createDrawing({name,key, client}) {
  log(key)
  const drawing = new Drawing({name,key, timestamp:new Date() });
    drawing.save().then(e=>{
      log(e);
    }).catch(err=>{
      log(err)
    })
}

function subscribeForDrawingList({client,key}) {
  log("drawing is getting")
  Drawing.find({key}).sort({"timestamp":-1}).exec((err, data)=>{
    log(key)
    client.emit("drawingList", data)

})

}

// function subscribeForDrawing({client,key}){
//   Drawing.watch().on("change", (data)=>{
//     log(data)
   
//       client.emit(`drawing:${key}`, data);
//   })
// }


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
let monS = "mongodb+srv://gultion:pMDXt4uvHwgua5WJ@clientapi.zmhiz.mongodb.net/clientAPI?retryWrites=true&w=majority"
let monL = "mongodb://localhost:27017/chitra"
mongoose.connect(monS, {useNewUrlParser: true}).then(e=>{

    log("db is connected");
    // createDrawing({name:"MyDrawing"});
    io.on("connect", (client) => {
      // client.on('subscribeForDrawings', ({key}) => subscribeForDrawing({client,key}));
      client.on('createDrawing', ({name, key}) => createDrawing({name,key,client}));
      client.on('subscribeForDrawingList', ({key})=>subscribeForDrawingList({key,client}))
      client.on('publishLine', (line)=>{handlePublishLine({line})});
      client.on('subscribeForPublishLine', (drawingId)=>subscribeForPublishLine({client, drawingId}));
      client.on('subscribeForAllPublishLine', (drawingId)=>subscribeForAllPublishLine({client, drawingId}));
      // client.on('getDrawingById', (id)=>getDrawingById({id, client}))
  })

}).catch(e=>log({e}))

// index route
app.get("/", (req,res)=>res.send("ok"));

app.post("/auth/signup", (req, res)=>{
  const {email, password} = req.body;
  User.findOne({email:email.toLowerCase()}).then(e=>{
    if(e==null){
      User.create({email:email.toLowerCase(), password}).then(e=>{
        res.send({success:true, message:"User is Created !", id:e._id})
      }).catch(err=>{
        res.send({success:false, message:"Something Problem at Server to adding in DataBase"})
      })
    }else{
        res.send({success:false, message:"User is Already Exist! Please signin"})
    }
  })
 
})


app.post("/auth/signin", (req, res)=>{
  const {email, password} = req.body;
  User.findOne({email:email.toLowerCase(), password}).then(e=>{
    if(e==null){
     res.send({success:false, message:"Email or Password is Wrong!!"})
    }else{
        res.send({success:true, message:"User is Founded", id:e._id})
    }
  })
 
})
app.post("/auth/check", (req,res)=>{
  let {key} = req.body;

  User.findById(key).then(e=>{
    if(e==null){
      res.send({success:false, message:"Auth not Success"})
    }else{
      res.send({success:true, message:"Auth Success"})
    }
  }).catch(err=>{
    res.send({success:false, message:"Auth not Success"})
  })
})

app.post("/drawing/get", (req, res)=>{
  const {id} = req.body;

  Drawing.find({'_id':id}, (err,e)=>{

    if(e.length==0){
      res.send({success:false, message:"Can't FInd the Drawing"})
    }else{
      const k = e[0]
      log("fond")
      res.send({success:true, name:k.name})
    }
  }
)

})


http.listen(3001, ()=>log("Server is starting"))



User.watch().on("change", data=>{
    log(data)
});

