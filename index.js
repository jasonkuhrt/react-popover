// http://stackoverflow.com/questions/33505992/babel-6-changes-how-it-exports-default

const lib = require("./build")
module.exports = lib.default
