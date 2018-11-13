"use strict";

/**
 * @type {import('webpack').WebpackOptions}
 */
module.exports = {
  mode: "none",
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
    fs: "{ writeFile(fileName, contents) { console.log(contents); } }",
    clipboard: "ClipboardJS",
    codemirror: "CodeMirror",
    react: "React",
    "react-dom": "ReactDOM",
  },
};
