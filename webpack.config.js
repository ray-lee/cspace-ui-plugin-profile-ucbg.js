/* eslint import/no-extraneous-dependencies: "off" */
/* eslint-disable no-console */

const { execSync } = require('child_process');
const path = require('path');
const webpack = require('webpack');
const webpackDevServerConfig = require('./webpackDevServerConfig');

/**
 * The public path to local webpack assets. This is chosen to have low chance of collision with any
 * path on a proxied back-end (e.g., "/cspace/core" or "/cspace-services"). This should start and
 * end with slashes.
 */
const publicPath = '/webpack-dev-assets/';

const library = 'cspaceUIPluginProfileUCBG';
const isProduction = process.env.NODE_ENV === 'production';
const filename = `${library}${isProduction ? '.min' : ''}.js`;

let buildNum = '';
let repositoryUrl = '';

try {
  buildNum = execSync('git rev-parse --short=7 HEAD').toString().trim();
} catch (err) {
  console.log('Failed to get build number from git: %s', err.stderr.toString());
}

try {
  repositoryUrl = JSON.parse(execSync('npm pkg get repository.url').toString().trim());
} catch (err) {
  console.log('Failed to get repository url from npm: %s', err.stderr.toString());
}

module.exports = async () => ({
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    filename,
    library,
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.resolve(__dirname, 'dist'),
    publicPath,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[folder]-[name]--[local]',
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|svg)$/,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      [`${library}.isProduction`]: isProduction,
      [`${library}.packageName`]: JSON.stringify(process.env.npm_package_name),
      [`${library}.packageVersion`]: JSON.stringify(process.env.npm_package_version),
      [`${library}.buildNum`]: JSON.stringify(buildNum),
      [`${library}.repositoryUrl`]: JSON.stringify(repositoryUrl),
    }),
    // Replace react-intl with a stub. For messages to be extracted by babel-plugin-react-intl,
    // react-intl must be imported, and the defineMessages marker function must be called. This
    // would cause the entire react-intl package to be bundled with this package, needlessly
    // increasing its size.
    new webpack.NormalModuleReplacementPlugin(
      /^react-intl$/,
      path.resolve(__dirname, 'react-intl-stub.js'),
    ),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: await webpackDevServerConfig({
    library,
    localIndex: process.env.npm_config_local_index,
    proxyTarget: process.env.npm_config_back_end,
    publicPath,
  }),
});
