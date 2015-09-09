import Bootstrap from 'bootstrap-webpack-plugin'
import Path from 'path'



let path = Path.join.bind(null, __dirname)
let outputDir = path('build')
let indexEntry = [ './examples/basic/index.js', 'webpack/hot/dev-server' ]
let jsLoaders = [ 'react-hot', 'babel' ]

export default {
  entry: {
    index: indexEntry
  },
  output: {
    path: outputDir,
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loaders: jsLoaders },
      { test: /\.css$/, exclude: /node_modules/, loaders: [ 'style', 'css' ]}
    ]
  },
  devtool: 'source-map',
  devServer: {
    contentBase: outputDir
  },
  plugins: [Bootstrap({})]
}
