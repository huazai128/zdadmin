const mongoose = require('config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;

// 后台管理系统登录
const userSchema = new mongoose.Schema({
  // 用户名
  username: { type: String, default: 'UUID', },

  // 邮箱 
  email: { type: String, default: '', require: true },

  // 头像
  gravatar: { type: String, default: "/upload/avator.png" },

  // 密码
  password: { type: String, required: true },

  // 用户状态 1: 正常 0： 删除
  status: { type: Number, default: 1 },

  // 权限
  power: [{ type: Number }],

  // 用户类型 0：普通管理员 1： 超级管理员
  type: { type: Number, default: 0 },

  // 创建时间
  create_at: { type: Date, default: Date.now },

  // 更新时间
  update_at: { type: Date, default: Date.now },

  // 启用
  enable: { type: Boolean, default: true },

});

userSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
userSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
  model: 'User', //插入到Article集合中
  field: 'id', //字段为id
  startAt: 1, //开始址
  incrementBy: 1  //每次加
})

//更新
userSchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})

const User = mongoose.model("User", userSchema);

module.exports = User;

