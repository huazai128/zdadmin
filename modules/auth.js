const mongoose = require('config/mongodb').mongoose;
const crypto = require("crypto"); // 密码加密;
const config = require("config/config");
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;

const authSchema = new mongoose.Schema({
    // 用户名
    username: { type: String, default: 'UUID',},

    // 邮箱 
    email: { type: String, default: '', require: true },

    // 头像
    gravatar: { type: String, default: "" },

    // 密码
    password: { type: String, require: true },

    // 权限状态 默认为普通管理员
    status: { type: Number, require: true, default: 0 },

    // 用户类型 0:普通用户 1:测试开发用户, 2：后台管理员
    type: { type: Number, require: true, default: 0 },

    // 真实姓名
    name: String,

    // 公司名称
    company: String,

    // 电话
    iphone: Number,

    // 职位
    job: String,

    // 资历
    record:String,

    //创建时间
    create_at: { type: Date, default: Date.now },

    //更新时间
    update_at: { type: Date, default: Date.now },

});

authSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
authSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
    model: 'Auth', //插入到Article集合中
    field: 'id', //字段为id
    startAt: 1, //开始址
    incrementBy: 1  //每次加
})

//更新
authSchema.pre("findOneAnfUpdate", (next) => {
    this.findOneAndUpdate({}, { update_at: Date.now() });
    next();
})

const Auth = mongoose.model("Auth", authSchema);

module.exports = Auth;

