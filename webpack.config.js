const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const OpenBrowserPlugin = require('open-browser-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const PORT = 8686

function entries (templateDir) {
  const entriesFiles = glob.sync(path.resolve(__dirname, templateDir) + '/**/*.js')
  let map = {}
  entriesFiles.forEach((filePath) => {
    let filenName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
    let entryName = filePath.substring(filePath.indexOf('/src/html/views/') + '/src/html/views/'.length, filePath.lastIndexOf(`/${filenName}.`))
    map[entryName] = filePath
  })
  return map
}

function generateHtmlPlugins (templateDir) {
  const templateFiles = glob.sync(path.resolve(__dirname, templateDir) + '/**/*.art')
  return templateFiles.map(filePath => {
    let filenName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
    let name = filePath.substring(filePath.indexOf('/src/html/views/') + '/src/html/views/'.length, filePath.lastIndexOf(`/${filenName}.`))
    let conf = {
      filename: `${name}.html`,
      template: filePath,
      inject: 'body'
    }
    if (name in entries(templateDir)) {
      conf.inject = 'body'
      conf.chunks = ['common', 'vendor', 'basic', name]
      conf.chunksSortMode = 'manual'
    }
    return new HtmlWebpackPlugin(conf)
  })
}

const htmlPlugins = generateHtmlPlugins('./src/html/views')

module.exports = (env, options) => {
  const mode = options.env.mode
  const https = options.https
  process.env.mode = mode
  return {
    mode,
    entry: Object.assign(entries('./src/html/views'), {
      'basic': './src/js/default.js'
    }),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: './js/[name].[chunkhash:8].js',
      publicPath: '/'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'),
          use: [
            {
              loader: 'babel-loader'
            },
            {
              loader: 'eslint-loader',
              options: {
                emitWarning: true,
                formatter: require('eslint-friendly-formatter'),
                configFile: '.eslintrc'
              }
            }
          ]
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [{
              loader: 'css-loader',
              options: {
                importLoaders: 1
              }
            },
            {
              loader: 'postcss-loader'
            }
            ]
          })
        },
        {
          test: /\.(sass|scss)$/,
          include: path.resolve(__dirname, 'src/scss'),
          use: ExtractTextPlugin.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  minimize: true,
                  url: false
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true
                }
              },
              {
                loader: 'sass-loader'
              }
            ]
          })
        },
        {
          test: /\.art$/,
          loader: 'art-template-loader',
          options: {
            // art-template options (if necessary)
            // @see https://github.com/aui/art-template
            htmlResourceRules: [/\bsrc="([^"]*)"/, /\bdata-src="([^"]*)"/, /\bdata-background-image="([^"]*)"/]
          }
        },
        // 图片
        {
          test: /\.(png|jpg|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'image/[name].[hash:8].[ext]'
          }
        },
        // 媒体文件
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'media/[name].[hash:7].[ext]'
          }
        }
      ]
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new FriendlyErrorsWebpackPlugin({
        compilationSuccessInfo: {
          messages: [https ? `Your website is running here: https://localhost:8080` : `Your website is running here: http://localhost:8080`]
        }
      }),
      new webpack.optimize.SplitChunksPlugin({
        chunks: "async",
        cacheGroups: {
          commons: {
            name: "commons",
            chunks: "initial",
            minChunks: 2
          },
          vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10
          },
          default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
          }
        }
      }),
      new ExtractTextPlugin({
        filename: './css/[name].[hash:8].css',
        allChunks: true
      }),
      new OpenBrowserPlugin({
        url: https ? `https://localhost:${PORT}/webpack-dev-server` : `http://localhost:${PORT}/webpack-dev-server`
      }),
      new CleanWebpackPlugin(['dist']),
      new CopyWebpackPlugin([
        // {
        //   from: './src/fonts',
        //   to: './fonts'
        // },
        {
          from: './src/favicon',
          to: './favicon'
        }
        // {
        //   from: './src/img',
        //   to: './img'
        // }
      ]),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        'window.$': 'jquery'
      })
    ].concat(htmlPlugins),
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      port: PORT,
      quiet: true,
      overlay: {
        warnings: true,
        errors: true
      }
    }
  }
}
