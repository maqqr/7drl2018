'use strict';

var HappyPack = require('happypack');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'inline-source-map',
    entry: './src/index.ts',
    output: { filename: 'dist/index.js' },
    module: {
        rules: [
            {
                test: /\.ts$/,
                // exclude: /node_modules/,
                exclude: ["node_modules", "tiled"],
                loader: 'happypack/loader?id=ts'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        overlay: {
          errors: true,
          warnings: true,
        },
      },
    plugins: [
        new HappyPack({
            id: 'ts',
            threads: 2,
            loaders: [
                {
                    path: 'ts-loader',
                    query: { happyPackMode: true }
                }
            ]
        }),
        new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
        new HtmlWebpackPlugin({
            title: 'Crypt of Grimwin - 7drl2018 game',
            filename: 'dist/index.html',
            template: 'index-template.ejs',
        }),
        new CopyWebpackPlugin([
            { from: 'static', to: 'dist' }
        ])
    ]
};
