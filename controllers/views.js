const Views = require("modules/views");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
var schedule = require('node-schedule');
const viewsCtrl = {};

viewsCtrl.GET = ({ query: { amount } }, res) => {
  Views.findOne({}).then((result) => {
    handleSuccess({ res, message: "获取成功", result });
  }).catch((err) => {
    handleError({ res, message: "获取使用量失败", err })
  })
}

const scheduleAmountRule = () => {
  var rule = new schedule.RecurrenceRule();
  let arr = Array.from({ length: 24 }, (item, index) => index);
  rule.hour = arr;
  schedule.scheduleJob(rule, function () {
    Views.findOne({}).then((views) => {
      views.amount = Number(views.amount) + Number((Math.random() * 5 + 1).toFixed(0));
      views.vip = Number(views.vip) + 1;
      views.save({ new: true })
        .then((result) => {
        })
        .catch((err) => {
        })
    })
  });
}

const scheduleTestRule = () => {
  var rule = new schedule.RecurrenceRule();
  rule.hour = [0, 7, 14, 21];
  schedule.scheduleJob(rule, function () {
    Views.findOne({}).then((views) => {
      test = views.test || 110;
      views.test = Number(test) + 1;
      views.save({ new: true })
        .then((result) => {
        })
        .catch((err) => {
        })
    })
  });
}
scheduleTestRule();
scheduleAmountRule();

module.exports = (req, res) => { handleRequest({ req, res, controller: viewsCtrl }) }