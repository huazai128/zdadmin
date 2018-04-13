const mongoose  = require("config/mongodb").mongoose;
const ViewsSchema = new mongoose.Schema({
  amount:{type:Number,default: 180000,required: true},
})
const Views = mongoose.model("Views",ViewsSchema)
module.exports = Views; 