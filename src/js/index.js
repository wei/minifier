import CodeMirror from 'codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import Clipboard from 'clipboard/dist/clipboard.min';
import FileSaver from 'file-saver';

import SWHelper from './service-worker-helper';
import MinifyHelper from './minify-worker-helper';
import { debounce } from './helper';

SWHelper.load();
MinifyHelper.load();

let currentType = null;

const TYPE_TO_MODE = {
  html: 'htmlmixed',
  js: 'javascript',
  css: 'css',
  '': 'null',
};

const codeWrapperContainer = document.getElementById('code-wrapper-container');
let droppedFileName = null;
const outputFileName = document.getElementById('output-filename');
const selectionButtons = {
  js: document.getElementById('select-js'),
  css: document.getElementById('select-css'),
  html: document.getElementById('select-html'),
};
const minifyButtons = {
  js: document.getElementById('minify-js'),
  css: document.getElementById('minify-css'),
  html: document.getElementById('minify-html'),
};

const inputCM = CodeMirror.fromTextArea(document.getElementById('input-code'), {
  lineNumbers: true,
  theme: 'neo',
  autofocus: true,
  dragDrop: true,
  allowDropFileTypes: ['text/javascript', 'text/css', 'text/html'],
});

const outputCM = CodeMirror.fromTextArea(document.getElementById('output-code'), {
  lineNumbers: true,
  lineWrapping: true,
  theme: 'neo',
  readOnly: true,
});

const runMinify = debounce((type) => {
  const input = inputCM.getDoc().getValue();
  if (type) {
    try {
      window.localStorage.setItem('minifier.input', input);
    } catch (_) {
      // Ignore localStorage errors
    }
    if (input.trim() === '') {
      outputCM.getDoc().setValue('');
    } else {
      MinifyHelper.minify(type, input, {}, (output) => {
        outputCM.setOption('mode', TYPE_TO_MODE[type]);
        outputCM.getDoc().setValue(output);
      }, (err) => {
        outputCM.setOption('mode', TYPE_TO_MODE['']);
        outputCM.getDoc().setValue(err.message);
      });
    }
  }
}, 400);

const selectLanguage = (type = '') => {
  outputFileName.placeholder = `${droppedFileName || 'edit-me'}${type ? `.${type}` : ''}`;
  if (currentType !== type) {
    currentType = type;
    try {
      window.localStorage.setItem('minifier.type', currentType);
    } catch (_) {
      // Ignore localStorage errors
    }
    codeWrapperContainer.className = type;
    const mode = TYPE_TO_MODE[type];
    inputCM.setOption('mode', mode);
    outputCM.setOption('mode', mode);
    runMinify(type);
  }
};

['js', 'css', 'html'].forEach((lang) => {
  selectionButtons[lang].addEventListener('click', (e) => {
    e.preventDefault();
    selectLanguage(lang);
    inputCM.focus();
  });
  minifyButtons[lang].addEventListener('click', (e) => {
    e.preventDefault();
    selectLanguage(lang);
  });
});

document.getElementById('reset').addEventListener('click', (e) => {
  e.preventDefault();
  inputCM.getDoc().setValue('');
  outputCM.getDoc().setValue('');
  droppedFileName = null;
  selectLanguage('');
});

// eslint-disable-next-line
new Clipboard('#copy', {
  text() {
    return outputCM.getDoc().getValue();
  },
});
document.getElementById('download').addEventListener('click', (e) => {
  e.preventDefault();
  FileSaver.saveAs(
    new File([outputCM.getDoc().getValue()], outputFileName.value || outputFileName.placeholder,
      { type: 'text/plain;charset=utf-8' }));
});

inputCM.on('changes', (doc) => {
  if (!doc.getValue()) {
    outputCM.getDoc().setValue('');
    droppedFileName = null;
    selectLanguage('');
    return;
  }

  if (currentType) {
    selectLanguage(currentType);
    runMinify(currentType);
  } else {
    // Detect Type
    const detectedType = ((text) => {
      if (text.match(/^\s*</)) return 'html';
      try { Function(text); return 'js'; } catch (_) { /* Do Nothing */ } // eslint-disable-line no-new-func
      if (text.match(/^(?:\s*\S+\s*{[^}]*})+/)) return 'css';
      return 'html';
    })(doc.getValue());
    selectLanguage(detectedType);
    runMinify(detectedType);
  }
});

inputCM.on('paste', () => {
  currentType = null;
  droppedFileName = null;
});

inputCM.on('drop', (cm, dragEvent) => {
  try {
    const fileName = dragEvent.dataTransfer.files[0].name;
    const matches = fileName.match(/\.(js|css|html)$/);
    if (matches && matches[1]) {
      droppedFileName = fileName.replace(`.${matches[1]}`, '');
      selectLanguage(matches[1]);
      cm.getDoc().setValue(''); // Clear input field for dropped file.
    } else {
      alert('File type not supported.'); // eslint-disable-line no-alert
      dragEvent.preventDefault();
    }
  } catch (_) {
    // Ignore fetch filename errors
  }
});

// Check Local Storage on first load
try {
  const inputText = window.localStorage.getItem('minifier.input');
  const type = window.localStorage.getItem('minifier.type');
  if (inputText && inputText.trim() && type) {
    inputCM.getDoc().setValue(inputText);
    selectLanguage(type);
  }
} catch (_) {
  // Ignore localStorage errors
}
