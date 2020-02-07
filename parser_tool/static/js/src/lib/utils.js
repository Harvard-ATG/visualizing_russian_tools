(function(global) {
    "use strict";

    const debounce = (fn, time) => {
        let timeout;
        return function() {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
    }

    // Exports
    global.app = global.app || {};
    global.app.utils = { debounce };
})(window);
