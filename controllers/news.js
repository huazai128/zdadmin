//请求方法和处理相应状态函数
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const News = require("modules/news");
const config = require("config/config");
const newsCtrl = { list: {}, item: {} };

// 新增新闻
newsCtrl.list.POST = ({ body: news }, res) => {
  if (!news.title || !news.content || !news.murl || !news.url) {
    handleError({ res, message: "文本框未填写完整" });
    return false;
  }
  news.column = news.column.value;
  new News(news).save()
    .then((result = news) => {
      handleSuccess({ res, result, message: "新闻发表成功" });
    })
    .catch((err) => {
      handleError({ res, err, message: "新闻发表失败" });
    })
}

// 获取所有的文章
newsCtrl.list.GET = (req, res) => {
  let { keywords, state, public, pre_page, page, hot, column } = req.query
  const arr = ['0', '1', '-1'];
  let options = {
    sort: { _id: -1 },
    limit: Number(pre_page || 10),
    page: Number(page || 1),
  }
  let query = {};

  if (column) {
    query.column = column;
  }
  if (keywords) {
    const ketwordReg = new RegExp(keywords);
    query["$or"] = [
      { 'title': ketwordReg },
      { 'content': ketwordReg },
      { 'summary': ketwordReg }
    ]
  }
  if (Object.is(Number(public), 1)) {
    query.time = {
      "$lte": new Date()
    };
  }
  if (Object.is(Number(public), 0)) {
    query.time = {
      "$gte": new Date()
    };
  }
  if (!!hot) {
    options.sort = {
      'meta.comments': -1,
      'meta.lickes': -1
    }
  }
  const getArticles = () => {
    News.paginate(query, options)
      .then(news => {
        let datas = news.docs.map((item) => {
          item.state = (new Date(item.time) - new Date() >= 0) ? 0 : 1;
          return item;
        })
        handleSuccess({
          res,
          message: "文章列表获取成功",
          result: {
            data: datas,
            pagination: {
              total: news.total,
              current_page: news.page,
              total_page: news.pages,
              pre_page: news.limit
            }
          }
        })
      })
      .catch((err) => {
        handleError({ res, message: "文章查询失败", err })
      })
  }
  getArticles();
}

// 批量删除
newsCtrl.list.DELETE = ({ query: { body: newsIds } }, res) => {
  if (!newsIds && !newsIds.length) {
    handleError({ res, message: "缺少删除数据" });
    return false;
  }
  News.remove({ "_id": { $in: newsIds } })
    .then((result) => {
      handleSuccess({ res, message: "删除成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "删除失败", err });
    })
}

// 批量文件操作
newsCtrl.list.PATCH = ({ body: { articles, action } }, res) => {
  if (!articles && !articles.leng) {
    handleError({ res, message: "缺少字段" });
    return false;
  }
  let options = {};
  switch (action) {
    case 1:
      options.state = 1;
      break;
    case 2:
      options.state = 0;
      break;
    case 3:
      options.state = -1;
      break;
    default:
      break;
  }
  News.update({ "_id": { $in: articles } }, { $set: options }, { multi: true })
    .then((result) => {
      handleSuccess({ res, message: "修改文章状态成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "修改文章状态失败", err });
    })
}

// 根据ID获取文章信息
newsCtrl.item.GET = ({ params: { _id } }, res) => {
  const isFindById = Object.is(Number(_id), NaN);
  (isFindById ?
    News.findById({ _id: _id }).select('-meta -create_at -update_at') :
    News.findOne({ id: _id, state: 1 }).exec()
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

// 修改ID
newsCtrl.item.PUT = ({ params: _id, body: article }, res) => {
  if (!article.title && !article.content) {
    handleError({ res, message: "缺少必要参数" });
    return false;
  }
  News.findByIdAndUpdate(_id, article, { new: true })
    .then((result = article) => {
      handleSuccess({ res, message: "文章修改成功", result });
    })
    .catch((err) => {
      handleError({ res, message: "文章修改失败" }, err);
    })
}


// export
exports.list = (req, res) => { handleRequest({ req, res, controller: newsCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: newsCtrl.item }) };
