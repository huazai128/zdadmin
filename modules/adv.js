const mongoose = require('config/mongodb').mongoose;
const config = require("config/config");
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;

const advSchema = new mongoose.Schema({
  // PC端图片连接
  url: { type: String, default: '', require: true },

  // 移动端端图片连接
  murl: { type: String, default: '', require: true },

  // 标题 
  title: { type: String, default: '', require: true },

  // 连接
  link: { type: String, default: "" },

  // 移动端连接
  yurl: { type: String, default: "" },

  // 排序
  sort: { type: Number, require: true, default: 1 },

  // 创建时间
  create_at: { type: Date, default: Date.now },

  // 更新时间
  update_at: { type: Date, default: Date.now },

  // 广告状态 1:发布 0：草稿 -1:回收站
  state: { type: Number, default: 1 },

});

advSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
advSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
  model: 'Adv', //插入到Article集合中
  field: 'id', //字段为id
  startAt: 1, //开始址
  incrementBy: 1  //每次加
})

//更新
advSchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})

const Adv = mongoose.model("Adv", advSchema);

module.exports = Adv;