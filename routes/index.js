const config = require("config/config");
const controllers = require("controllers/index");
const authIsVerified = require("utils/auth");
const fs = require('fs');

const routes = (app) => {
    //拦截器
    app.all("*", (req, res, next) => {
        // 跨域解决
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Headers', 'Authorization, Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With');
        res.header('Access-Control-Allow-Methods', 'PUT,PATCH,POST,GET,DELETE,OPTIONS'); // 请求方法
        res.header('Access-Control-Max-Age', '1728000');
        res.header('Content-Type', 'application/json;charset=utf-8');
        res.header('X-Powered-By', 'Nodepress 1.0.0');

        if (req.method == "OPTIONS") { //判断请求方法是否为OPTIONS
            res.sendStatus(200);
            return false;
        }
        if (Object.is(process.env.NODE_ENV, "production")) { // Object.is(value1,value2):判断两个值是否相等；
            const { origin, referer } = req.headers; // 使用解构赋值
            const originVerified = (!origin || origin.includes("localhost") && (!referer || referer.includes("localhost")));
            if (!originVerified) {
                res.status(403).jsonp({ code: 0, message: '来者何人！' })
                return false;
            }
        }
        // 排除auth的post请求 && 评论的post请求 && like请求
        const isLike = Object.is(req.url, '/apply') && Object.is(req.method, 'POST');
        const isPostAuth = Object.is(req.url, '/auth') && Object.is(req.method, 'POST');
        const isForgetAuth = Object.is(req.url, '/forget') && Object.is(req.method, 'POST');
        const isPostAccount = Object.is(req.url, '/account') && Object.is(req.method, 'POST');
        const isPostUser = Object.is(req.url, '/user') && Object.is(req.method, 'POST');
        const isPostComment = Object.is(req.url, '/comment') && Object.is(req.method, 'POST');
        if (isLike || isPostAuth || isPostComment || isPostUser || isPostAccount || isForgetAuth) {
            next();
            return false;
        };
        // 验证不是GET请求和登录验证就返回
        if (!authIsVerified(req) && !Object.is(req.method, "GET")) {
            res.status(401).jsonp({ code: 0, message: "长的太丑了，不见！！！" });
            return false;
        }
        next();
    });
    
    // Api
    app.get("/", (req, res) => {
        res.jsonp(config.INFO);
    });

    // 用户权限管理
    app.all("/auth", controllers.auth.list);
    app.all("/auth/:_id", controllers.auth.item);
    app.all("/user", controllers.auth.other);
    app.all("/forget", controllers.auth.forget);

    // 图片上传
    app.all('/image', controllers.image.list);
    app.all('/image/:_id', controllers.image.item);

    // 广告位管理
    app.all("/adv", controllers.adv.list);
    app.all("/adv/:_id", controllers.adv.item);

    // 新闻编辑
    app.all('/news', controllers.news.list);
    app.all("/news/:_id", controllers.news.item);

    // 使用量
    app.all("/views", controllers.views);

    // 集市管理
    app.all("/forum", controllers.forum.list);
    app.all("/forum/:_id", controllers.forum.item);

    // 标签管理
    app.all("/tag", controllers.tag.list);
    app.all("/tag/:_id", controllers.tag.item);

    // 社区管理
    app.all("/community", controllers.community.list);
    app.all("/community/:_id", controllers.community.item);
    app.all("/replies",controllers.community.other);
    app.all("/count",controllers.community.count);

    // 关键字管理
    app.all("/ky", controllers.ky.list);
    app.all("/ky/:_id", controllers.ky.item);

    // 评论
    app.all("/comment", controllers.comment.list);
    app.all("/comment/:_id", controllers.comment.item);

    // 申请管理
    app.all("/apply", controllers.apply.list);
    app.all("/apply/:_id", controllers.apply.item);
    app.all("/excel", controllers.apply.excel);

    // 解决方案
    app.all("/plan", controllers.plan.list);
    app.all("/plan/:_id", controllers.plan.item);

    // 后台账号登录管理
    app.all("/account", controllers.user.list);
    app.all("/account/:_id", controllers.user.item);
    app.all("/account_post", controllers.user.other);

    // 验证码
    app.all("/code",controllers.other.list);

    app.all("*", (req, res) => {
        res.status(404).jsonp({
            code: 0,
            message: "无效的请求"
        })
    })
}

module.exports = routes;