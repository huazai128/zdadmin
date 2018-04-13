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
const ueditor = require("ueditor");
const cors = require('cors'); // 
const app = express();
const fs = require('fs');

//连接数据库
mongodb.connect();
//翻页全局配置
mongoosePaginate.paginate.options = {
    limit: config.APP.LIMIT  // 设置限制查询数据
}
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.set("port", config.APP.PORT);  //设置端口
app.use(bodyParser.json()); //限制传输数据大小
app.use(bodyParser.urlencoded({ extended: true })); // 数据格式限制于数组和对象
let configJson = new String(fs.readFileSync(path.join(__dirname, 'public/nodejs/config.json')));

app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
    var imgDir = '/upload' //默认上传地址为图片
    var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir;//默认上传地址为图片
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = '/file/ueditor/'; //附件保存地址
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/video/ueditor/'; //视频保存地址
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //客户端发起图片列表请求
    else if (ActionType === 'listimage') {
        res.ue_list(imgDir); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
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
    threshold: 1024 * 10  //限制大小为10240
}));

app.use(session({  //session缓存 用于存储图片
    resave: false,
    saveUninitialized: true,
    secret: config.SESSION.secret,
    cookie: { maxAge: 5 * 60 * 1000 },      //设置过期时间3分钟
    store: new MongoStore({
        url: config.SESSION.db,
        collection: 'sessions'
    })
}));

routes(app);

http.createServer(app).listen(app.get("port"), () => {
    // gc.start();//开启垃圾回收机制
    console.log(`NodePress Run! port as ${app.get('port')}`);
})