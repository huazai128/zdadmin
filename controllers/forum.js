//请求方法和处理相应状态函数
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const Forum = require("modules/forum");

const forumCtrl = {
  list: {},
  item: {}
}

// 新增集市
forumCtrl.list.POST = ({ body: forum }, res) => {
  if (!forum.title || !forum.content || !forum.pc_img || !forum.y_img) {
    handleError({ res, message: "文本框未填写完整" });
    return false;
  }
  forum.status = Number(forum.status);
  new Forum(forum).save()
    .then((result = forum) => {
      handleSuccess({ res, result, message: "发表成功" });
    })
    .catch((err) => {
      handleError({ res, err, message: "发表失败" });
    })
}
// 查询所有数据
forumCtrl.list.GET = (req, res) => {
  const { keywords, state, category, tags, page, pre_page } = req.query;
  const arr = [0, 1, -1];
  let options = {
    sort: { _id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
    populate: 'tags', // 关联查询
  }
  let query = {};
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query = {
      "$or": [
        { 'title': ketwordReg },
        { 'subtitle': ketwordReg },
        { 'content': ketwordReg },
        { 'summary': ketwordReg }
      ]
    }
  }
  if (arr.includes(Number(state))) {
    query.status = state;
  }
  if (arr.includes(Number(category))) {
    query.category = category;
  }
  if (tags) {
    query.tags = { "$in": tags.split(',') }
  }
  Forum.paginate(query, options).then((result) => {
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
forumCtrl.list.PATCH = ({ body: { ids, active } }, res) => {
  if (!ids.length) {
    handleError({ res, message: "请选择批量操作的数据" });
    return false;
  }
  Forum.update({ "_id": { '$in': ids } }, { $set: { status: active } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, message: "批量操作成功", result })
    })
    .catch((err) => {
      handleError({ res, message: "批量操作失败", err });
    })
}

// 获取单个数据
forumCtrl.item.GET = ({ params: { _id } }, res) => {
  const isFindById = Object.is(Number(_id), NaN);  
  (isFindById ?
    Forum.findById({ _id: _id }).select('-meta -create_at -update_at') :
    Forum.findOne({ id: Number(_id) })
  )
    .then((result) => {
      if (!isFindById) {
        result.meta.views += 1;  
        result.save({ news: true }); 
      }
      handleSuccess({ res, message: "文章获取成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "获取文章失败", err })
    })
}


// 修改单个数据
forumCtrl.item.PUT = ({ params: _id, body: forum  }, res) => {
  if (!forum.title && !forum.content) {
    handleError({ res, message: "缺少必要参数" });
    return false;
  }
  Forum.findByIdAndUpdate(_id, forum, { new: true })
    .then((result = forum) => {
      handleSuccess({ res, message: "文章修改成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "文章修改失败" }, err);
    })
}


exports.list = (req, res) => { handleRequest({ req, res, controller: forumCtrl.list }) }
exports.item = (req, res) => { handleRequest({ req, res, controller: forumCtrl.item }) }


