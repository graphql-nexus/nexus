"use strict";

/**
 * @type {import('webpack').WebpackOptions}
 */
module.exports = {
  mode: "development",
  entry: {
    playground: "./playground/index.tsx",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/static/",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
  externals: {
    fs: "function() {}",
    clipboard: "ClipboardJS",
    codemirror: "CodeMirror",
    react: "React",
    "react-dom": "ReactDOM",
  },
};
