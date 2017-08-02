import SWHelper from './service-worker-helper';
import MinifyHelper from './minify-worker-helper';

SWHelper.load();
MinifyHelper.load();

setTimeout(() => {
  MinifyHelper.minify('js', `var it,is,not,needed,please,remove,me;;;;;;;;;;;;;
    for (var links = document.links, i = 0, length = links.length; i < length; i++) {
      var link = links[i];
      link.classList.add(link.protocol.match(/^https:/) ? 'https-link' :
      link.protocol.match(/^http:/) ? 'http-link' : '');
      link.classList.add(
        link.hostname != window.location.hostname ?
        (link.target = '_blank') && 'external-link' : 'internal-link'
      );
      link.classList.add(link.children.length === 0 ? 'text-link' : 'not-text-link');
    }`, { toplevel: true }, (output) => {
      document.body.innerHTML = `<textarea>${output}</textarea>`;
    }, (err) => {
      document.body.innerHTML = `<textarea>${err}</textarea>`;
    });
}, 200);
