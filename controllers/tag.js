const Tag = require("modules/tag");
const Forum = require("modules/forum");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");// 用于处理请求方法和请求状态
const config = require("config/config");
const tagCtrls = { list: {}, item: {} };

//添加标签
tagCtrls.list.POST = ({ body: tag }, res) => {
  if (tag.name == undefined && tag.name == null) {
    handleError({ res, message: "请填写完整的表单" });
    return falses;
  }
  const tagSave = () => {
    new Tag(tag).save()
      .then((result = tag) => {
        handleSuccess({ res, result, message: "保存成功" });
      })
      .catch((err) => {
        handleError({ res, err, message: "保存失败" })
      })
  }
  Tag.find({ name: tag.name }).then(({ length }) => {
    length ? handleError({ res, message: "名称已存在" }) : tagSave();
  })
    .catch((err) => {
      handleError({ res, err, message: "标签发布失败" })
    })
}
// 获取所有列表数据
tagCtrls.list.GET = (req, res) => {
  let { page = 1, pre_page = 5, enable } = req.query;
  const options = {
    sort: { top: -1, id: -1 },
    page: Number(page),
    limit: Number(pre_page)
  }
  let query = {};
  if (enable) {
    query.enable = enable;
  }
  const querySuccess = (tags) => {
    handleSuccess({
      res,
      message: "获取标签列表",
      result: {
        pagination: {
          total: tags.total,
          current_page: options.page,
          total_page: tags.pages,
          pre_page: options.limit
        },
        data: tags.docs
      }
    })
  }
  const getTagsCount = (tags) => {
    let $match = {};
    Forum.aggregate([
      { $match },
      { $unwind: "$tag" },
      {
        $group: {
          _id: "$tag",
          num_tutorial: { $sum: 1 }
        }
      }
    ]).then(forums => {
      const newTags = tags.docs.map(tag => {
        const finded = forums.find(forum => String(tag._id) === String(forum._id));
        tag.count = finded ? finded.num_tutorial : 0;
        return tag;
      })
      tags.doce = newTags;
      querySuccess(tags);
    }).catch((err) => {
      querySuccess(tags);
    })
  }
  Tag.paginate(query, options)
    .then(tags => {
      getTagsCount(tags);
    })
    .catch(err => {
      handleError({ res, err, messgage: "获取列表失败" });
    })
}

//根据ID删除,   req.params._id
tagCtrls.item.DELETE = ({ params: { _id } }, res) => {
  const removeTag = () => {
    Tag.findByIdAndRemove(_id)
      .then(result => {
        handleSuccess({ res, message: "删除成功", result });
      })
      .catch(err => {
        handleError({ res, message: "删除失败", err });
      })
  }
  Forum.find({ "tags": { '$in': [_id] } }).then((result) => {
    !!result.length ? handleError({ res, message: "当前标签已被使用" }) : removeTag();
  }).catch((err) => {
    handleError({ res, message: "操作失败", err });
  })
}

// 根据ID 修改Tag
tagCtrls.item.PUT = ({ params: { _id }, body: tag, body: { name } }, res) => {
  if (!name) {
    handleError({ res, message: "slug不合法" });
    return false;
  };
  Tag.find({ name: name }).then(([_tag]) => {
    const hasExisted = (_tag && (_tag._id == tag._id));
    hasExisted ? handleError({ res, message: "标签名称已存在" }) : putTag();
  }).catch((err) => {
    handleError({ res, message: "修改前查询失败" }, err);
  });
  const putTag = () => {
    Tag.findByIdAndUpdate(_id, tag, { new: true })
      .then(result => {
        handleSuccess({ res, result, message: "修改成功" });
      })
      .catch(err => {
        handleError({ res, message: "修改失败", err });
      })
  }
}

// 获取当前id下的标签
tagCtrls.item.GET = ({ params: _id }, res) => {
  Tag.findById(_id).select("name enable _id").then((result) => {
    handleSuccess({ res, message: "查询成功", result });
  })
    .catch((err) => {
      handleError({ res, message: "查询失败", err });
    })
}

// 批量修改
tagCtrls.list.PATCH = ({ body: { ids, top, enable } }, res) => {
  let query = {}
  let str = '';
  if (top !== undefined) {
    query.top = top;
    str = top ? "置顶" : "取消置顶";
  }
  if (enable !== undefined) {
    query.enable = enable;
    str = enable ? '启用' : "禁用"
  }
  if (!ids.length) {
    handleError({ res, message: "缺少参数" });
    return false;
  }
  Tag.update({ "_id": { '$in': ids } }, { $set: query }, { multi: true })
    .then((result) => {
      handleSuccess({ res, message: `${str}成功`, result })
    })
    .catch((err) => {
      handleError({ res, message: `${str}失败`, err });
    })
}

exports.list = (req, res) => { handleRequest({ req, res, controller: tagCtrls.list }) };
exports.item = (req, res) => { handleRequest({ req, res, controller: tagCtrls.item }) };
