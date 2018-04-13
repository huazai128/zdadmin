const Plan = require("modules/plan");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const planCtrl = { list: {}, item: {} };

planCtrl.list.POST = ({ body: plan, body: { company, scale, name, industry, phone, email } }, res) => {
  if (!company || !name || !phone || !email || !scale || !industry) {
    handleError({ res, message: "请填写完申请单!" });
    return false;
  }
  new Plan(plan).save()
    .then((result) => {
      handleSuccess({ res, message: "申请成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "申请失败", err });
    })
}
// 获取数据
planCtrl.list.GET = (req, res) => {
  const { keywords, page, pre_page, state, start, end } = req.query;
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
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query = {
      "$or": [
        { 'company': ketwordReg },
        { 'scale': ketwordReg },
        { 'name': ketwordReg },
        { 'industry': ketwordReg },
        { 'email': ketwordReg },
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
  Plan.paginate(query, options)
    .then((plans) => {
      handleSuccess({
        res,
        message: "数据获取成功",
        result: {
          data: plans.docs,
          pagination: {
            total: plans.total,
            current_page: plans.page,
            total_page: plans.pages,
            pre_page: plans.limit
          }
        }
      })
    })
    .catch((err) => {
      handleError({ res, message: "数据获取失败", err })
    })
}

// 批量操作
planCtrl.list.PATCH = ({ body: { ids, state } }, res) => {
  state = Object.is(state, undefined) ? null : Number(state);
  if (!ids || !ids.length || Object.is(state, null) || Object.is(state, NaN) || ![-1, -2, 0, 1].includes(state)) {
    handleError({ res, message: '缺少有效参数或参数无效' });
    return false;
  };
  Plan.update({ "_id": { $in: ids } }, { $set: { state: state } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, result, message: '操作成功' });
    })
    .catch((err) => {
      handleError({ res, err, message: '操作失败' });
    })
}

// 根据id获取详情
planCtrl.item.GET = ({ params: { _id } }, res) => {
  const isFindById = Object.is(Number(_id), NaN);  
  (isFindById ?
    Plan.findById({ _id: _id }) : 
    Plan.findOne({ id: Number(_id) })
  )
    .then((result) => {
      handleSuccess({ res, message: "文章获取成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "获取文章失败", err })
    })
}




exports.list = (req, res) => { handleRequest({ req, res, controller: planCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: planCtrl.item }) };