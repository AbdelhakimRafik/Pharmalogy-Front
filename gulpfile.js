/**
 * @author 		Abdelhakim RAFIK
 * @version 	v1.0.1
 * @license 	MIT License
 * @copyright 	Copyright (c) 2021 Abdelhakim RAFIK
 * @date 		Mar 2021
 */

var gulp 	= require('gulp'),
	coffee 	= require('gulp-coffeescript'),
	pug 	= require('gulp-pug'),
	sass 	= require('gulp-sass');
	// del 	= require('del');
	sass.compiler = require('node-sass');

/**
 * Compile coffeeScript files under source directory
*/
function coffeeTask(cb) {
	gulp.src('./src/**/*.coffee')
		.pipe(coffee({bare: true}))
		.pipe(gulp.dest('./dist/'));
	cb();
}

/**
 * Compile pug files under source directory
 */
function pugTask(cb) {
	gulp.src('./src/views/**/[!_]*.pug')
		.pipe(pug({
			pretty: true
		}))
		.pipe(gulp.dest('./dist/'));
	cb();
}

/**
 * Compile sass files under source directory
 */
function sassTask(cb) {
	gulp.src('./src/assets/sass/**/*.sass')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('./dist/assets/css/'));
	cb();
}

/**
 * Clean project build files
 */
// function clean(cb) {
// 	(async function() {
// 		await del(['./dist']);
// 	})();

// 	cb();
// }

/**
 * Watch modified files
 */
function watch() {
	gulp.watch('./src/**/*.coffee', coffeeTask);
	gulp.watch('./src/views/**/*.pug', pugTask);
	gulp.watch('./src/assets/sass/**/*.sass', sassTask);
}

var build = gulp.parallel([coffeeTask, pugTask, sassTask]);

exports.default = gulp.series(build, watch);
// exports.clean = clean;