const path = require("path");
const webpack = require("webpack");

module.exports = {
  devtool: 'source-map',
  entry: {
    generic: "./static/react/src/generic.js",
  },
  output: {
    path: path.resolve(__dirname, "./static/react/static"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Improved regex for JS/JSX
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        // REMOVED exclude: /node_modules/ here
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".css"], // Helps Webpack find files without extensions
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
      },
    }),
  ],
};