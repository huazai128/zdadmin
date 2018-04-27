const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const applySchema = new mongoose.Schema({

  // 测试类型 0:功能测试 1：兼容测试
  mold: { type: Number, default: 0, },

  // 公司名称
  company: { type: String, required: true },

  // 联系人名称
  name: { type: String, required: true },

  // 职位 
  job: { type: String, required: true },

  // 手机号 
  phone: { type: Number, required: true },

  // 邮箱 
  email: { type: String, required: true },

  // QQ 
  qq: { type: String, required: true },

  // 咨询内容
  content: { type: String, required: true },

  // 发布日期
  create_at: { type: Date, default: Date.now },

  // 最后更新时间
  update_at: { type: Date },

  // 状态 0: 待审核 1：已审核 -1： 不通过 -2：删除
  state: { type: Number, default: 1 },

  // 用户 申请用户id
  user: { type: ObjectId, ref: "Auth" },

  // 账户 申请时用户名称
  username: { type: String, default: '' },

  // 测试进程状态 0: 完成申请 1：确认需求 2：技术测试 3：结果交付
  process: { type: Number, default: 0 },

  // 类型 0:测试申请 1：众测平台
  style: { type: Number, default: 0 },

  // 众测派单用户
  p_user:{ type: ObjectId, ref: "Auth" },

  // 众测品台派单状态 0：派单中 1：完成派单
  p_state:{ type: Number, default: 0 }, 

});

applySchema.set("toObject", { getters: true });
applySchema.plugin(mongoosePaginate);
applySchema.plugin(autoIncrement.plugin, {
  model: 'Apply',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

applySchema.pre("findByIdAndUpdate", (next) => {
  this.findByIdAndUpdate({}, { update_at: Date.now() });
  next();
})
const Apply = mongoose.model('Apply', applySchema);
module.exports = Apply;
