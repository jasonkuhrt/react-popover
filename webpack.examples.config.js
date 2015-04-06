var Bootstrap = require('bootstrap-webpack-plugin')
var path = require('path').join.bind(null, __dirname)



var outputDir = path('build')
var indexEntry = ['./examples/basic/index.js', 'webpack/hot/dev-server']
var jsLoaders = ['react-hot', 'babel']

module.exports = {
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
      { test: /\.css$/, exclude: /node_modules/, loaders: ['style', 'css'] }
    ]
  },
  devtool: 'source-map',
  devServer: {
    contentBase: outputDir
  },
  plugins: [Bootstrap({})]
}
