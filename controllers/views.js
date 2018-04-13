const Views = require("modules/views");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");// 用于处理请求方法和请求状态
const viewsCtrl = {};

viewsCtrl.GET = ({ query: { amount } }, res) => {
  Views.findOne({}).then((views) => {
    if(!!views){
      views.amount = Number(views.amount) + Number(amount);
      views.save({ new: true }).then((result) => {
        handleSuccess({ res, message: "获取成功", result });
      }).catch((err) => {
        handleError({ res, message: "dadadad", err })
      })
    }else{
      new Views({ amount:180000 }).save({ new:true }).then((result) => {
        handleSuccess({ res, message: "获取成功", result });
      }).catch((err) => {
        handleError({ res, message: "dadadad", err })
      })
    }
  }).catch((err) => {
    handleError({ res, message: "获取使用量失败", err })
  })
}

module.exports = (req, res) => { handleRequest({ req, res, controller: viewsCtrl }) }