const http = require("http");
// const gc = require("idle-gc");      //用于node.js空闲时，运行垃圾回收机制；
// const helmet = require("helmet");   //用于保护node应用的安全；
const express = require("express");
const bodyParser = require("body-parser");
const mongoosePaginate = require("mongoose-paginate"); //分页
const compression = require("compression");   //用于中间件的压缩和静态文件的压缩，增加网页的访问速度
const session = require("express-session");
const path = require('path');
require("app-module-path").addPath(__dirname + "/"); //模块路径  模块引用路径
const MongoStore = require("connect-mongo")(session);  //session存储
const config = require("config/config");
const mongodb = require("config/mongodb");
const routes = require("routes/index");
var schedule = require('node-schedule');
const ueditor = require("ueditor");
const cors = require('cors');
const app = express();
const fs = require('fs');

//连接数据库
mongodb.connect();
mongoosePaginate.paginate.options = {
  limit: config.APP.LIMIT
}
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.set("port", config.APP.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let configJson = new String(fs.readFileSync(path.join(__dirname, 'public/nodejs/config.json')));
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
  var imgDir = '/upload'
  var ActionType = req.query.action;
  if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
    var file_url = imgDir;
    if (ActionType === 'uploadfile') {
      file_url = '/file/ueditor/';
    }
    if (ActionType === 'uploadvideo') {
      file_url = '/video/ueditor/';
    }
    res.ue_up(file_url);
    res.setHeader('Content-Type', 'text/html');
  }
  else if (ActionType === 'listimage') {
    res.ue_list(imgDir);
  }
  else {
    res.setHeader('Content-Type', 'application/json');
    let callback = req.query.callback;
    res.redirect('/ueditor/config?callback=' + callback)
  }
}));

app.use('/ueditor/config', function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  let callback = req.query.callback;
  res.write(callback + '(' + configJson + ')');
  res.end();
});

//用于中间件的压缩，必须顶置；
app.use(compression({
  threshold: 1024 * 10  
}));

app.use(session({  
  resave: false,
  saveUninitialized: true,
  secret: config.SESSION.secret,
  cookie: { domain: '192.168.0.150:4201',maxAge: 60 * 60 * 1000 },     
  store: new MongoStore({
    url: config.SESSION.db,
    collection: 'sessions'
  })
}));
routes(app);

http.createServer(app).listen(app.get("port"), () => {
  // gc.start();
  console.log(`NodePress Run! port as ${app.get('port')}`);
})