const Auth = require("modules/auth");
const Other = require("modules/other");
const config = require("config/config");
const crypto = require("crypto");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const jwt = require('jsonwebtoken');
const authCtrl = { list: {}, item: {}, other: {}, forget: {} };

const sha256 = (pwd) => {
  return crypto.createHmac("sha256", pwd).update(config.AUTH.defaultPassword).digest("hex");
};

const isCodeExp = (exp) => {
  try {
    const decodedToken = jwt.verify(exp, config.AUTH.jwtTokenSecret);
    if (decodedToken.exp > Math.floor(Date.now() / 1000)) {
      return true;
    }
  } catch (error) {
  }
  return false;
}

// 注册用户
authCtrl.other.POST = (req, res) => {
  const { body, session } = req;
  if (!body.email || !body.password || !body.confirm || !body.email.trim() || !body.password.trim() || !body.confirm.trim()) {
    handleError({ res, message: "Email或者密码不为空" });
    return false;
  }
  if (!body.type) {
    body.type = 0;
  }
  if (body.type) {
    body.c_state = 0;
  }
  if (!Object.is(body.password, body.confirm)) {
    handleError({ res, message: "输入密码不一致" });
    return false;
  }
  body.password = sha256(body.password);
  const authOpen = () => {
    Auth.findOne({ email: body.email }).then((result) => {
      if (result && Object.is(result.type, body.type)) {
        handleError({ res, message: "Email已存在" });
      } else {
        postLogin(body);
      }
    })
    const postLogin = () => {
      new Auth(body).save({ new: true })
        .then((user) => {
          let query = {}
          if (!body.type) {
            const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
            const token = jwt.sign({
              data: config.AUTH.data,
              exp: exp,
            }, config.AUTH.jwtTokenSecret);
            query = {
              gravatar: user.gravatar,
              username: user.username,
              _id: user._id,
              email: user.email,
              exp: exp,
              token: token,
              status: user.status,
              type: user.type,
              time_name: user.time_name,
            }
          }
          handleSuccess({ res, result: query, message: "注册成功" });
        })
        .catch((err) => {
          handleError({ res, message: "Email已存在", err });
        })
    }
  }
  if (body.exp) {
    if (isCodeExp(body.exp)) {
      Other.findOne({ exp: body.exp }).then((other) => {
        if (other && Object.is(body.vcode.toUpperCase(), other.captcha.toUpperCase())) {
          authOpen();
        } else {
          handleError({ res, message: "验证码错误" });
        }
      })
        .catch((err) => {
          handleError({ res, message: "验证码错误", err });
        })
    } else {
      handleError({ res, message: "验证码已过期", err });
    }
  } else {
    authOpen();
  }
}

// 登陆
authCtrl.list.POST = ({ body }, res) => {
  Auth.find({ email: body.email })
    .then((data) => {
      let arrDAta = data.filter((item) => (Object.is(item.type, 1) && (Object.is(item.c_state, 1))));
      let user;
      if (!!arrDAta.length) {
        user = arrDAta[0];
      } else {
        user = data[0];
      }
      let arr = [1, 0, -1];
      const curDate = new Date().getTime();
      let time;
      if (user && arr.includes(user.status)) {
        if (Object.is(user.c_state, 0)) {
          handleError({ res, message: "账号正在申请当中..." });
          return false;
        }
        if (Object.is(sha256(body.password), user.password)) {
          const userInfo = () => {
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
              status: user.status,
              type: user.type,
              time_name: user.time_name
            }
            handleSuccess({ res, message: "登陆成功", result: query });
          }
          if (user.time) {
            time = new Date(user.time).getTime();
            if (curDate > time) {
              user.status = 1;
              user.time = null;
              user.time_name = "";
              user.save({ new: true }).then((user) => {
                userInfo()
              })
            } else {
              userInfo();
            }
          } else {
            userInfo();
          }
        } else {
          handleError({ res, message: "用户名不存在或密码错误" });
        }
      } else if (user) {
        handleError({ res, message: "用户已被禁封" });
      } else {
        handleError({ res, message: "用户不存在" });
      }
    })
    .catch((err) => {
      handleError({ res, message: '登陆失败', err });
    })
};

// 获取所有用户数据
authCtrl.list.GET = (req, res) => {
  let { keywords, status, type, page, pre_page, proh, p_state, c_state } = req.query;
  let arr = [2, 1, 0, -1, -2]
  let options = {
    sort: { _id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: 'tags',
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
  const getUsers = () => {
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
        handleError({ res, message: "查询失败", err })
      })
  }
  let _query = {
    status: { '$in': [0, -1] },
    time: { '$lte': new Date() }
  }
  Auth.update(_query, { $set: { status: 1, time: "", time_name: "" } }, { multi: true, new: true, upsert: false })
    .then((result) => {
      getUsers();
    })
    .catch((err) => {
      handleError({ res, message: "查询失败", err })
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
  const updateUser = () => {
    Auth.findByIdAndUpdate(_id, { $set: Object.assign(auth, query) }, { new: true }).select("-password")
      .then((result) => {
        handleSuccess({ res, message: `${str}成功`, result });
      })
      .catch((err) => {
        handleError({ res, message: `${str}失败`, err });
      })
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
    Auth.findById(_id).then((data) => {
      let psw = sha256(auth.old_password);
      if (Object.is(data.password, psw)) {
        updateUser();
      } else {
        handleError({ res, message: "输入密码错误" });
      }
    })
      .catch((err) => {
        handleError({ res, message: `${str}失败`, err });
      })
  } else {
    updateUser();
  }
}

// 忘记密码
authCtrl.forget.POST = ({ body: auth }, res) => {
  if (!Object.is(auth.confirm_password, auth.new_password)) {
    handleError({ res, message: '两次输入密码不一致' });
    return false;
  }
  let parmas = {
    name: auth.name,
    email: auth.email,
    card: auth.card,
  }
  Auth.find(parmas).then((data) => {
    let arrDAta = data.filter((item) => (Object.is(item.type, 1)));
    let user;
    if (!!arrDAta.length) {
      user = arrDAta[0];
    } else {
      user = data[0];
    }
    if (user) {
      let pass = sha256(auth.new_password);
      user.update({ $set: { password: pass } }, { new: true })
        .then((result) => {
          handleSuccess({ res, message: '重置密码成功', result });
        })
        .catch((err) => {
          handleError({ res, message: '重置密码失败' });
        })
    } else {
      handleError({ res, message: '当前用户不存在' });
    }
  })
}

exports.list = (req, res) => { handleRequest({ req, res, controller: authCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: authCtrl.item }) };
exports.other = (req, res) => { handleRequest({ req, res, controller: authCtrl.other }) };
exports.forget = (req, res) => { handleRequest({ req, res, controller: authCtrl.forget }) };

