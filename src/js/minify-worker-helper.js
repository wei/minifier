const defaultConfig = {
  caseSensitive: false,
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: false,
  collapseWhitespace: true,
  conservativeCollapse: false,
  decodeEntities: true,
  html5: true,
  includeAutoGeneratedTags: false,
  keepClosingSlash: false,
  minifyCSS: true,
  minifyJS: true,
  preserveLineBreaks: false,
  preventAttributesEscaping: false,
  processConditionalComments: true,
  processScripts: ['text/html'],
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeEmptyElements: false,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeTagWhitespace: true,
  sortAttributes: true,
  sortClassName: true,
  trimCustomFragments: true,
  useShortDoctype: true,
};

module.exports = (function () {
  function MinifyHelper() {}

  MinifyHelper.webWorkerSupported = !!window.Worker;

  MinifyHelper.config = Object.assign({}, defaultConfig);

  MinifyHelper.setConfig = (newConfig) => {
    if (typeof newConfig === 'object') {
      MinifyHelper.config = Object.assign({}, defaultConfig, newConfig);
      try {
        window.localStorage.setItem('html-minifier-config', JSON.stringify(MinifyHelper.config));
      } catch (_) {
        // Ignore localStorage Errors
      }
    }

    return MinifyHelper.config;
  };

  MinifyHelper.load = () => {
    if (!window.Minify) {
      return console.error('html-minifier not loaded.');
    }

    try {
      const lsConfigJSON = window.localStorage.getItem('html-minifier-config');
      if (lsConfigJSON) {
        MinifyHelper.setConfig(JSON.parse(lsConfigJSON));
      }
    } catch (_) {
      // Ignore localStorage Errors
    }

    if (MinifyHelper.webWorkerSupported) {
      MinifyHelper.webWorker = new Worker('/web-worker.js');
      MinifyHelper.webWorker.onmessage = function () {
        MinifyHelper.workerMinify = function (input, config, callback, errorCallback) {
          console.log('In MinifyHelper.workerMinify');

          MinifyHelper.webWorker.onmessage = function (event) {
            const data = event.data;
            if (data.error) {
              errorCallback(new Error(data.error));
            } else {
              callback(data);
            }
          };
          MinifyHelper.webWorker.postMessage({
            input, config,
          });
        };
      };
      return true;
    }
    return false;
  };

  MinifyHelper.minify = (type = 'html', input = '', config = {}, callback = () => {}, errorCallback = () => {}) => {
    const minifyRequest = { input, config };
    let callbackOverride = callback;

    switch (type) {
      case 'js':
        minifyRequest.input = `<script>${input}</script>`;
        minifyRequest.config = Object.assign({}, MinifyHelper.config, { minifyJS: config || true });
        callbackOverride = (data = '') => {
          callback(data.replace(/^<script>/, '').replace(/<\/script>$/, ''));
        };
        break;
      case 'css':
        minifyRequest.input = `<style>${input}</style>`;
        minifyRequest.config = Object.assign({}, MinifyHelper.config, { minifyCSS: config || true });
        callbackOverride = (data = '') => {
          callback(data.replace(/^<style>/, '').replace(/<\/style>$/, ''));
        };
        break;
      case 'html':
      default:
        minifyRequest.config = Object.assign({}, MinifyHelper.config, config);
        break;
    }

    (MinifyHelper.workerMinify || MinifyHelper.localMinify)(minifyRequest.input, minifyRequest.config,
      callbackOverride, errorCallback);
  };

  MinifyHelper.minifyJS = (input, config, callback, errorCallback) => {
    MinifyHelper.minify('js', input, config, callback, errorCallback);
  };

  MinifyHelper.minifyCSS = (input, config, callback, errorCallback) => {
    MinifyHelper.minify('css', input, config, callback, errorCallback);
  };

  MinifyHelper.minifyHTML = (input, config, callback, errorCallback) => {
    MinifyHelper.minify('html', input, config, callback, errorCallback);
  };

  MinifyHelper.localMinify = (input, config, callback, errorCallback) => {
    console.log('In MinifyHelper.localMinify');

    if (!window.Minify) {
      return errorCallback(new Error('html-minifier not loaded.'));
    }

    const log = function (msg) { console.log(msg); };

    try {
      return callback(window.Minify(input, Object.assign({}, config, { log })));
    } catch (err) {
      return errorCallback(err);
    }
  };

  return MinifyHelper;
}());
