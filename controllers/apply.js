const Apply = require("modules/apply");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const applyCtrl = { list: {}, item: {}, excel: {} };
const nodeExcel = require('excel-export');
const disableLayout = { layout: false };
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
  let { ids, style = 0 } = req.query;
  // if (!ids.length) {
  //   handleError({ res, message: "缺少参数", err })
  //   return false;
  // }
  const getApplys = () => {
    let query = {};
    // if (ids.length) {
    //   query._id = { "$in": ids.split(',') }
    // }
    // if (style !== '') {
    //   query.style = style;
    // }
    Apply.find(query)
      .then((result) => {
        let arr = [];
        let conf = {}
        conf.name = style === 0 ? "测试申请数据" : "众测平台数据";
        conf.cols = [{
          caption: 'string',
          type: 'string',
          beforeCellWrite: function (row, cellData) {
            return cellData.toUpperCase();
          },
          width: 28.7109375
        }, {
          caption: 'date',
          type: 'date',
          beforeCellWrite: function () {
            var originDate = new Date(Date.UTC(1899, 11, 30));
            return function (row, cellData, eOpt) {
              if (eOpt.rowNum % 2) {
                eOpt.styleIndex = 1;
              }
              else {
                eOpt.styleIndex = 2;
              }
              if (cellData === null) {
                eOpt.cellType = 'string';
                return 'N/A';
              } else
                return (cellData - originDate) / (24 * 60 * 60 * 1000);
            }
          }()
        }, {
          caption: 'bool',
          type: 'bool'
        }, {
          caption: 'number',
          type: 'number'
        }];
        conf.rows = [
          ['pi', new Date(Date.UTC(2013, 4, 1)), true, 3.14],
          ["e", new Date(2012, 4, 1), false, 2.7182],
          ["M&M<>'", new Date(Date.UTC(2013, 6, 9)), false, 1.61803],
          ["null date", null, true, 1.414]
        ];
        var data = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
        res.end(data, 'binary');

      })
  }
  getApplys();
}

exports.list = (req, res) => { handleRequest({ req, res, controller: applyCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: applyCtrl.item }) };
exports.excel = (req, res) => { handleRequest({ req, res, controller: applyCtrl.excel }) };