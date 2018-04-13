/**
 * 
 * 公告位控制器
 * 
 */
const Image = require("modules/image");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const imageCtrl = {};
const path = require("path");
const multer = require("multer");

// 图片以及文件上传配置
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/upload"); // 路径要对 不然获取不到
  },
  filename: function (req, file, cb) {
    let ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    cb(null, Date.now() + ext);
  }
})
let upload = multer({
  storage: storage
})

// 图片以及文件上传配置
imageCtrl.POST = (req, res) => {
  // bg 为字段
  upload.single("bg")(req, res, (err) => {
    const { id, process } = req.query;
    console.log(id)
    const addFile = () => {
      if (req.file.filename) {
        console.log(Object.assign({ url: req.file.filename, process: process }, req.body))
        new Image(Object.assign({ url: req.file.filename, process: process }, req.body)).save()
          .then((image) => {
            handleSuccess({ res, result: { path: "/upload/" + req.file.filename }, message: '上传成功' });
          })
          .catch((err) => {
            handleError({ res, message: "上传失败", err })
          })
      }
    }
    if (id) {
      let params = Object.assign({ url: req.file.filename }, req.body);
      delete params.state;
      Image.findByIdAndUpdate({ _id: id }, { $set: params }, { new: true })
        .then((result) => {
          console.log(result);
          handleSuccess({ res, message: "文章修改成功", result });
        })
        .catch((err) => {
          handleError({ res, message: "文章修改失败" }, err);
        })
    } else {
      addFile();
    }
  })
}

// apply_id 获取文件
imageCtrl.GET = (req, res) => {
  const { apply_id } = req.query;
  console.log(apply_id);
  Image.find({ apply_id: apply_id }).select("url state _id process")
    .then((result) => {
      handleSuccess({ res, result: { data: result }, message: '获取数据成功' });
    })
    .catch((err) => {
      handleError({ res, message: "获取数据失败", err })
    })
}

// export
module.exports = (req, res) => { handleRequest({ req, res, controller: imageCtrl }) }