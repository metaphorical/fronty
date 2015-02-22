var gulp = require('gulp');
var jshintConfig = require('./package').jshintConfig;
var stylish = require('jshint-stylish');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var minify = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');
var svgspritesheet = require('gulp-svg-spritesheet');
var svgo = require('gulp-svgo');
var svg2png = require('gulp-svg2png');
var imagemin = require('gulp-imagemin');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');

gulp.task('css', function () {
    return gulp.src('sass/style.scss')
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer('last 2 version', '> 1%'))
        .pipe(gulp.dest('assets/css/'));
});

gulp.task('iconfont', function () {
    gulp.src(['assets/img/iconfont/*.svg'])
        .pipe(iconfont({ fontName: 'iconfont', normalize: true }))
        .on('codepoints', function (codepoints, options) {
            gulp.src('sass/templates/_iconfont.scss')
                .pipe(consolidate('lodash', {
                    icons: codepoints,
                    fontName: 'iconfont',
                    fontPath: '../fonts/'
                }))
                .pipe(gulp.dest('sass/core/'));
        })
        .pipe(gulp.dest('assets/fonts/'));
});

gulp.task('svgSprite', function () {
    return gulp.src('assets/img/sprites/*')
        .pipe(plumber())
        .pipe(svgo())
        .pipe(svgspritesheet({
            padding: 5,
            positioning: 'packed',
            templateSrc: 'sass/templates/_sprite-template.scss',
            templateDest: 'sass/core/_sprite-maps.scss'
        }))
        .pipe(gulp.dest('assets/img/sprite.svg'));
});

gulp.task('pngSprite', ['svgSprite'], function () {
    return gulp.src('assets/img/sprite.svg')
        .pipe(svg2png())
        .pipe(gulp.dest('assets/img/'));
});

gulp.task('sprite', ['pngSprite']);

gulp.task('jshint', function () {
    return gulp.src(['assets/js/**/*.js', '!assets/js/build/*.js'])
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter(stylish));
});

gulp.task('browserify', ['jshint'], function () {
    var browserified = transform(function (filename) {
        var b = browserify(filename);
        return b.bundle();
    });

    return gulp.src('assets/js/pages/*.js')
        .pipe(browserified)
        .pipe(gulp.dest('assets/js/build/'));
});

gulp.task('images', function () {
    return gulp.src('assets/img/**/*')
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest('assets/img'));
});

gulp.task('minify', ['sprite', 'css'], function () {
    return gulp.src('assets/css/*.css')
        .pipe(minify({ keepSpecialComments: 0 }))
        .pipe(gulp.dest('assets/css/'));
});

gulp.task('uglify', ['browserify'], function () {
    return gulp.src('assets/js/build/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('assets/js/build/'));
});

gulp.task('watch', ['css', 'browserify'], function () {
    gulp.watch('assets/img/sprites/*', ['sprite']);
    gulp.watch('sass/**/*.scss', ['css']);
    gulp.watch(['assets/js/**/*.js', '!assets/js/build/*.js'], ['jshint', 'browserify']);
});

gulp.task('default', ['css', 'jshint', 'browserify']);
gulp.task('build', ['minify', 'uglify', 'images']);
