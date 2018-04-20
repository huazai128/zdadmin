const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const Community = require("modules/community");
const Ky = require("modules/ky");
const comCtrl = {
  list: {},
  item: {}
}

// 保存
comCtrl.list.POST = ({ body: community }, res) => {
  if (!community.title || !community.content) {
    handleError({ res, message: "文本框未填写完整" });
    return false;
  }
  if (!community.userId) {
    handleError({ res, message: "请先登录!" });
    return false;
  }
  new Community(community).save()
    .then((result) => {
      handleSuccess({ res, result, message: "发表成功" });
    })
    .catch(() => {
      handleError({ res, err, message: "发表失败" });
    })
}

// 获取所有数据
comCtrl.list.GET = (req, res) => {
  const { keywords, page, pre_page, state, choice, recommend, sort, user_id } = req.query;
  const arr = [0, 1, -1];
  let sortQuery = {};
  if (sort) {
    (sort === "1") && (sortQuery = { news_at: -1 });
    (sort === "2") && (sortQuery = { _id: -1 });
  } else {
    sortQuery = { choice: -1, recommend: -1, state: -1, _id: -1 }
  }
  let options = {
    sort: sortQuery,
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: 'userId', // 关联查询
  }
  let query = {};
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [
      { 'title': ketwordReg },
      { 'content': ketwordReg }
    ]
  }
  if (arr.includes(Number(state))) {
    query.state = state;
  }
  if (choice) {
    query.choice = choice;
  }
  if (recommend) {
    query.recommend = recommend;
  }
  if (user_id) {
    query.userId = user_id;
  }
  Community.paginate(query, options).then((result) => {
    handleSuccess({
      res,
      message: "获取数据成功",
      result: {
        data: result.docs,
        pagination: {
          total: result.total, // 文章总数
          current_page: result.page, //  当前页面
          total_page: result.pages, // 总分页
          pre_page: result.limit //  限制查询条数
        }
      }
    })
  })
    .catch((error) => {
      handleError({ res, message: "查询失败", error })
    })
}

// 批量修改
comCtrl.list.PATCH = ({ body: { ids, active } }, res) => {
  if (!ids.length) {
    handleError({ res, message: "请选择批量操作的数据" });
    return false;
  }
  Community.update({ "_id": { '$in': ids } }, { $set: { state: active } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, message: "设置成功", result })
    })
    .catch((err) => {
      handleError({ res, message: "设置失败", err });
    })
}

// 推荐操作
comCtrl.item.PUT = ({ params: _id, body: community }, res) => {
  const { choice, recommend, is_collect, user_id } = community;
  let query = {};
  let str = '设置'
  if (choice !== undefined) {
    query['$set'] = { 'choice':choice };
  }
  if (recommend !== undefined) {
    query['$set'] = { 'recommend':recommend };
  }
  const putCommunityId = () => {
    Community.findByIdAndUpdate(_id, query, { new: true })
      .then((result = community) => {
        handleSuccess({ res, message: `${str}成功`, result });
      })
      .catch((err) => {
        handleError({ res, message: `${str}失败` }, err);
      })
  }
  if (is_collect) {
    Community.findOne({ _id: _id })
      .then((result) => {
        let collect = result.meta.collect || 0;
        let arr = result.c_user.filter((item) => Object.is(item, user_id));
        if (!!arr.length) {
          collect = Number(collect) - 1;
          query['$pull'] = { 'c_user': user_id };
          str = "取消收藏"
        } else {
          collect = Number(collect) + 1;
          query['$push'] = { 'c_user': user_id };
          str = "收藏"
        }
        query['$set'] = { 'meta.collect': collect };
        putCommunityId();
      })
      .catch((err) => {
        handleError({ res, message: "设置失败" }, err);
      })
  } else {
    putCommunityId();
  }

}

// 获取单个数据
comCtrl.item.GET = ({ params: { _id } }, res) => {
  const isById = Object.is(Number(_id), NaN);
  (isById ?
    Community.findById({ _id: _id }) :
    Community.findOne({ id: _id, state: 1 })
  )
    .then((result) => {
      if (!isById) {
        result.meta.links += 1;
        result.save({ news: true });
        getKy(result);
      } else {
        handleSuccess({ res, message: "文章获取成功", result });
      }
    })
    .catch((err) => {
      handleError({ res, message: "获取文章失败", err })
    })
  const getKy = (result) => {
    Ky.find({ state: 0 }).select("name").then((data) => {
      if (data.length) {
        data.forEach((item) => {
          result.title = result.title.replace(new RegExp(item.name, "gm"), "****");
          result.content = result.content.replace(new RegExp(item.name, "gm"), "****");
        })
      }
      handleSuccess({ res, message: "文章获取成功", result });
    })
      .catch((err) => {
        handleError({ res, message: "获取文章失败", err })
      })
  }
}

exports.list = (req, res) => { handleRequest({ req, res, controller: comCtrl.list }) }
exports.item = (req, res) => { handleRequest({ req, res, controller: comCtrl.item }) }

