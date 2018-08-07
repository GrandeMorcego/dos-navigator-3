const path = require('path');
const webpack = require('webpack')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');


const HtmlWebpackPlugin = require('html-webpack-plugin');
const monacoWebpackPlugin = new MonacoWebpackPlugin();
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: './src/index.html',
    filename: 'index.html',
    inject: 'body',
    
})

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve('build'),
        filename: 'index_bundle.js',
        
    },

    devtool: 'cheap-module-source-map',

    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
            { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
     	    { test: /\.css$/, use: [ { loader: "style-loader" },  { loader: "css-loader" } ] },
	    { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' } 
	],
    },

    devServer: {
        proxy: {
            // proxy all requests starting with /api to jsonplaceholder
            '/api/**': {
                target: 'http://localhost:3030/',
                secure: false,
                changeOrigin: true
            }
        }
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
        HtmlWebpackPluginConfig, 
        // new MonacoWebpackPlugin()
    ],
    target: 'electron'


}
