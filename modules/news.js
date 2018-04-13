const mongoose = require('../config/mongodb').mongoose;
const autoIncrement = require('mongoose-auto-increment');  //自动ID增长
const mongoosePaginate = require('mongoose-paginate'); //分页
const ObjectId = mongoose.Schema.Types.ObjectId;
autoIncrement.initialize(mongoose.connection);  //自动ID增长  初始化

const newsSchema = new mongoose.Schema({

    //文章标题
    title: { type: String, required: true, validate: /\S+/ },

    //文章关键字
    keywords: [{ type: String }],

    // 摘要
    summary: { type: String, default: "" },

    // 栏目
    column: { type: Number,default: 1},

    // 作者
    auth: { type: String, required: true },

    // 来源
    origin: { type: String, default: "" },

    // 发布时间
    time: { type: Date,default: Date.now },

    // 排序 默认为1
    sort: { type: String, default: 1 },

    // PC封面,缩略图
    url: { type: String, required: true },

    // 移动,缩略图
    murl: { type: String },

    //文章内容
    content: { type: String, required: true, validate: /\S+/ },

    //文章状态 1:发布 0：草稿 -1:回收站
    state: { type: Number, default: 1 },

    // 创建时间
    create_at: { type: Date, default: Date.now },

    //更新时间
    update_at: { type: Date, default: Date.now },

    //文件标签
    // tag: [{ type: ObjectId, ref: "Tag" }],

    //文章分类
    // category: [{ type: ObjectId, ref: "Category", required: true }],

    //其他信息
    meta: {
        views: { type: Number, default: 0 },  //查看数量
        links: { type: Number, default: 0 },  //访问数量
        comments: { type: Number, default: 0 }, //评论数量
    },
});

newsSchema.set("toObject", { getters: true });//

newsSchema.plugin(mongoosePaginate);// 添加mongoose分页插件
newsSchema.plugin(autoIncrement.plugin, { //自增ID插件配置
    model: 'News', //插入到News集合中
    field: 'id', //字段为id
    startAt: 1, //开始址
    incrementBy: 1  //每次加
})

//更新
newsSchema.pre("findOneAnfUpdate", (next) => {
    this.findOneAndUpdate({}, { update_at: Date.now() });
    next();
})

// 列表时用的文章内容虚拟属性
newsSchema.virtual('t_content').get(function () {
    const content = this.content;
    return !!content ? content.substring(0, 130) : content;
});
// 文章模型
const News = mongoose.model('News', newsSchema);

// export
module.exports = News;