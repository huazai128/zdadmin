const Apply = require("modules/apply");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const applyCtrl = { list: {}, item: {}, excel: {} };
const nodeExcel = require('excel-export');
const moment = require("moment");

// 保存
applyCtrl.list.POST = ({ body: apply, body: { mold, company, name, job, phone, email, qq, content } }, res) => {
  if (mold === '' || !company || !name || !job || !phone || !email || !qq || !content) {
    handleError({ res, message: "请填写完表单!" });
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
  const { keywords, page, pre_page, state, start, end, mold, style = 0, user, p_user } = req.query;
  const arr = [0, 1, -1, -2];
  let options = {
    sort: { id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: [
      { path: 'user', select: "username name _id email" },
      { path: "p_user", select: "username name _id email company job record iphone" }
    ],
  }
  let query = {}
  if (arr.includes(Number(state))) {
    query.state = state;
  }
  if (mold) {
    query.mold = mold;
  }
  if (user) {
    query.user = user;
  }
  if (p_user) {
    query.p_user = p_user;
  }
  if (keywords) {
    console.log(keywords)
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [
      { 'company': ketwordReg },
      { 'content': ketwordReg },
      { 'name': ketwordReg },
      { 'email': ketwordReg },
      { 'job': ketwordReg },
    ]
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
  query.style = style;
  Apply.paginate(query, options)
    .then((applys) => {
      handleSuccess({
        res,
        message: "数据获取成功",
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
      handleError({ res, message: "数据获取失败", err })
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

// 修改
applyCtrl.item.PUT = ({ params: _id, body: apply, }, res) => {
  let { mold, company, name, job, phone, email, qq, content } = apply;
  let query = {};
  if (name) {
    if (mold === '' || !company || !name || !job || !phone || !email || !qq || !content) {
      handleError({ res, message: "请填写完表单!" });
      return false;
    }
    query = apply;
  } else {
    query = { $set: apply };
  }
  Apply.findByIdAndUpdate(_id, query, { new: true })
    .then((result) => {
      handleSuccess({ res, message: "文章修改成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "文章修改失败" }, err);
    })
}


applyCtrl.excel.GET = (req, res) => {
  let { ids, style } = req.query;
  if (!ids.length) {
    handleError({ res, message: "缺少参数", err })
    return false;
  }
  let query = {};
  if (ids.length) {
    query._id = { "$in": ids.split(',') }
  }
  if (style !== '') {
    query.style = style;
  }
  Apply.find(query).select('mold company name job phone email qq content create_at').sort({ _id: -1 })
    .then((result) => {
      let arr = []
      result.forEach((item) => {
        let obj = {
          mold: !item.mold ? '功能测试' : '兼容测试',
          content: item.content,
          company: item.company,
          name: item.name,
          job: item.job,
          phone: item.phone,
          email: item.email,
          qq: item.qq,
          create_at:moment(item.create_at).format("YYYY-MM-DD HH:mm:ss")
        };
        arr.push(Object.values(obj));
      })
      var conf = {};
      conf.name = "mysheet";
      conf.cols = [
        {
          caption: '测试类型',
          type: 'string',
          width: 40
        },
        {
          caption: '咨询内容',
          type: 'string',
          width: 160
        },
        {
          caption: '公司名称',
          type: 'string',
          width: 60
        },
        {
          caption: '联系人',
          type: 'string',
          width: 40
        },
        {
          caption: '职位',
          type: 'string',
          width: 120
        },
        {
          caption: '手机号',
          type: 'string',
          width: 80
        },
        {
          caption: '邮箱',
          type: 'string',
          width: 60
        },
        {
          caption: 'QQ',
          type: 'string',
          width: 50
        },
        {
          caption: '申请时间',
          type: 'string',
          width: 50
        },
      ];
      conf.rows = arr;
      var result = nodeExcel.execute(conf);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
      res.end(result, 'binary');
    })
}

exports.list = (req, res) => { handleRequest({ req, res, controller: applyCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: applyCtrl.item }) };
exports.excel = (req, res) => { handleRequest({ req, res, controller: applyCtrl.excel }) };