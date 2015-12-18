var WebpackErrorNotificationPlugin = require('webpack-error-notification');
//  webpack-dev-server 'mocha!./test/suite.js' --output-filename test/bundle.js --hot --content-base test/
module.exports = {
    context: __dirname,
    entry: "./src/emulator.js",
    // entry: [
    //     // "mocha!./test/unit/test-chip8.js",
    //     "mocha!./test/unit/utils.test.js",
    //     "mocha!./test/unit/utils.test-browser.js"
    // ],

    output: {
        path: "/",
        filename: "./public/bundle.js"
    },
    node: {
        fs: 'empty'
    },
    devtool: 'sourcemap',
    devServer: {
        contentBase: __dirname + '/public',
        host: 'localhost',
        port: 8081,
        publicPath: '/',
        outputPath: '/',
        filename: './public/bundle.js',
        hot: false,
        stats: {
            cached: false,
            cachedAssets: false,
            colors: {
                level: 1,
                hasBasic: true,
                has256: true,
                has16m: false
            }
        }
    }
};

function filesInDir(dir, prefix) {
    var g = require('glob');

    if( prefix===undefined ) prefix='';

    if( typeof dir==='string' ) dir = [dir];

    return dir.reduce(function(a, dir) {
        return a.concat(g.sync(dir));
    }, []).map(function(file) { return prefix + './' + file; });
}
