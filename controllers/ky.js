const Ky = require("modules/ky");
const Forum = require("modules/forum");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");// 用于处理请求方法和请求状态
const config = require("config/config");
const kyCtrls = { list: {}, item: {} };

kyCtrls.list.POST = ({ body: ky }, res) => {
  if (ky.name == undefined && ky.name == null) {
    handleError({ res, message: "请填写完整的表单" });
    return falses;
  }
  const kySave = () => {
    new Ky(ky).save()
      .then((result = ky) => {
        handleSuccess({ res, result, message: "保存成功" });
      })
      .catch((err) => {
        handleError({ res, err, message: "保存失败" })
      })
  }
  Ky.find({ name: ky.name }).then(({ length }) => {
    length ? handleError({ res, message: "名称已存在" }) : kySave();
  })
    .catch((err) => {
      handleError({ res, err, message: "标签发布失败" })
    })
}

// 获取所有列表数据
kyCtrls.list.GET = (req, res) => {
  let { page = 1, pre_page = 10, state = "all", keywords } = req.query;
  const options = {
    sort: { _id: -1 },
    page: Number(page),
    limit: Number(pre_page)
  }
  let query = {};
  if (!Object.is(state, "all")) {
    query.state = Number(state);
  }
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [
      { 'name': ketwordReg },
    ]
  }
  Ky.paginate(query, options)
    .then(kys => {
      handleSuccess({
        res,
        message: "获取标签列表",
        result: {
          pagination: {
            total: kys.total,
            current_page: options.page,
            total_page: kys.pages,
            pre_page: options.limit
          },
          data: kys.docs
        }
      })
    })
    .catch(err => {
      handleError({ res, err, messgage: "获取列表失败" });
    })
}

// 批量修改
kyCtrls.list.PATCH = ({ body: { ids, active } }, res) => {
  if (!ids.length) {
    handleError({ res, message: "请选择批量操作的数据" });
    return false;
  }
  Ky.update({ "_id": { '$in': ids } }, { $set: { state: active } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, message: "设置成功", result })
    })
    .catch((err) => {
      handleError({ res, message: "设置失败", err });
    })
}

// 获取当前id下的标签
kyCtrls.item.GET = ({ params: _id }, res) => {
  Ky.findById(_id).select("name  _id").then((result) => {
    handleSuccess({ res, message: "查询成功", result });
  })
    .catch((err) => {
      handleError({ res, message: "查询失败", err });
    })
}

// 根据ID 修改
kyCtrls.item.PUT = ({ params: { _id }, body: ky, body: { name } }, res) => {
  if (!name) {
    handleError({ res, message: "slug不合法" });
    return false;
  };
  Ky.find({ name: name }).then(([_ky]) => {
    const hasExisted = (_ky && (_ky._id == _ky._id));
    hasExisted ? handleError({ res, message: "关键字名称已存在" }) : putKy();
  }).catch((err) => {
    handleError({ res, message: "修改前查询失败" }, err);
  });
  const putKy = () => {
    Ky.findByIdAndUpdate(_id, ky, { new: true })
      .then(result => {
        handleSuccess({ res, result, message: "修改成功" });
      })
      .catch(err => {
        handleError({ res, message: "修改失败", err });
      })
  }
}

exports.list = (req, res) => { handleRequest({ req, res, controller: kyCtrls.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: kyCtrls.item }) };
