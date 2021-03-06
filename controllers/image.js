
const Image = require("modules/image");
const { handleRequest, handleError, handleSuccess } = require("utils/handle");
const imageCtrl = {
  list: {},
  item: {}
};
const path = require("path");
const multer = require("multer");
const Apply = require("modules/apply");

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
imageCtrl.list.POST = (req, res) => {
  // bg 为name属性
  upload.single("bg")(req, res, (err) => {
    const { id, process,state } = req.query;
    const image = req.body;
    const addFile = () => {
      let params = {};
      if (process) {
        params.process = process;
      }
      if (req.file && req.file.filename) {
        params.url = req.file.filename;
        params.p_url = "/upload/" + req.file.filename;
      }
      const reviseApplyId = () => {
        Apply.findByIdAndUpdate({ _id: image.apply_id }, { $set: { process: req.body.process } }, { new: true })
          .then((result) => {
            handleSuccess({ res, message: "设置成功", result });
          })
          .catch((err) => {
            handleError({ res, message: "设置失败" }, err);
          })
      }
      new Image(Object.assign(req.body,params)).save()
        .then((image) => {
          let result = {};
          if (req.file && req.file.filename) {
            result.path = "/upload/" + req.file.filename;
          }
          if (image.apply_id) {
            reviseApplyId();
          }else{
            handleSuccess({ res, result, message: '上传成功' });
          }
        })
        .catch((err) => {
          handleError({ res, message: "上传失败", err })
        })
    }
    if (id) {
      let query = {}
      query.url = req.file.filename;
      query.process = process;
      query.p_url = "/upload/" + req.file.filename;
      let params = Object.assign(req.body,query);
      delete params.state;
      if(Object.is(Number(state),-1)){
        params.state = 1;
      }
      Image.findByIdAndUpdate({ _id: id }, { $set: params }, { new: true })
        .then((result) => {
          handleSuccess({ res, message: "文件修改成功", result });
        })
        .catch((err) => {
          handleError({ res, message: "文件修改失败" }, err);
        })
    } else {
      addFile();
    }
  })
}

// apply_id 获取文件
imageCtrl.list.GET = (req, res) => {
  const { apply_id, p_type } = req.query;
  let sel = '';
  if (!p_type) {
    sel = 'url state _id process p_url';
  }
  Image.find({ apply_id: apply_id }).select(sel)
    .then((result) => {
      handleSuccess({ res, result: { data: result }, message: '获取数据成功' });
    })
    .catch((err) => {
      handleError({ res, message: "获取数据失败", err })
    })
}

// Apply
imageCtrl.item.PUT = ({ params: _id, body: image }, res) => {
  if (Number(image.state) === '') {
    handleError({ res, message: "缺少必要参数" });
    return false;
  }
  let query = {};
  if (image.remove) {
    query['$set'] = { url: '', p_url: '', state: Number(image.state) };
  } else {
    query['$set'] = { state: Number(image.state) };
  }
  const reviseApplyId = () => {
    !!Number(image.state) && image.process;
    !Number(image.state) && (image.process -= 1);
    Apply.findByIdAndUpdate({ _id: image.apply_id }, { $set: { process: image.process } }, { new: true })
      .then((result) => {
        handleSuccess({ res, message: "设置成功", result });
      })
      .catch((err) => {
        handleError({ res, message: "设置失败" }, err);
      })
  }
  Image.findByIdAndUpdate(_id, query, { new: true })
    .then((result) => {
      if (!image.remove) {
        reviseApplyId();
      } else {
        handleSuccess({ res, message: "设置成功", result });
      }
    })
    .catch((err) => {
      handleError({ res, message: "设置失败" }, err);
    })
}

// export
exports.list = (req, res) => { handleRequest({ req, res, controller: imageCtrl.list }) }
exports.item = (req, res) => { handleRequest({ req, res, controller: imageCtrl.item }) }


