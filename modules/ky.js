const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const kySchema = new mongoose.Schema({

  // 名称
  name:{ type:String,required:true, },

  // 是否启用 0:启用 -1: 删除
  state:{ type: Number,default: 0 },

  // 创建时间
  create_at: { type: Date, default: Date.now },

  //更新时间
  update_at: { type: Date, default: Date.now },

})
kySchema.set("toObject", { getters: true });//
kySchema.plugin(mongoosePaginate);// 添加mongoose分页插件
kySchema.plugin(autoIncrement.plugin, { //自增ID插件配置
    model: 'Ky', //插入到News集合中
    field: 'id', //字段为id
    startAt: 1, //开始址
    incrementBy: 1  //每次加
})
//更新
kySchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})
// 文章模型
const Ky = mongoose.model('Ky', kySchema);

// export
module.exports = Ky;