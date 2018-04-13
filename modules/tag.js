const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const tagSchema = new mongoose.Schema({

  // 名称
  name:{ type:String,required:true, },

  // 置顶 1：置顶 0：不置顶 
  top:{ type:Number,default:1 },

  // 是否启用 默认启用
  enable:{ type:Boolean,default:true },

  // 创建时间
  create_at: { type: Date, default: Date.now },

  //更新时间
  update_at: { type: Date, default: Date.now },

})
tagSchema.set("toObject", { getters: true });//
tagSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
tagSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
    model: 'Tag', //插入到News集合中
    field: 'id', //字段为id
    startAt: 1, //开始址
    incrementBy: 1  //每次加
})
//更新
tagSchema.pre("findOneAnfUpdate", (next) => {
  this.findOneAndUpdate({}, { update_at: Date.now() });
  next();
})
// 文章模型
const Tag = mongoose.model('Tag', tagSchema);

// export
module.exports = Tag;