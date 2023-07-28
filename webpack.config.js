import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

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
