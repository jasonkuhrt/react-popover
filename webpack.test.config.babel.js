import Path from 'path'



const path = Path.join.bind(null, __dirname)
const outputDir = path(`./build`)
const indexEntry = [`./test/index.coffee`]

export default {
  entry: {
    index: indexEntry,
  },
  output: {
    path: outputDir,
    filename: `index.js`,
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loaders: [`babel`]},
      { test: /\.coffee$/, exclude: /node_modules/, loaders: [`coffee`]},
    ],
  },
  devtool: `source-map`,
}
