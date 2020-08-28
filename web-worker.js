"use strict";

/* eslint-env worker */
(function () {
  importScripts('htmlminifier.min.js');

  var Minify = require('html-minifier').minify; // eslint-disable-line


  addEventListener('message', function (event) {
    if (event.data.pong) {
      return;
    }

    var loggedError = false;

    var log = function log(msg) {
      console.log(msg);

      if (msg instanceof Error) {
        loggedError = true;
        var line = typeof msg.line === 'number' ? "Line ".concat(msg.line, ":").concat(msg.col, "\n  ") : '';
        postMessage({
          error: line + msg.message
        });
      }
    };

    try {
      var output = Minify(event.data.input, Object.assign({}, event.data.config, {
        log: log
      }));

      if (!loggedError) {
        postMessage(output);
      }
    } catch (err) {
      var line = typeof err.line === 'number' ? "Line ".concat(err.line, ":").concat(err.col, "\n  ") : '';
      postMessage({
        error: line + err.message
      });
    }
  });
  postMessage({
    ping: true
  });
})();