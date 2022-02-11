const path = require('path');

module.exports = {
  entry: './src/sketch.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  watch: true,
};