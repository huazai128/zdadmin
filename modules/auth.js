const mongoose = require('config/mongodb').mongoose;
const crypto = require("crypto"); // 密码加密;
const config = require("config/config");
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;

const authSchema = new mongoose.Schema({
    // 用户名
    username: { type: String, default: 'UUID', },

    // 邮箱 
    email: { type: String, default: '', require: true },

    // 头像
    gravatar: { type: String, default: "/upload/avator.png" },

    // 密码
    password: { type: String, required: true },

    // 状态 1:正常 0: 禁言 默认禁言一小时 -1:禁言其他 -2：禁用 -3：删除
    status: { type: Number, required: true, default: 1 },

    // 用户类型 0:普通用户 1:测试开发用户
    type: { type: Number, required: true, default: 0 },

    // 真实姓名
    name: { type: String, required: true },

    // 身份证
    card: { type: String, required: true },

    // 公司名称
    company: String,

    // 电话
    iphone: Number,

    // 职位
    job: String,

    // 资历
    record: String,

    // 创建时间
    create_at: { type: Date, default: Date.now },

    // 更新时间
    update_at: { type: Date, default: Date.now },

    // 禁言时间
    time: { type: Date },

    // 禁言时间名称
    time_name: { type: String },

    // 审核状态 1：通过审核 0 待审核
    c_state:{ type: Number, required: true, default: 1 }

});

authSchema.plugin(mongoosePaginate);
authSchema.plugin(autoIncrement.plugin, { 
    model: 'Auth',
    field: 'id', 
    startAt: 1, 
    incrementBy: 1  
})

//更新
authSchema.pre("findOneAnfUpdate", (next) => {
    this.findOneAndUpdate({}, { update_at: Date.now() });
    next();
})

const Auth = mongoose.model("Auth", authSchema);

module.exports = Auth;

