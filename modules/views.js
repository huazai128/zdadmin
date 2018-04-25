const mongoose  = require("config/mongodb").mongoose;
const ViewsSchema = new mongoose.Schema({
  // 
  amount:{type:Number,default: 180000},

  // vip数量
  vip:{type:Number,default: 1200}, 

  // 测试者数量
  test:{type:Number,default: 110},

})
const Views = mongoose.model("Views",ViewsSchema)
module.exports = Views; 