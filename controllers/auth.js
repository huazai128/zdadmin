const Auth = require("modules/auth");
const config = require("config/config");
const crypto = require("crypto");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const jwt = require('jsonwebtoken');
const authCtrl = { list: {}, item: {} };

const sha256 = (pwd) => {
    return crypto.createHmac("sha256", pwd).update(config.AUTH.defaultPassword).digest("hex");
};
// 注册用户
authCtrl.item.POST = ({ body }, res) => {
    if (!body.email || !body.password || !body.confirm) {
        handleError({ res, message: "Email或者密码不为空" });
        return false;
    }
    if (!body.type) {
        body.type = 0;
    }
    if (!body.status) {
        body.status = 0;
    }
    if (!Object.is(body.password, body.confirm)) {
        handleError({ res, message: "输入密码不一致" });
        return false;
    }
    Auth.findOne({ email: body.email }).then((result) => {
        if (result) {
            handleError({ res, message: "Email已存在" });
        } else {
            postLogin(body);
        }
    })
    body.password = sha256(body.password);
    postLogin = () => {
        new Auth(body).save({ new: true })
            .then((user) => {
                let result = { email: user.email, username: user.username }
                handleSuccess({ res, result, message: "注册成功" });
            })
            .catch((err) => {
                handleError({ res, message: "Email已存在", err });
            })
    }
}
// 登陆
authCtrl.list.POST = ({ body }, res) => {
    Auth.find({ email: body.email })
        .then(([user]) => {
            // if (body.type && !Object.is(user.type, body.type)) {
            //     return flase;
            // }
            if (Object.is(sha256(body.password), user.password)) {
                const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
                const token = jwt.sign({ // 
                    data: config.AUTH.data,
                    exp: exp, 
                }, config.AUTH.jwtTokenSecret);
                let query = {
                    gravatar:user.gravatar,
                    username:user.username,
                    _id:user._id,
                    email:user.email,
                    exp:exp,
                    token:token
                }
                handleSuccess({ res, message: "登陆成功", result: query });
            } else {
                handleError({ res, message: "" });
            }
        })
        .catch((err) => {
            let msg = body.type ? '用户不存在' : '登陆失败';
            handleError({ res, message: msg, err });
        })
};

// 获取个人信息
authCtrl.list.GET = (req, res) => {
    Auth.find({}, "-_id name slogan gravatar")
        .then(([result = {}]) => {
            handleSuccess({ res, message: "获取用户信息成功", result });
        })
        .catch((err) => {
            handleError({ res, message: "获取用户信息失败" }, err);
        });
};
// 编辑auth
authCtrl.list.PUT = ({ body: auth }, res) => {

}

exports.list = (req, res) => { handleRequest({ req, res, controller: authCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: authCtrl.item }) }
