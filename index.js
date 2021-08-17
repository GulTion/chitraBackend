
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

const {Drawing, User, Line,Chitr} = require("./Models/index");
const bodyParser = require("body-parser");
const {log} = console;


app.use(bodyParser())
app.use(cors({origin:"*"}))

function createDrawing({name,key,user, client}) {
  log(key)
  const drawing = new Drawing({name,key,user, timestamp:new Date() });
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


const subscribeForFabric = ({client, data})=>{
  log(data)
  client.broadcast.emit(`giveMeCanvas:${data.drawingId}`, data.drawingId);
  Chitr.findOne(data).then(doc=>{
    if(doc){
      client.emit(`hereMyCanvas:${data.drawingId}`, {json:doc.json, from:"server"})
    }
    log({doc})
  })

}


const pushChange = ({client, data})=>{
  
  client.broadcast.emit(`pullChange:${data.drawingId}`, data.data)
}
const takeMyCanvas =({client, data})=>{
  client.broadcast.emit(`hereMyCanvas:${data.id}`, {json:data.canvas, from:"socket"})
}

const saveChitr = (data)=>{

  Drawing.findOne({_id:data.drawingId}).then(doc=>{

    if(doc.user===data.key){
      Chitr.findOneAndUpdate({drawingId:data.drawingId}, data).then(ch=>{
        if(ch==null){
          let chitr= new Chitr(data);
          chitr.save()
        }
      })
       

    }
  }).catch(err=>{
    log(err)
  })
}

// ServerConnections
let monS = "mongodb+srv://gultion:XgJeq87rgq7zrCU4@gultion.6cvhl.mongodb.net/chitr?retryWrites=true&w=majority"
let monL = "mongodb://localhost:27017/chitra"
mongoose.connect(monS, {useNewUrlParser: true}).then(e=>{

    log("db is connected");
    // createDrawing({name:"MyDrawing"});
    io.on("connect", (client) => {
      // client.on('subscribeForDrawings', ({key}) => subscribeForDrawing({client,key}));
      client.on('createDrawing', ({name, key,user}) => createDrawing({name,user,key,client}));
      client.on('subscribeForDrawingList', ({key})=>subscribeForDrawingList({key,client}))
      client.on('publishLine', (line)=>{handlePublishLine({line})});
      client.on('subscribeForPublishLine', (drawingId)=>subscribeForPublishLine({client, drawingId}));
      client.on('subscribeForAllPublishLine', (drawingId)=>subscribeForAllPublishLine({client, drawingId}));
      // client.on('getDrawingById', (id)=>getDrawingById({id, client}))
      client.on("pushChange", (data)=>pushChange({client, data}))
      client.on("subscribeForFabric", (data)=>subscribeForFabric({client, data}))
      client.on("takeMyCanvas", (data)=>takeMyCanvas({client, data}))
      client.on("saveChitr", (data)=>saveChitr(data))
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

  Drawing.findOne({'_id':id}, (err,e)=>{
    if(e===undefined) {
      res.send({success:false, message:"Can't FInd the Drawing"})

    }else{

    
    if(e===null){
      res.send({success:false, message:"Can't FInd the Drawing"})
    }else{
      log({e})
    
      log("fond")
      res.send({success:true, name:e.name})
    }}
  }
)

})
app.post("/drawing/all", (req, res)=>{
  const {id} = req.body;
  log(id)
  Drawing.find({'user':id}, (err,e)=>{
log(e)
    res.send({success:true, list:e})
  }
)

})

app.post("/drawing/delete", (req, res)=>{
  const {id, key} = req.body;
  Drawing.deleteOne({_id:id}).then(e=>{
    log(id);
    Line.deleteMany({drawingId:id}).then(_e=>{
      log(`trying to delelte`)
      res.send({})
    })
    // res.send(e)
  })
  // res.send(e)
})


http.listen(3001, ()=>log("Server is starting"))



User.watch().on("change", data=>{
    log(data)
});

