const argv = require("yargs").argv;  //用于获取命令行的数据 node  db_username=huazai

//连接mongodb
exports.MONGODB = {
    // uri:`mongodb://fongwell:fongwell@127.0.0.1:${argv.dbport || '27018' }/NodePress`,
    uri:`mongodb://127.0.0.1:${argv.dbport || '27017' }/NodePress`,
    // uri:`mongodb://123.59.79.200@127.0.0.1:${ argv.dbport || '27017' }/NodePress`,
    user:"fongwell",
    pwd:"fongwell"
}

//七牛配置
exports.QINIU = {
    accessKey: argv.qn_accessKey || 'your access key',
    secretKey: argv.qn_secretKey || 'your secret key',
    bucket: argv.qn_bucket || 'your bucket name',
    origin: argv.qn_origin || 'http://nodepress.u.qiniudn.com',
    uploadURL: argv.qn_uploadURL || 'http://up.qiniu.com/'
}

exports.AUTH = {
  data: argv.auth_data || { user: 'root11' },
  jwtTokenSecret: argv.auth_key || 'nodepress',
  defaultPassword: 'bugaosuni'
}

exports.APP = {
  ROOT_PATH: __dirname,
  LIMIT: 10, //
  PORT: 4201 //端口号
}

exports.INFO = {
  name: 'NodePress',
  version: '1.0.0',
  author: 'huazai',
  site: 'http://localhost:8000',
  powered: ['Vue2', 'Nuxt.js', 'React', 'Angular4', 'Bootstrap4', 'jQuery', 'Video.js', 'Node.js', 'MongoDB', 'Express', 'Nginx']
}

exports.SESSION = {
  secret:"DASDAS-SASASAS",
  // db:`mongodb://fongwell:fongwell@127.0.0.1:${argv.dbport || '27018' }/NodePress`,
  db:`mongodb://127.0.0.1:${argv.dbport || '27017' }/NodePress`,
  // db:`mongodb://123.59.79.200@127.0.0.1:${ argv.dbport || '27017' }/NodePress`,
}