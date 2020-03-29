const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const mode = process.env.NODE_ENV || 'development';

module.exports = {
    mode,
    entry: {
        main: './src/app.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve('./dist'),
    },
    devServer: {
        overlay: true,
        stats: 'errors-only',
        proxy: {
            '/api': 'http://localhost:8081',
        },
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: [
                    process.env.NODE_ENV === 'production'
                        ? MiniCssExtractPlugin.loader // 프로덕션 환경
                        : 'style-loader', // 개발 환경
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpg|svg|gif)$/,
                loader: 'url-loader',
                options: {
                    name: '[name].[ext]?[hash]',
                    limit: 10000, // 10Kb
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader', // 바벨 로더를 추가한다
            },
        ],
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `빌드 날짜: ${new Date().toLocaleString()}`,
        }),
        new webpack.DefinePlugin({}),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            templateParameters: {
                env: process.env.NODE_ENV === 'development' ? '(개발용)' : '',
            },
            minify:
                process.env.NODE_ENV === 'production'
                    ? {
                          collapseWhitespace: true, // 빈칸 제거
                          removeComments: true, // 주석 제거
                      }
                    : false,
            hash: process.env.NODE_ENV === 'production',
        }),
        new CleanWebpackPlugin(),
        ...(process.env.NODE_ENV === 'production' ? [new MiniCssExtractPlugin({ filename: `[name].css` })] : []),
        new CopyPlugin([
            {
                from: './node_modules/axios/dist/axios.min.js',
                to: './axios.min.js', // 목적지 파일에 들어간다
            },
        ]),
    ],
    optimization: {
        minimizer:
            mode === 'production'
                ? [
                      new OptimizeCSSAssetsPlugin(),
                      new TerserPlugin({
                          terserOptions: {
                              compress: {
                                  drop_console: true, // 콘솔 로그를 제거한다
                              },
                          },
                      }),
                  ]
                : [],
    },
    externals: {
        axios: 'axios',
    },
};
