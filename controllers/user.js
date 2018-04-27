const User = require("modules/user");
const config = require("config/config");
const crypto = require("crypto");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const jwt = require('jsonwebtoken');
const userCtrl = { list: {}, item: {}, other: {} };

const sha256 = (pwd) => {
  return crypto.createHmac("sha256", pwd).update(config.AUTH.defaultPassword).digest("hex");
};

// 注册用户
userCtrl.other.POST = ({ body }, res) => {
  if (!body.email || !body.password || !body.username) {
    handleError({ res, message: "Email或者密码不为空" });
    return false;
  }
  body.power = body.power.split("");
  User.findOne({ email: body.email }).then((result) => {
    if (result) {
      handleError({ res, message: "Email已存在" });
    } else {
      postLogin(body);
    }
  })
  body.password = sha256(body.password);
  postLogin = () => {
    new User(body).save({ new: true })
      .then((user) => {
        let query = {
          gravatar: user.gravatar,
          username: user.username,
          _id: user._id,
          email: user.email,
        }
        handleSuccess({ res, result: query, message: "注册成功" });
      })
      .catch((err) => {
        handleError({ res, message: "Email已存在", err });
      })
  }
}

// 登陆
userCtrl.list.POST = ({ body }, res) => {
  User.find({ email: body.email })
    .then(([user]) => {
      if (user && !user.status) {
        handleError({ res, message: "用户或密码错误" });
        return false;
      }
      if (Object.is(sha256(body.password), user.password)) {
        const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
        const token = jwt.sign({ // 
          data: config.AUTH.data,
          exp: exp,
        }, config.AUTH.jwtTokenSecret);
        let query = {
          gravatar: user.gravatar,
          username: user.username,
          _id: user._id,
          email: user.email,
          exp: exp,
          token: token,
          status: user.status
        }
        handleSuccess({ res, message: "登陆成功", result: query });
      } else {
        handleError({ res, message: "用户或密码错误" });
      }
    })
    .catch((err) => {
      let msg = '用户或密码错误';
      handleError({ res, message: msg, err });
    })
};

// 获取所有用户数据
userCtrl.list.GET = (req, res) => {
  let { keywords, status, page, pre_page } = req.query;
  let arr = [1, 0, -1]
  let options = {
    sort: { _id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: 'tags',
  }
  let query = {};
  if (arr.includes(Number(status))) {
    query.status = status;
  }
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [
      { 'username': ketwordReg },
      { 'email': ketwordReg },
    ]
  }
  User.paginate(query, options)
    .then((result) => {
      handleSuccess({
        res,
        message: "获取数据成功",
        result: {
          data: result.docs,
          pagination: {
            total: result.total,
            current_page: result.page,
            total_page: result.pages,
            pre_page: result.limit
          }
        }
      })
    })
    .catch((err) => {
      handleError({ res, message: "查询失败", error })
    })
}

// 编辑auth
userCtrl.item.PUT = ({ params: _id, body: auth }, res) => {
  let query = {};
  let str = '修改';
  if (auth.reset) {
    query.password = sha256("123456");
    str = '重置密码';
  }
  if (auth.power) {
    auth.power = auth.power.split("");
    query.password = sha256(auth.password);
  }
  User.findByIdAndUpdate(_id, { $set: Object.assign(auth, query) }, { new: true }).select("-password")
    .then((result) => {
      handleSuccess({ res, message: `${str}成功`, result });
    })
    .catch((err) => {
      handleError({ res, message: `${str}失败`, err });
    })
}


exports.list = (req, res) => { handleRequest({ req, res, controller: userCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: userCtrl.item }) };
exports.other = (req, res) => { handleRequest({ req, res, controller: userCtrl.other }) };
