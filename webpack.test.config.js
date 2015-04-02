var path = require('path').join.bind(null, __dirname)



/* Environment-dependent Settings */

var outputDir = path('./build')
var indexEntry = ['./test/index.coffee']

/* Webpack Config Proper */

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
      { test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] },
      { test: /\.coffee$/, exclude: /node_modules/, loaders: ['coffee'] }
    ]
  },
  devtool: 'source-map',
  devServer: {
    contentBase: outputDir
  }
}
