const fs = require('fs')
const base = './src/html/views/'
let reg = /(\w|\d)*\/(\w|\d)*/

var args = process.argv.splice(2)
if (args.length > 1) {
  return
}
if (!reg.test(args[0])) {
  return
}

let path = `${base}${args[0]}`

fs.mkdirSync(path)
fs.createWriteStream(`${path}/index.art`)
fs.createWriteStream(`${path}/index.js`)
fs.createWriteStream(`${path}/index.css`)

fs.writeFileSync(`${path}/index.js`, "import '@/style/common.css'\n" + "import './index.css'\n")
console.log('创建成功')
