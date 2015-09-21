import Bootstrap from 'bootstrap-webpack-plugin'
import Path from 'path'



const path = Path.join.bind(null, __dirname)
const outputDir = path(`build`)
const indexEntry = [ `./examples/basic/index.js`, `webpack/hot/dev-server` ]
const jsLoaders = [ `react-hot`, `babel` ]

export default {
  entry: {
    index: indexEntry,
  },
  output: {
    path: outputDir,
    filename: `[name].js`,
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loaders: jsLoaders },
      { test: /\.css$/, exclude: /node_modules/, loaders: [ `style`, `css` ]},
    ],
  },
  devtool: `source-map`,
  devServer: {
    contentBase: outputDir,
  },
  plugins: [Bootstrap({})],
}
