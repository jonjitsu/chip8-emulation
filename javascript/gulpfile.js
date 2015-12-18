var gulp = require('gulp'),
    gutil = require('gulp-util'),
    // notify = require('gulp-notify'),
    notifier = require('node-notifier'),
    // notify = function(msg) { notifier.notify({title:'test', message:msg})},
    notifierReporter = require('mocha-notifier-reporter'),
    mocha = require('gulp-mocha'),
    webpack = require('webpack'),
    WebpackDevServer = require('webpack-dev-server')
;


gulp.task('test-node', function() {
    return gulp
        .src(['test/unit/*.test.js', 'test/unit/*.test-node.js'], {read: false})
        .pipe(mocha({
            // reporter: 'spec'
            reporter: notifierReporter.decorate('spec')
        }))
        .once('error', function() {
            notifier.notify({
                title: 'test-node error',
                message: 'Error in code caused mocha to crash',
                urgency: 'critical',
                time: 2
            });
        });
});

gulp.task('watch-test-node', function() {
    gulp.watch(
        ['src/**', 'test/unit/*.test.js', 'test/unit/*.test-node.js'],
        ['test-node']
    );
});

gulp.task('webpack-test-browser', function(callback) {
    var config = require('./webpack.config.test.js');

    webpack(config, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            colors: true
        }));
        callback(); 
    });
});

gulp.task('watch-test-browser', function() {
    var config = require('./webpack.config.test.js'),
        compiler = webpack(config),
        server = new WebpackDevServer(compiler, config['devServer']);

    server.listen(8080, 'localhost', function(err) {
		    if(err) throw new gutil.PluginError("webpack-dev-server", err);
		    gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
    });
});

gulp.task('livereload-app', function() {
    var config = require('./webpack.config.dev.js'),
        compiler = webpack(config),
        server = new WebpackDevServer(compiler, config['devServer']);

    server.listen(8081, 'localhost', function(err) {
		    if(err) throw new gutil.PluginError("webpack-dev-server", err);
		    gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");
    });
});

gulp.task('devmode', ['watch-test-node', 'watch-test-browser', 'livereload-app']);
