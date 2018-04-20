const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const communitySchema = new mongoose.Schema({
  // 标题
  title: { type: String, required: true, validate: /\S+/ },

  // 内容
  content: { type: String, required: true, validate: /\S+/ },

  // 精选 0：不是精选 1：精选
  choice: { type: Number, default: 0 },

  // 推荐 0：不推荐 1：推荐
  recommend: { type: Number, default: 0 },

  // 发布文章用户Id
  userId: { type: ObjectId, ref: 'Auth' },
  
  // 收藏用户ID
  c_user: [{ type: String }],

  // 状态 0:屏蔽 1：不屏蔽 -1: 回收站
  state: { type: Number, default: 1 },

  //创建时间
  create_at: { type: Date, default: Date.now },

  //更新时间
  update_at: { type: Date, default: Date.now },

  // 最新评论时间
  news_at: { type: Date, default: "" },

  //其他信息
  meta: {
    links: { type: Number, default: 0 },  //访问数量
    comments: { type: Number, default: 0 }, //评论数量
    collect: { type: Number, default: 0 }, // 收藏数量
  },

})

communitySchema.set("toObject", { getters: true });//
communitySchema.plugin(mongoosePaginate);// 添加mongoose分页插件
communitySchema.plugin(autoIncrement.plugin, { //自增ID插件配置
  model: 'Community', //插入到News集合中
  field: 'id', //字段为id
  startAt: 1, //开始址
  incrementBy: 1  //每次加
})

//更新
communitySchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})

// 文章模型
const Community = mongoose.model('Community', communitySchema);
// export
module.exports = Community;
