const { handleRequest, handleError, handleSuccess } = require("utils/handle");// 用于处理请求方法和请求状态
const otherCtrls = { list: {}, item: {} };
const Other = require("modules/other");
const config = require("config/config");
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');

otherCtrls.list.GET = (req, res) => {
  let option = {
    size: 4,
    noise: 1,
    color: false,
    width: 100,
    height: 32,
    fontSize: 40,
    background: "#cc9966",
  }
  const captcha = svgCaptcha.create(option);
  const exp = Math.floor(Date.now() / 1000) + (60 * 5);
  const token = jwt.sign({
    data: config.AUTH.data,
    exp: exp,
  }, config.AUTH.jwtTokenSecret);
  let result = {
    exp: token,
    captcha: captcha.text,
  };
  // req.session.captcha = captcha.text; // session:必须是同一域名下
  new Other(result).save({new:true}).then((result) => {
    handleSuccess({ res, message: '', result: { captcha: captcha.data, exp: result.exp } });
  })
  .catch((err) => {
    handleError({ res, message: "获取验证码失败" });
  })
}

exports.list = (req, res) => { handleRequest({ req, res, controller: otherCtrls.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: otherCtrls.item }) };
