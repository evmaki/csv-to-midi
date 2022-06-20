const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    configureWebpack: {
        // https://webpack.js.org/configuration/resolve/
        resolve: {
            // fallback cheatsheat: https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a
            fallback: {
                stream: require.resolve('stream-browserify'), // browser version of nodejs stream library (used by fast-csv)
                fs: false, // fallback for nodejs fs library (needed by fast-csv)
            }
        },
        plugins: [
            new HtmlWebpackPlugin({ template: '/public/index.html' }), // override vue-cli default template
            new webpack.ProvidePlugin({ 
                process: 'process/browser'
            })
        ]
    }
}