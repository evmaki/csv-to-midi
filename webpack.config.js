const path = require('path')

module.exports = {
  entry: './src/js/client/ui/app.js',
  output: {
    filename: './public/js/bundle.js'
  },
  watch: true,
  module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        }
    ]
  },
  resolve: {
    alias: {
      'vue$': path.resolve(__dirname, 'node_modules/vue/dist/vue.min.js')
    }
  },
  node: {
    fs: 'empty'
  }
}
