import Path from 'path'



let path = Path.join.bind(null, __dirname)

let outputDir = path('./build')
let indexEntry = ['./test/index.coffee']

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
      { test: /\.js$/, exclude: /node_modules/, loaders: ['babel']},
      { test: /\.coffee$/, exclude: /node_modules/, loaders: ['coffee']}
    ]
  },
  devtool: 'source-map',
  devServer: {
    contentBase: outputDir
  }
}
