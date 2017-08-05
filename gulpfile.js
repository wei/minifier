require('dotenv').config();
const exec = require('sync-exec');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*', 'main-bower-files'],
  replaceString: /\bgulp[-.]/,
});
const swPrecache = require('sw-precache');

const PORT = process.env.PORT || 3000;

gulp.task('clean-js', () => gulp.src('./public/js', { read: false })
  .pipe(plugins.clean()));
gulp.task('js', ['clean-js'], () => gulp.src('./src/js/index.js')
  // .pipe(plugins.sourcemaps.init())
  .pipe(plugins.babel())
  .pipe(plugins.browserify({
    insertGlobals: true,
    debug: process.env.NODE_ENV !== 'production',
  }))
  // .pipe(plugins.sourcemaps.write('.'))
  .pipe(gulp.dest('./public/js')));

gulp.task('clean-css', () => gulp.src('./public/css', { read: false })
  .pipe(plugins.clean()));
gulp.task('less', ['clean-css'], () => gulp.src('./src/less/index.less')
  .pipe(plugins.less({
    paths: ['node_modules', 'bower_components'],
  }))
  .pipe(gulp.dest('./public/css')));

gulp.task('clean-html', () => gulp.src('./public/*.html', { read: false })
  .pipe(plugins.clean()));
gulp.task('pug', () => {
  const data = {
    __HASH: 'Not Available',
    __BUILD_DATE: new Date().toUTCString(),
  };
  try {
    data.GIT_HASH = exec('git rev-parse --short HEAD', 1000).stdout.replace('\n', '') || 'Not Available';
  } catch (e) { console.error(e); }

  return gulp.src('src/pug/*.pug')
    .pipe(plugins.pug({
      data,
      pretty: true,
    }))
    .pipe(gulp.dest('./public/'));
});

gulp.task('bower', () => gulp.src('./bower.json')
  .pipe(plugins.mainBowerFiles())
  .pipe(plugins.flatten())
  .pipe(gulp.dest('./public/lib/b')));
gulp.task('lib', ['bower'], () => plugins.download(
  [
    'https://cdnjs.cloudflare.com/ajax/libs/html-minifier/3.5.3/htmlminifier.min.js',
  ])
  .pipe(gulp.dest('./public/lib/d/')));

gulp.task('fonts', () => gulp.src(['./node_modules/font-awesome/fonts/fontawesome-webfont.*'])
  .pipe(gulp.dest('./public/fonts/')));

gulp.task('service-worker', (callback) => {
  const rootDir = './public';

  swPrecache.write(`${rootDir}/service-worker.js`, {
    staticFileGlobs: [`${rootDir}/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}`],
    stripPrefix: rootDir,
  }, callback);
});

gulp.task('web-worker', () => gulp.src('./src/web-worker.js')
  .pipe(plugins.babel())
  .pipe(gulp.dest('./public/')));

gulp.task('webserver', () => gulp.src('./public')
  .pipe(plugins.webserver({
    port: PORT,
  })));

gulp.task('deploy', () => gulp.src('./dist/**/*')
  .pipe(plugins.ghPages()));

gulp.task('default', ['build']);
gulp.task('build', (callback) => {
  plugins.sequence(
    ['lib', 'fonts'],
    ['js', 'less', 'web-worker'],
    'pug',
    'service-worker')(callback);
});

gulp.task('watch', () => {
  function runner() {
    return () => plugins.sequence(...arguments)(); // eslint-disable-line prefer-rest-params
  }

  plugins.watch(['./src/**/*.js'],
    { read: false }, runner('js', 'service-worker'));

  plugins.watch(['./src/web-worker.js'],
    { read: false }, runner('web-worker'));

  plugins.watch(['./src/**/*.less', './src/**/*.css'],
    { read: false }, runner('less', 'service-worker'));

  plugins.watch(['./src/**/*.pug'],
    { read: false }, runner('pug', 'service-worker'));

  gulp.start(['webserver']);
});
