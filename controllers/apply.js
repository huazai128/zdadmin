const Apply = require("modules/apply");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const applyCtrl = { list: {}, item: {} };

// 保存
applyCtrl.list.POST = ({ body: apply, body: { mold, company, name, job, phone, email, qq, content } }, res) => {
  if (!mold || !company || !name || !job || !phone || !email || !qq || !content) {
    handleError({ res, message: "请填写完申请单!" });
    return false;
  }
  new Apply(apply).save()
    .then((result) => {
      handleSuccess({ res, message: "申请成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "申请失败", err });
    })
}

// 获取数据
applyCtrl.list.GET = (req, res) => {
  const { keywords, page, pre_page, state, start, end, mold } = req.query;
  const arr = [0, 1, -1, -2];
  let options = {
    sort: { id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: { path: 'user', select: "username name _id email" },
  }
  let query = {}
  if (arr.includes(Number(state))) {
    query.state = state;
  }
  if (mold) {
    query.mold = mold;
  }
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query = {
      "$or": [
        { 'company': ketwordReg },
        { 'content': ketwordReg },
        { 'name': ketwordReg },
        { 'email': ketwordReg },
        { 'job': ketwordReg },
      ]
    }
  }
  if (start, end) {
    const startDate = new Date(Number(start));
    const endDate = new Date(Number(end));
    if (!Object.is(startDate.toString(), "Invalid Date")) {
      query.create_at = {
        "$gte": startDate,
        "$lt": endDate
      };
    }
  }
  Apply.paginate(query, options)
    .then((applys) => {
      handleSuccess({
        res,
        message: "客户申请数据获取成功",
        result: {
          data: applys.docs,
          pagination: {
            total: applys.total,
            current_page: applys.page,
            total_page: applys.pages,
            pre_page: applys.limit
          }
        }
      })
    })
    .catch((err) => {
      handleError({ res, message: "客户申请数据获取失败", err })
    })
}

// 批量操作
applyCtrl.list.PATCH = ({ body: { ids, state } }, res) => {
  state = Object.is(state, undefined) ? null : Number(state);
  if (!ids || !ids.length || Object.is(state, null) || Object.is(state, NaN) || ![-1, -2, 0, 1].includes(state)) {
    handleError({ res, message: '缺少有效参数或参数无效' });
    return false;
  };
  Apply.update({ "_id": { $in: ids } }, { $set: { state: state } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, result, message: '操作成功' });
    })
    .catch((err) => {
      handleError({ res, err, message: '操作失败' });
    })
}

// 根据id获取详情
applyCtrl.item.GET = ({ params: { _id } }, res) => {
  const isFindById = Object.is(Number(_id), NaN);
  (isFindById ?
    Apply.findById({ _id: _id }) :
    Apply.findOne({ id: Number(_id) })
  )
    .then((result) => {
      handleSuccess({ res, message: "文章获取成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "获取文章失败", err })
    })
}

exports.list = (req, res) => { handleRequest({ req, res, controller: applyCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: applyCtrl.item }) };