const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const planSchema = new mongoose.Schema({

  // 公司名称
  company: { type: String, required: true },

  // 公司规模
  scale: { type: String, required: true },

  // 申请人姓名
  name: { type: String, required: true },

  // 行业 
  industry: { type: String, required: true },

  // 手机号 
  phone: { type: Number, required: true },

  // 邮箱 
  email: { type: String, required: true },

  // 发布日期
  create_at: { type: Date, default: Date.now },

  // 最后更新时间
  update_at: { type: Date },

  // 状态 0: 待审核 1：审核通过 -1： 审核不通过 -2：删除
  state: { type: Number, default: 0 },

  // 用户
  user:{ type:ObjectId,ref:"Auth" },
  
  // 账户
  username:{ type:String,default:'' },

});

planSchema.set("toObject", { getters: true });//
planSchema.plugin(mongoosePaginate);
planSchema.plugin(autoIncrement.plugin, {
  model: 'Plan',
  field: 'id', //字段为id
  startAt: 1, //开始址
  incrementBy: 1  //每次加
})


planSchema.pre("findByIdAndUpdate", (next) => {
  this.findByIdAndUpdate({}, { update_at: Date.now() });
  next();
})
const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
