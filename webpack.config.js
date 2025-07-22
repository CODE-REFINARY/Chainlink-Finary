const path = require("path");
const webpack = require("webpack");

module.exports = {
  devtool: 'source-map',
  entry: {
    generic: "./static/react/src/generic.js",   // Entry for generic.js
    chainlink: "./static/react/src/chainlink.js", // Entry for chainlink.js
  },
  output: {
    path: path.resolve(__dirname, "./static/react/static"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js|.jsx$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
      },
    }),
  ],
};
