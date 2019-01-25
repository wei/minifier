require('dotenv').config();
const childProcess = require('child_process');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*', 'main-bower-files'],
  replaceString: /\bgulp[-.]/,
});
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const swPrecache = require('sw-precache');

const PORT = process.env.PORT || 3000;
const HTTPMINIFIER_VERSION = process.env.HTTPMINIFIER_VERSION;

const isProd = process.env.NODE_ENV === 'production';
const outputRoot = isProd ? './dist' : './public';

const uglifyConfig = {
  compress: {
    drop_console: true,
  },
};

console.log(`NODE_ENV=${process.env.NODE_ENV}`);

gulp.task('clean-output-root', () => {
  return gulp.src(`${outputRoot}`, {
    read: false,
    allowEmpty: true,
  })
    .pipe(plugins.clean());
});

gulp.task('copy-assets', () => {
  return gulp.src('./src/assets/**/*')
    .pipe(gulp.dest(`${outputRoot}/`));
});

gulp.task('js', () => {
  return browserify({
    debug: true,
    entries: './src/js/index.js',
  })
    .transform(babelify.configure({
      presets: ['@babel/env'],
      ignore: ['bower_components', 'node_modules'],
    }))
    .bundle()
    .on('error', (err) => {
      console.log(`Error : ${err.message}`);
    })
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(plugins.if(isProd, plugins.uglify(uglifyConfig)))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(`${outputRoot}/js`));
});

gulp.task('less', () => {
  return gulp.src('./src/less/index.less')
    .pipe(plugins.less({
      paths: ['node_modules', 'bower_components'],
    }))
    .pipe(plugins.replace(/(fontello\.(?:eot|woff2?|ttf|svg))\?[\d]+/g, '$1'))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.autoprefixer({
      browsers: ['last 2 versions'],
    }))
    .pipe(plugins.if(isProd, plugins.cleanCss()))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(`${outputRoot}/css`));
});

gulp.task('pug', () => {
  const data = {
    __HASH: '',
    __BRANCH: '',
    __BUILD_DATE: new Date().toISOString(),
    __ENV: process.env,
  };
  try {
    data.__HASH = (process.env.COMMIT_REF || '').substring(0, 7)
      || childProcess.execSync('git rev-parse --short HEAD').toString().trim() || '';
    data.__BRANCH = process.env.BRANCH
      || childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || '';
  } catch (e) {
    console.error(e);
  }

  return gulp.src('src/pug/*.pug')
    .pipe(plugins.pug({
      data,
      pretty: !isProd,
    }))
    .pipe(plugins.if(isProd, plugins.htmlmin(require('./minify-config.json'))))  // eslint-disable-line
    .pipe(gulp.dest(`${outputRoot}/`));
});

gulp.task('download-script', () => {
  return plugins.downloadStream([
    `https://raw.githubusercontent.com/kangax/html-minifier/${HTTPMINIFIER_VERSION ? `v${HTTPMINIFIER_VERSION}` : 'gh-pages'}/dist/htmlminifier.min.js`,
  ])
    .pipe(gulp.dest('./src/assets/'));
});

gulp.task('fonts', () => {
  return gulp.src(['./src/fonts/fontello/font/fontello.*'])
    .pipe(gulp.dest(`${outputRoot}/font/`));
});

gulp.task('service-worker', () => {
  return swPrecache.write(`${outputRoot}/service-worker.js`, {
    staticFileGlobs: [`${outputRoot}/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff,woff2}`],
    stripPrefix: outputRoot,
  }, () => {
    gulp.src(`${outputRoot}/service-worker.js`)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.babel())
      .pipe(plugins.if(isProd, plugins.uglify(uglifyConfig)))
      .pipe(plugins.sourcemaps.write('.'))
      .pipe(gulp.dest(`${outputRoot}/`));
  });
});

gulp.task('web-worker', () => {
  return gulp.src('./src/web-worker.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .pipe(plugins.if(isProd, plugins.uglify(uglifyConfig)))
    .pipe(plugins.sourcemaps.init())
    .pipe(gulp.dest(`${outputRoot}/`));
});

gulp.task('webserver', () => {
  return gulp.src(`${outputRoot}`)
    .pipe(plugins.webserver({
      port: PORT,
    }));
});

gulp.task('deploy', () => {
  return gulp.src('./dist/**/*')
    .pipe(plugins.ghPages());
});

gulp.task('build', gulp.series(
  gulp.parallel('clean-output-root', 'download-script'),
  gulp.parallel('copy-assets', 'fonts', 'js', 'less', 'web-worker'),
  gulp.parallel('pug'),
  gulp.parallel('service-worker')));

gulp.task('watch', gulp.series(() => {
  function runner() {
    return () => gulp.series(...arguments)(); // eslint-disable-line prefer-rest-params
  }

  plugins.watch(['./src/**/*.js'], {
    read: false,
  }, runner('js', 'service-worker'));

  plugins.watch(['./src/web-worker.js'], {
    read: false,
  }, runner('web-worker'));

  plugins.watch(['./src/**/*.less', './src/**/*.css'], {
    read: false,
  }, runner('less', 'service-worker'));

  plugins.watch(['./src/**/*.pug'], {
    read: false,
  }, runner('pug', 'service-worker'));
}), 'webserver');

gulp.task('default', gulp.parallel('build'));
