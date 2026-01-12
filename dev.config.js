import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';

export default {
	entry: ['./static/main.tsx', './static/styles/main.css', './static/game.ts'],
	mode: 'development',
	devtool: 'eval-source-map',
	watch: true,
	experiments: {
		topLevelAwait: true,
	},
	output: {
		filename: '[name].[contenthash].js',
		path: path.resolve('./dist/'),
	},
	module: {
		rules: [
			{
				test: /\.tsx?/,
				exclude: /node_modules/,
				use: {
					loader: 'swc-loader',
					options: {
						jsc: {
							parser: {
								syntax: 'typescript',
								tsx: true,
							},
							transform: {
								react: {
									runtime: 'automatic',
								},
							},
						},
					},
				},
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
				],
			},
			{
				test: /\.svg$/,
				type: 'asset/resource',
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	optimization: {
		splitChunks: {
			automaticNameDelimiter: '.',
			chunks: 'all',
			name: 'vendor',
		},
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		new HtmlWebpackPlugin({
			title: 'Fumines',
			filename: 'index.html',
			template: './static/index.html',
		}),
	],
};
