"use strict";

const gulp = require("gulp");
const del = require("del");
const sass = require("gulp-sass");
const sassLint = require('gulp-sass-lint');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const tsc = require("gulp-typescript");
const tsProject = tsc.createProject("tsconfig.json");
const tslint = require('gulp-tslint');
const runSequence = require('run-sequence');

// --------------------------------------------------------------
// PROJECT CONFIG

const buildPath = 'www';

const paths = {
	sass: ['src/**/*.scss' ],
  ts: [ 'src/**/*.ts' ],
  html: [ 'src/**/*.html' ]
};

const processors = [
  autoprefixer({
    browsers: [
      'ie >= 9',
      'ie_mob >= 10',
      'ff >= 30',
      'chrome >= 34',
      'safari >= 7',
      'opera >= 23',
      'ios >= 7',
      'android >= 4.4',
      'bb >= 10'
    ]
  }),
  mqpacker(),
  cssnano()
];

// --------------------------------------------------------------
// Remove build directory.

gulp.task('clean', (cb) => {
    return del([ buildPath ], cb);
});

gulp.task('build-clean', (cb) => {
  runSequence('clean',
              'build',
              cb);
});

// --------------------------------------------------------------
// Lint all custom Sass files.

gulp.task('sass-lint', () => {
  return gulp.src( paths.sass )
    .pipe(sassLint({ config: '.sass-lint.yml' }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

// --------------------------------------------------------------
// Lint all custom TypeScript files.

gulp.task('ts-lint', () => {
    return gulp.src( paths.ts )
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

// --------------------------------------------------------------
// Compile SASS sources and create sourcemaps in
// build directory.
// If have linter, include  ["sass-lint"] as 2nd parameter

gulp.task('sass', () => {
  return gulp.src( paths.sass )
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write(".", {sourceRoot: '/src'}))
    .pipe(gulp.dest( buildPath ));
});

// --------------------------------------------------------------
// Compile TypeScript sources and create sourcemaps in
// build directory.
// If have linter, include  ["ts-lint"] as 2nd parameter

gulp.task("typescript", () => {
    let tsResult = gulp.src( paths.ts )
        .pipe(sourcemaps.init())
        .pipe(tsc(tsProject));

    return tsResult.js
        .pipe(sourcemaps.write(".", {sourceRoot: '/src'}))
        .pipe(gulp.dest( buildPath ));
});

// --------------------------------------------------------------
// Copy all resources that are not TypeScript files into
// build directory.

gulp.task("html", () => {
    return gulp.src(["src/**/*", "!**/*.ts", "!**/*.scss", "!src/scss"])
        .pipe(gulp.dest( buildPath ));
});

// --------------------------------------------------------------
// Copy all required libraries into build directory.

gulp.task("libs", () => {
    return gulp.src([
            'core-js/client/shim.min.js',
            'systemjs/dist/system-polyfills.js',
            'systemjs/dist/system.src.js',
            'reflect-metadata/Reflect.js',
            'rxjs/**/*.js',
            'zone.js/dist/**',
            '@angular/**/bundles/**'
        ], {cwd: "node_modules/**"}) /* Glob required here. */
        .pipe(gulp.dest( buildPath + "/lib" ));
});

// --------------------------------------------------------------
// Watch for changes in TypeScript, HTML and CSS files.

gulp.task('watch', function () {
    gulp.watch([ paths.ts ], ['typescript']).on('change', function (e) {
        console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
    });

    gulp.watch([ paths.sass ], ['sass']).on('change', function (e) {
        console.log('SASS file ' + e.path + ' has been changed. Compiling.');
    });

    gulp.watch([ paths.html ] , ['html']).on('change', function (e) {
        console.log('Resource file ' + e.path + ' has been changed. Updating.');
    });
});

// --------------------------------------------------------------
// Build the project.

gulp.task("build", ['typescript', 'sass', 'html', 'libs'], () => {
    console.log("Building the project ...");
});
