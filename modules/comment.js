// 评论数据模型

const mongoose = require("config/mongodb").mongoose;
const autoIncrement = require('mongoose-auto-increment');
const mongoosePaginate = require('mongoose-paginate');
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);

// 评论模型
const commentShema = new mongoose.Schema({
    // 评论者用户
    user_id: { type: ObjectId, ref: "Auth", required: true },

    // 评论所在的文章id，0代表系统留言板
    post_id: { type: String, required: true },

    // 回复评论者id
    reply_id: { type: ObjectId, ref: "Auth" },

    // 用户名称
    username: { type: String, default: "" },

    // 判断用户是否点赞
    like_user: { type: ObjectId, ref: "Auth" },

    // 点赞状态
    is_like: { type: Boolean, default: false },

    // 评论内容
    content: { type: String, required: true },

    // 是否置顶
    is_top: { tyep: Boolean, default: false },

    // 被赞次数
    likes: { type: Number, default: 0 },

    // 状态 0待审核／1已通过／-1已删除
    state: { type: Number, default: 1 },

    // 发布日期
    create_at: { type: Date, default: Date.now },

    // 最后更新时间
    update_at: { type: Date },

});

commentShema.set("toObject", { getters: true });//
commentShema.plugin(mongoosePaginate);
commentShema.plugin(autoIncrement.plugin, {
    model: 'Comment',
    field: 'id', //字段为id
    startAt: 1, //开始址
    incrementBy: 1  //每次加
})


commentShema.pre("findByIdAndUpdate", (next) => {
    this.findByIdAndUpdate({}, { update_at: Date.now() });
    next();
})

const Comment = mongoose.model("Comment", commentShema);

module.exports = Comment;

