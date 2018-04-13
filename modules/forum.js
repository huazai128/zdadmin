const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const forumSchema = new mongoose.Schema({
  // 标题
  title: { type: String, required: true, validate: /\S+/ },

  // 副标题
  subtitle: { type: String, required: true, validate: /\S+/ },

  // 摘要
  summary: { type: String, default: "" },

  // 文章分类 0:测试类型 1：知识库
  category: { type: Number, default: 0 },

  // 标签管理
  tags: [{ type: ObjectId, ref: "Tag" }],

  // 论坛状态 1:发布 0：草稿 -1：删除  默认是发布
  status: { type: Number, default: 1 },

  // PC封面
  pc_img: { type: String, required: true },

  // 移动封面
  y_img: { type: String, required: true },

  // 内容
  content: { type: String, required: true, validate: /\S+/ },

  //创建时间
  create_at: { type: Date, default: Date.now },

  //更新时间
  update_at: { type: Date, default: Date.now },

  // 发布时间
  time: { type: Date, default: Date.now },

  //其他信息
  meta: {
    views: { type: Number, default: 0 },  //查看数量
    links: { type: Number, default: 0 },  //访问数量
    comments: { type: Number, default: 0 }, //评论数量
    // show: { type: Number, default: 0 }, // 分享数量
  },
})
forumSchema.set("toObject", { getters: true });//
forumSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
forumSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
  model: 'Forum', //插入到News集合中
  field: 'id', //字段为id
  startAt: 1, //开始址
  incrementBy: 1  //每次加
})

//更新
forumSchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})

// 文章模型
const Forum = mongoose.model('Forum', forumSchema);
// export
module.exports = Forum;


