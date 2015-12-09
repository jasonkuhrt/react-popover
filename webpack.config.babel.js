import Bootstrap from 'bootstrap-webpack-plugin'
import Path from 'path'



const path = Path.join.bind(null, __dirname)
const outputDir = path(`build`)

export default {
  entry: {
    basic: `./examples/basic/index.js`,
    multipleTriggers: `./examples/multiple-triggers/main.js`,
  },
  output: {
    path: outputDir,
    filename: `[name].js`
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loaders: [`babel`]},
      { test: /\.css$/, exclude: /node_modules/, loaders: [ `style`, `css`, `cssnext` ]},
    ],
  },
  devtool: `source-map`,
  devServer: {
    contentBase: outputDir,
  },
  plugins: [Bootstrap({})],
}
