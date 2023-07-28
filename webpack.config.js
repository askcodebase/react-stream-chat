import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

const isDev = process.env.NODE_ENV !== 'production';
const DefinePlugin = webpack.DefinePlugin;

export default {
  entry: './src/main.tsx',
  mode: isDev ? 'development' : 'production',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    fallback: {
      crypto: false,
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  stats: {
    errorDetails: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: '/.css$/i',
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js)x?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'public' }],
    }),
    new DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
      'process.env.REACT_APP_FIREBASE_CONFIG': JSON.stringify(
        process.env.REACT_APP_FIREBASE_CONFIG || '{}',
      ),
      'process.env.REACT_APP_BACKEND_V2_GET_URL': JSON.stringify(
        process.env.REACT_APP_BACKEND_V2_GET_URL || '',
      ),
      'process.env.REACT_APP_BACKEND_V2_POST_URL': JSON.stringify(
        process.env.REACT_APP_BACKEND_V2_POST_URL || '',
      ),
    }),
  ].filter(Boolean),
  devServer: {
    static: {
      directory: path.join(process.cwd(), 'public'),
    },
    compress: true,
    hot: true,
    host: '0.0.0.0',
    port: process.env.PORT || 1234,
  },
};
