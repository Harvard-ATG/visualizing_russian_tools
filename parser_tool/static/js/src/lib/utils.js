(function(global) {
    "use strict";

    const debounce = (fn, time) => {
        let timeout;
        return function() {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
    };

    const htmlEntities = (str) => {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    const unique = (arr) => {
      const onlyUnique = (value, index, self) => { 
        return self.indexOf(value) === index;
      };
      return arr.filter(onlyUnique);
    };

    const logEvent = (fn) => {
      return (e) => {
        console.log("event: ", e.type, e.target, e);
        return fn(e);
      };
    };

    const scrollTo = (selector) => {
      const scrollTop = $(selector).offset().top;
      $([document.documentElement, document.body]).animate({scrollTop: scrollTop}, 1000);
    };

    const shuffle = (a) => {
      const cloneA = [...a];
      let j, x;
      for (let idx = cloneA.length - 1; idx > 0; idx--) {
        j = Math.floor(Math.random() * (idx + 1));
        // swap - could use destructure [a[idx], a[j]] = [a[j], a[idx]]
        x = cloneA[idx];
        cloneA[idx] = cloneA[j];
        cloneA[j] = x;
      }
      return cloneA;
    };

    // Exports
    global.app = global.app || {};
    global.app.utils = { debounce, htmlEntities, unique, logEvent, scrollTo, shuffle };
})(window);
