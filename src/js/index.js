import CodeMirror from 'codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import Clipboard from 'clipboard';
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
      window.localStorage.setItem('compressor.input', input);
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
        outputCM.setOption('mode', 'null');
        outputCM.getDoc().setValue(err.message);
      });
    }
  }
}, 400);

const codeWrapperContainer = document.getElementById('code-wrapper-container');
const outputFileName = document.getElementById('output-filename');

const selectLanguage = (type = '') => {
  if (currentType !== type) {
    currentType = type;
    try {
      window.localStorage.setItem('compressor.type', currentType);
    } catch (_) {
      // Ignore localStorage errors
    }
    codeWrapperContainer.className = type;
    outputFileName.placeholder = `edit-me${type ? `.${type}` : ''}`;
    const mode = TYPE_TO_MODE[type];
    inputCM.setOption('mode', mode);
    outputCM.setOption('mode', mode);
    runMinify(type);
  }
};

const minifyButtons = {
  js: document.getElementById('minify-js'),
  css: document.getElementById('minify-css'),
  html: document.getElementById('minify-html'),
};
const selectionButtons = {
  js: document.getElementById('select-js'),
  css: document.getElementById('select-css'),
  html: document.getElementById('select-html'),
};

Object.keys(minifyButtons).forEach((lang) => {
  minifyButtons[lang].addEventListener('click', (e) => {
    e.preventDefault();
    selectLanguage(lang);
  });
});

Object.keys(selectionButtons).forEach((lang) => {
  selectionButtons[lang].addEventListener('click', (e) => {
    e.preventDefault();
    selectLanguage(lang);
    inputCM.focus();
  });
});

document.getElementById('reset').addEventListener('click', (e) => {
  e.preventDefault();
  inputCM.getDoc().setValue('');
  outputCM.getDoc().setValue('');
  selectLanguage('');
});

//eslint-disable-next-line
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


// Check Local Storage
try {
  const inputText = window.localStorage.getItem('compressor.input');
  const type = window.localStorage.getItem('compressor.type');
  if (inputText && inputText.trim() && type) {
    inputCM.getDoc().setValue(inputText);
    selectLanguage(type);
  }
} catch (_) {
  // Ignore localStorage errors
}

inputCM.on('changes', () => {
  if (currentType) {
    runMinify(currentType);
  }
});

inputCM.on('drop', (cm, dragEvent) => {
  try {
    const matches = dragEvent.dataTransfer.files[0].name.match(/\.(js|css|html)$/);
    if (matches && matches[1]) {
      selectLanguage(matches[1]);
      cm.getDoc().setValue('');
    }
  } catch (_) {
    // Ignore fetch filename errors
  }
});
