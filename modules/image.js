const mongoose = require("config/mongodb").mongoose;
const ObjectId = mongoose.Schema.Types.ObjectId;
const ImageSchema = new mongoose.Schema({

    // 派送文件路径
    url: { type: String, default: "" },

    // 派单者上传文件
    p_url: { type: String, default: "" },

    // 派单者上传文件状态, 0:未推送文件 1：已推送文件
    p_state: { type: Number, default: 0 },

    // 状态 1:已完成， 0:未完成
    state: { type: Number, default: 0 },

    // 关联
    apply_id: { type: ObjectId, ref: "Apply" },

    // 创建时间
    create_at: { type: Date, default: Date.now },

    // 更新时间
    update_at: { type: Date, default: Date.now },

    // 测试进程状态 0: 完成申请 1：确认需求 2：技术测试 3：结果交付
    process: { type: Number, default: 0 },

})

//更新
ImageSchema.pre("findOneAnfUpdate", (next) => {
    this.findOneAndUpdate({}, { update_at: Date.now() });
    next();
})
const Image = mongoose.model("Image", ImageSchema);
module.exports = Image; 