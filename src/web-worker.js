/* eslint-env worker */

(function () {
  importScripts('htmlminifier.min.js');
  const Minify = require('html-minifier').minify;  // eslint-disable-line
  addEventListener('message', (event) => {
    if (event.data.pong) {
      return;
    }

    let loggedError = false;
    const log = function (msg) {
      console.log(msg);
      if (msg instanceof Error) {
        loggedError = true;
        const line = typeof msg.line === 'number' ? `Line ${msg.line}:${msg.col}\n  ` : '';
        postMessage({ error: line + msg.message });
      }
    };

    try {
      const output = Minify(event.data.input, Object.assign({}, event.data.config, { log }));
      if (!loggedError) {
        postMessage(output);
      }
    } catch (err) {
      const line = typeof err.line === 'number' ? `Line ${err.line}:${err.col}\n  ` : '';
      postMessage({ error: line + err.message });
    }
  });

  postMessage({ ping: true });
}());
