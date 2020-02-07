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

    // Exports
    global.app = global.app || {};
    global.app.utils = { debounce, htmlEntities, unique, logEvent, scrollTo };
})(window);
