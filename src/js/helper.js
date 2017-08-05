module.exports = {
  debounce: function debounce(callback, wait, context = this) {
    let timeout = null;
    let callbackArgs = null;

    const later = () => callback.apply(context, callbackArgs);

    return function () {
      callbackArgs = arguments;  //eslint-disable-line
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};
