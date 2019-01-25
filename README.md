Minifier for JavaScript, CSS and HTML
=======================================
Client-side offline-first JavaScript/CSS/HTML minifier. _Visit: https://minifier.app_


## Description

This tool implements [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) and [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API). Just load it once and it will available for offline use.

Uses [html-minifier](https://github.com/kangax/html-minifier) which comes with [uglify-js](https://github.com/mishoo/UglifyJS2) and [clean-css](https://github.com/jakubpawlowicz/clean-css). See [default configurations](minify-config.json).


## Installation
```bash
$ export HTTPMINIFIER_VERSION=3.5.21  # Optional, Default to latest

$ npm i && npm run build
```

Start development server:
```bash
$ npm run watch
```


## Questions?

Please [open an issue](https://github.com/wei/minifier/issues) or [email me](mailto:&#103;&#105;&#116;&#104;&#117;&#098;&#064;&#119;&#101;&#105;&#115;&#112;&#111;&#116;&#046;&#099;&#111;&#109;) with any issues, feedback, or suggestions.


## Author
[**Wei He**](https://whe.me)  [_&#103;&#105;&#116;&#104;&#117;&#098;&#064;&#119;&#101;&#105;&#115;&#112;&#111;&#116;&#046;&#099;&#111;&#109;_](mailto:&#103;&#105;&#116;&#104;&#117;&#098;&#064;&#119;&#101;&#105;&#115;&#112;&#111;&#116;&#046;&#099;&#111;&#109;)


## Donations

If you find this tool helpful, please consider supporting me by [sending me a coffee](https://o.whe.me/supportwei).

I am committed to delivering quality tools and keep them ad-free. Thank you for your support!


## License
[MIT](LICENSE)
