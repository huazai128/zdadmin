const mongoose = require("config/mongodb").mongoose;

const otherSchema = new mongoose.Schema({
  // 过期时间
  exp: { type: String, required: true },

  // 验证码
  captcha: { type: String,  required: true },

})
const Other = mongoose.model("Other", otherSchema)
module.exports = Other; 