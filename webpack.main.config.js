module.exports = {
    entry: './src/main.js',
    externals: {
        'utp-native': 'commonjs2 utp-native',
    },
    // Put your normal webpack config below here
    module: {
	rules: require('./webpack.rules'),
    },
};
