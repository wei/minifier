/* eslint-env worker */

(function () {
  importScripts('lib/htmlminifier.min.js');
  const Minify = require('html-minifier').minify;  // eslint-disable-line
  addEventListener('message', (event) => {
    if (event.data.pong) {
      return;
    }

    const log = function (msg) { console.log(msg); };

    try {
      postMessage(Minify(event.data.input, Object.assign({}, event.data.config, { log })));
    } catch (err) {
      postMessage({ error: err.message });
    }
  });

  postMessage({ ping: true });
}());
