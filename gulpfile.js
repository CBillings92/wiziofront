//include gulp
var gulp = require("gulp");

// include plug-ins
var jshint = require("gulp-jshint");
var concat = require("gulp-concat");
var stripDebug = require("gulp-strip-debug");
var uglify = require("gulp-uglify");
var autoprefix = require("gulp-autoprefixer");
var minifyCSS = require("gulp-minify-css");
var sass = require("gulp-sass");
var plugins = require("gulp-load-plugins")({
  pattern: ["gulp-*", "gulp.*", "main-bower-files"],
  replaceString: /\bgulp[\-.]/
});
var lib = require("bower-files")();
var gutil = require("gulp-util");
var mainBowerFiles = require("main-bower-files");
var resourceDest = "/public";
// var append = require("gulp-append");

// JS hint task
gulp.task("jshint", function() {
  gulp
    .src("./public/app/modules/**/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"));
});

// JS concat, strip debugging and minify
gulp.task("scripts", function() {
  gulp
    .src(["./public/app/**/*.js"])
    //   .pipe(stripDebug())
    .pipe(concat("scripts.js"))
    .pipe(
      uglify({
        file: "scripts.min.js",
        outSourceMap: true
      })
    )
    .on("error", gutil.log)
    .pipe(gulp.dest("./public/build"));
});

// var npmDist = require("gulp-npm-dist");
// var rename = require("gulp-rename");

// Copy dependencies to ./public/libs/
gulp.task("copy:libs", function() {
  gulp
    .src(npmDist(), { base: "./node_modules/" })
    .pipe(
      rename(function(path) {
        path.dirname = path.dirname
          .replace(/\/dist/, "")
          .replace(/\\dist/, "")
          .replace(/\/src/, "")
          .replace(/\\src/, "");
      })
    )
    .pipe(gulp.dest("./public/libs"));
});

gulp.task("dependjanda", function() {
  gulp
    .src(lib.ext("js").match(["!**/three.**js", "angular**/**", "jquery/**"]).files)
    .pipe(concat("lib2.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./public/build"));
});

gulp.task("dependencies", function() {
  gulp
    .src(lib.ext("js").match(["!**/three.**js"]).files)
    .pipe(concat("lib.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./public/build"));
});

gulp.task("sass", function() {
  return gulp
    .src("./public/stylesheets/sass/import.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./public/stylesheets/compiledsass/"));
});
// CSS concat, auto-prefix and minify
gulp.task("styles", ["sass"], function(cb) {
  return gulp
    .src(["./public/stylesheets/compiledsass/import.css"])
    .pipe(autoprefix("last 2 versions"))
    .pipe(minifyCSS())
    .pipe(gulp.dest("./public/build/"));
});

gulp.task("default", ["jshint", "scripts", "sass", "styles"], function() {
  gulp.watch(
    ["./public/stylesheets/*.scss", "./public/stylesheets/sass/*.scss", "./public/stylesheets/sass/**/*.scss"],
    function() {
      gulp.run("styles");
    }
  );
  gulp.watch("./public/app/**/*.js", function() {
    gulp.run("jshint", "scripts");
  });
});
