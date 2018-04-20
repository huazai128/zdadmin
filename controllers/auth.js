const Auth = require("modules/auth");
const config = require("config/config");
const crypto = require("crypto");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const jwt = require('jsonwebtoken');
const authCtrl = { list: {}, item: {}, other: {} };

const sha256 = (pwd) => {
  return crypto.createHmac("sha256", pwd).update(config.AUTH.defaultPassword).digest("hex");
};

// 注册用户
authCtrl.other.POST = ({ body }, res) => {
  if (!body.email || !body.password || !body.confirm) {
    handleError({ res, message: "Email或者密码不为空" });
    return false;
  }
  if (!body.type) {
    body.type = 0;
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
        const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
        const token = jwt.sign({
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
        handleSuccess({ res, result: query, message: "注册成功" });
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
      //   handleError({ res, message: "没有权限登录", err });
      //   return flase;
      // }
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
        handleError({ res, message: "用户名不存在或密码错误" });
      }
    })
    .catch((err) => {
      let msg = body.type ? '用户不存在' : '登陆失败';
      handleError({ res, message: msg, err });
    })
};

// 获取所有用户数据
authCtrl.list.GET = (req, res) => {
  let { keywords, status, type, page, pre_page, proh, p_state } = req.query;
  let arr = [2, 1, 0, -1, -2]
  let options = {
    sort: { _id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: 'tags', // 关联查询
    select: '-password'
  }
  let query = {};
  if (arr.includes(Number(status))) {
    query.status = status;
  }
  if (arr.includes(Number(type))) {
    query.type = type;
  }
  if (proh) {
    query.status = { '$in': [0, -1, -2] };
  }
  if (p_state) {
    query.status = { '$in': [1, 0, -1] };
  }
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query['$or'] = [
      { 'username': ketwordReg },
      { 'email': ketwordReg },
      { 'name': ketwordReg }
    ]
  }
  Auth.paginate(query, options)
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

// 获取个人信息
authCtrl.item.GET = ({ params: { _id } }, res) => {
  Auth.findById({ _id: _id }).select("-password -time -time_name")
    .then((result) => {
      handleSuccess({ res, message: "获取用户信息成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "获取用户信息失败", err });
    });
};

// 编辑auth
authCtrl.item.PUT = ({ params: _id, body: auth }, res) => {
  let query = {};
  let str = '';
  if (auth.reset) {
    query.password = sha256("123456");
    str = '重置密码';
  }
  if (auth.time) {
    auth.time = new Date().getTime() + auth.time;
    str = '禁言设置'
  }
  if (auth.psw) {
    if (Object.is(auth.old_password, auth.new_password)) {
      handleError({ res, message: `新旧密码一致` });
      return false;
    }
    if (!Object.is(auth.confirm_password, auth.new_password)) {
      handleError({ res, message: '两次输入密码不一致' });
      return false;
    }
    query.password = sha256(auth.new_password);
    str = '修改密码';
  }
  
  const updateUser = () => {
    Auth.findByIdAndUpdate(_id, { $set: Object.assign(auth, query) }, { new: true }).select("-password")
      .then((result) => {
        handleSuccess({ res, message: `${str}成功`, result });
      })
      .catch((err) => {
        handleError({ res, message: `${str}失败`, err });
      })
  }
  updateUser();
}


exports.list = (req, res) => { handleRequest({ req, res, controller: authCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: authCtrl.item }) };
exports.other = (req, res) => { handleRequest({ req, res, controller: authCtrl.other }) };
