const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const OpenBrowserPlugin = require('open-browser-webpack-plugin')
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const WorkboxPlugin = require('workbox-webpack-plugin')
const PORT = 8686
const publicPath = '/'

const smp = new SpeedMeasurePlugin();

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
  const _entries = entries(templateDir)
  const templateFiles = glob.sync(path.resolve(__dirname, templateDir) + '/**/*.art')
  return templateFiles.map(filePath => {
    let filenName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
    let name = filePath.substring(filePath.indexOf('/src/html/views/') + '/src/html/views/'.length, filePath.lastIndexOf(`/${filenName}.`))
    let conf = {
      filename: `${name}.html`,
      template: filePath,
      inject: 'body'
    }
    if (name in _entries) {
      conf.inject = 'body'
      conf.chunks = ['commons', 'vendors', 'basic', name]
      conf.chunksSortMode = 'manual'
    }
    return new HtmlWebpackPlugin(conf)
  })
}

const htmlPlugins = generateHtmlPlugins('./src/html/views')

function getAllPlugins(_mode, https) {
  let commons = [
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [https ? `Your website is running here: https://whiski-h5.lioil.me:8686` : `Your website is running here: http://whiski-h5.lioil.me:8686`]
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        mode: JSON.stringify(_mode),
        NODE_ENV: JSON.stringify(_mode),
      },
    }),
    new VueLoaderPlugin(),
    new ExtractTextPlugin({
      filename: 'css/[name].[hash:8].css',
      allChunks: true,
      publicPath: publicPath
    }),
    // new OpenBrowserPlugin({
    //   url: https ? `https://localhost:${PORT}/webpack-dev-server` : `http://localhost:${PORT}/webpack-dev-server`
    // }),
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      {
        from: './src/favicon',
        to: './favicon'
      }
    ]),
    new webpack.ProvidePlugin({
      $: 'jquery'
    }),
  ].concat(htmlPlugins)
  if (_mode !== 'development') {
    commons.push(new UglifyJsPlugin({
      test: /\.js($|\?)/i,
      parallel: true,
      sourceMap: false,
    }))
    commons.push(new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast 
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
      swDest: 'sw.js',
    }))
  }
  return commons;
}

module.exports = (env, options) => {
  const _mode = options.env.mode
  let mode = ''
  if (_mode === 'simulation') {
    mode = 'production'
  } else {
    mode = _mode
  }
  const https = options.https
  return smp.wrap({
    mode,
    entry: Object.assign(entries('./src/html/views'), {
      'basic': './src/js/default.js',
    }),
    output: {
      pathinfo: false,
      path: path.resolve(__dirname, './dist'),
      filename: 'js/[name].[hash:8].js',
      chunkFilename: 'js/[name].chunk.[chunkhash:8].js',
      publicPath: publicPath
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    devtool: _mode !== 'development' ? 'none' : 'eval-source-map',
    parallelism: 8,
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          commons: {
            name: "commons",
            chunks: "initial",
            minChunks: 2
          },
          vendors: {
            chunks: "initial",
              name: "vendors",
              test: /node_modules\//,
              minChunks: 5,
              priority: 10,
          },
          default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
          }
        }
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            extractCSS: true,
            transformToRequire: {
              video: ['src', 'poster'],
              source: 'src',
              img: 'src',
              image: 'xlink:href'
            }
          }
        },
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'),
          loaders: [
            {
              loader: 'babel-loader?cacheDirectory'
            },
            {
              loader: 'eslint-loader',
              options: {
                emitWarning: true,
                formatter: require('eslint-friendly-formatter'),
                configFile: '.eslintrc'
              }
            }
          ],
        },
        {
          test: /\.css$/,
          exclude: file => (
            /node_modules/.test(file) &&
            !/\.vue\.js/.test(file)
          ),
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
    plugins: getAllPlugins(_mode, https),
    devServer: {
      host: "0.0.0.0",
      contentBase: path.join(__dirname, 'dist'),
      port: PORT,
      quiet: true,
      disableHostCheck: true,
      overlay: {
        warnings: true,
        errors: true
      }
    }
  })
}
