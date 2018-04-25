const authIsVerified = require("utils/auth");
const Adv = require("modules/adv");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const advCtrl = { list: {}, item: {} };

// 新增广告位
advCtrl.list.POST = ({ body: adv }, res) => {
  if (!adv.title || !adv.url || !adv.murl) {
    handleError({ res, message: "文本框未填写完整" });
    return false;
  }
  new Adv(adv).save()
    .then((result = adv) => {
      handleSuccess({ res, result, message: "发表成功" });
    })
    .catch((err) => {
      handleError({ res, err, message: "发表失败" });
    })
}

// 获取所有的广告位
advCtrl.list.GET = (req, res) => {
  let { keywords, state, pre_page, page, sort } = req.query;
  const arr = ['0', '1', '-1'];
  let options = {
    sort: { sort: 1 }, 
    limit: Number(pre_page || 10), 
    page: Number(page || 1), 
  }
  let query = {};
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [ 
      { 'title': ketwordReg },
    ]
  }
  if (arr.includes(state)) {
    query.state = state;
  }
  Adv.paginate(query, options)
    .then((advs) => {
      handleSuccess({
        res,
        message: "获取数据成功",
        result: {
          data: advs.docs,
          pagination: {
            total: advs.total, 
            current_page: advs.page,
            total_page: advs.pages, 
            pre_page: advs.limit
          }
        }
      })
    })
    .catch((err) => {
      handleError({ res, message: "获取数据失败" })
    })
}

// 根据广告位id获取数据
advCtrl.item.GET = ({ params: { _id } }, res) => {
  const isFindById = Object.is(Number(_id), NaN);  
  (isFindById ?
    Adv.findById({ _id: _id }).select('-meta -create_at -update_at') :
    Adv.findOne({ id: _id, state: 1 }).exec())
    .then((result) => {
      handleSuccess({ res, message: "获取数据成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "获取广告位失败", err })
    })
}

// 根据ID需改广告位信息
advCtrl.item.PUT = ({ params: _id, body: adv }, res) => {
  if (!adv.title && !adv.content) {
    handleError({ res, message: "缺少必要参数" });
    return false;
  }
  Adv.findByIdAndUpdate(_id, adv, { new: true })
    .then((result = adv) => {
      handleSuccess({ res, message: "修改成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "修改失败" }, err);
    })
}

// 批量删除
advCtrl.list.DELETE = ({ query: { body: advs } }, res) => {
  if (!advs && !advs.length) {
    handleError({ res, message: "缺少删除数据" });
    return false;
  }
  Adv.remove({ "_id": { $in: advs } })
    .then((result) => {
      handleSuccess({ res, message: "删除成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "删除失败", err });
    })
}


exports.list = (req, res) => { handleRequest({ req, res, controller: advCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: advCtrl.item }) };