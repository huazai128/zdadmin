/**
 * 
 * 公告位控制器
 * 
 */
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
  // 查询参数
  let { keywords, state, pre_page, page, sort } = req.query;
  const arr = ['0', '1', '-1'];
  // 过滤条件
  let options = {
    sort: { sort: 1 }, // 根据sort 排序查询
    limit: Number(pre_page || 10), // 限制查询题哦数
    page: Number(page || 1), //当前页码
  }
  let query = {};

  // 判断keyword 
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [ 
      { 'title': ketwordReg },
    ]
  }
  // 按照state查询
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
            total: advs.total, // 文章总数
            current_page: advs.page, //  当前页面
            total_page: advs.pages, // 总分页
            pre_page: advs.limit //  限制查询条数
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
  const isFindById = Object.is(Number(_id), NaN);  // 判断_id还是id,_id为true，id为false;
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