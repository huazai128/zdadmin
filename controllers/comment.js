const Comment = require("modules/comment");
const Auth = require("modules/auth");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const Community = require("modules/community");
const Ky = require("modules/ky");
const authIsVerified = require('utils/auth');
const commentCtrl = { list: {}, item: {} };

const updateCommunityCommentCount = (post_ids = []) => {
  post_ids = [...new Set(post_ids)].filter(id => !!id);
  if (post_ids.length) {
    Comment.aggregate([
      { $match: { state: 1, post_id: { $in: post_ids } } },
      { $group: { _id: "$post_id", num_tutorial: { $sum: 1 } } }
    ])
      .then((counts) => {
        if (counts.length === 0) {
          Community.update({ id: post_ids[0] }, { $set: { 'meta.comments': 0, news_at: new Date() } })
            .then((info) => {
              console.log('评论聚合更新成功', info);
            })
            .catch((err) => {
              console.warn('评论聚合更新失败', err);
            })
        } else {
          counts.forEach((count) => {
            Community.update({ id: count._id }, { $set: { 'meta.comments': count.num_tutorial, news_at: new Date() } })
              .then((info) => {
                console.log('评论聚合更新成功', info);
              })
              .catch((err) => {
                console.warn('评论聚合更新失败', err);
              })
          })
        }
      })
      .catch((err) => {
        console.warn('更新评论count聚合数据前，查询失败', err);
      })
  }
}

// 添加评论
commentCtrl.list.POST = ({ body: comment }, res) => {
  if (!comment.user_id) {
    handleError({ res, message: '请先登录!' });
    return false;
  }
  if (!comment.content) {
    handleError({ res, message: '请输入评论!' });
    return false;
  }
  const saveComment = () => {
    new Comment(comment).save()
      .then((result = comment) => {
        handleSuccess({ res, result, message: '评论发布成功' });
        updateCommunityCommentCount([comment.post_id]);
      })
      .catch((err) => {
        handleError({ res, err, message: '评论发布失败' });
      })
  }
  // 查找所有关键字
  const getKyCheck = () => {
    Ky.find({ state: 0 }).select("name")
      .then((result) => {
        if (result.length) {
          let arr = result.filter((item) => eval(`/${item.name}/ig`).test(comment.content));
          if (!!arr.length) {
            handleError({ res, message: '内容不合法' });
          } else {
            saveComment();
          }
        } else {
          saveComment();
        }
      })
      .catch((err) => {
        handleError({ res, err, message: '评论失败' });
      })
  }
  Auth.findById({ _id: comment.user_id })
    .then((user) => {
      if (Object.is(user.status, 1)) {
        getKyCheck();
      } else {
        handleError({ res, message: `已被${user.time_name}` });
      }
    })
    .catch((err) => {
      handleError({ res, err, message: '评论失败' });
    })
}

// 获取评论
commentCtrl.list.GET = (req, res) => {
  let { sort = -1, page = 1, pre_page = 10, id, state, keywords = '', c_userId } = req.query;
  sort = Number(sort);
  state = !Object.is(state, undefined) ? Number(state) : null;
  let sele = {
    select: "username email _id"
  }
  const options = {
    sort: { _id: sort },
    page: Number(page),
    limit: Number(pre_page),
    populate: [{ path: "user_id", sele }, { path: "reply_id", sele }],
  };
  if ([1, -1].includes(sort)) {
    options.sort = { _id: sort };
  } else if (Object.is(sort, 2)) {
    options.sort = { likes: -1 };
  };
  let querys = {};
  if (state && !Object.is(state, NaN) && [-1, 1, 0].includes(Number(state))) {
    querys.state = state;
  };
  if (keywords) {
    const keywordReg = new RegExp(keywords);
    querys['$or'] = [
      { 'content': keywordReg },
      { 'username': keywordReg },
    ]
  };
  if (!Object.is(id, undefined)) {
    querys.post_id = id;
  }
  Comment.paginate(querys, options)
    .then((comments) => {
      handleSuccess({
        res,
        message: '评论列表获取成功',
        result: {
          pagination: {
            total: comments.total,
            current_page: options.page,
            total_page: comments.pages,
            pre_page: options.limit
          },
          data: comments.docs
        }
      });
    })
    .catch(err => {
      handleError({ res, err, message: '评论列表获取失败' });
    })
}

// 点赞
commentCtrl.item.PUT = ({ params: { _id }, body: comment }, res) => {
  let query = {};
  let likes = comment.likes;
  Comment.findOne({ _id: _id }).then((result) => {
    let arr = result.like_user.filter((item) => Object.is(item, comment.user_id));
    if (!!arr.length) {
      likes = Number(comment.likes) - 1;
      query['$pull'] = { 'like_user': comment.user_id };
    } else {
      likes = Number(comment.likes) + 1;
      query['$push'] = { 'like_user': comment.user_id };
    }
    query['$set'] = { 'likes': likes };
    commnentUpdate();
  })
    .catch((err) => {
      handleError({ res, err, message: '设置失败' });
    })
  const commnentUpdate = () => {
    Comment.findByIdAndUpdate(_id, query, { new: true })
      .then((result) => {
        handleSuccess({ res, result, message: '设置成功' });
      })
      .catch((err) => {
        handleError({ res, err, message: '设置失败' });
      })
  }
}

// 评论操作
commentCtrl.list.PATCH = ({ body: { ids, state, post_id } }, res) => {
  state = Object.is(state, undefined) ? null : Number(state);
  if (!ids || !ids.length || Object.is(state, null) || Object.is(state, NaN) || ![-1, -2, 0, 1].includes(state)) {
    handleError({ res, message: '缺少有效参数或参数无效' });
    return false;
  };
  Comment.update({ "_id": { $in: ids } }, { $set: { state: state } }, { multi: true })
    .then((result) => {
      handleSuccess({ res, result, message: '评论批量操作成功' });
      updateCommunityCommentCount([post_id])
    })
    .catch((err) => {
      handleError({ res, err, message: '评论批量删除失败' });
    })
}


exports.list = (req, res) => { handleRequest({ req, res, controller: commentCtrl.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: commentCtrl.item }) };