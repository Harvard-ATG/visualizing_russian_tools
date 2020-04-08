(function(global) {
    "use strict";

    class LemmaTrie {
        constructor() {
            this.root = {
                key: '',
                children: {}
            }
        }
        normalize(key) {
            key = key.toLowerCase(); // case insensitive

            // Strip all diacritics from keys EXCEPT for the following which have special significance:
            // - combining breve (U+0306) which is used for leter "й" or "Yot" (https://en.wiktionary.org/wiki/%D0%B9)
            // - combining diuresis (U+0308) which is used for letter "ё" or "Yo" (https://en.wiktionary.org/wiki/%D1%91)
            key = key.normalize("NFD").replace(/[\u0300-\u0305\u0307\u0309-\u036f]/g, "");

            return key;
        }
        insert(key, data) {
            key = this.normalize(key);

            let node = this.root;
            let c = key.slice(0,1);
            let d = 0;
            key = key.slice(1);

            while(typeof node.children[c] != "undefined" && c.length > 0) {
                node = node.children[c];
                c = key.slice(0,1);
                key = key.slice(1);
                d += 1;
            }

            while(c.length > 0) {
                node.children[c] = {key: c, children: {}};
                node = node.children[c];
                c = key.slice(0,1);
                key = key.slice(1);
                d += 1;
            }
            node.$ = (key.length == 0 ? 1 : 0);

            if(typeof data !== "undefined") {
                node.value = node.value || [];
                if(Array.isArray(data)) {
                    node.value = node.value.concat(data);
                } else {
                    node.value.push(data);
                }
            }
            return [d, node];
        }
        find(key) {
            if(typeof key !== "string") {
                return [-1, null];
            }
            key = this.normalize(key);

            let node = this.root;
            let c = key.slice(0,1);
            let d = 0;
            key = key.slice(1);
            while(typeof node.children[c] != "undefined" && c.length > 0) {
                node = node.children[c];
                c = key.slice(0,1);
                key = key.slice(1);
                d += 1;
            }

            let found = (node.$ === 1 && key.length === 0);
            if(found) {
                return [d, node];
            }
            return [-1, null];
        }
    }

    // Exports
    global.app = global.app || {};
    global.app.LemmaTrie = LemmaTrie;

})(window);
