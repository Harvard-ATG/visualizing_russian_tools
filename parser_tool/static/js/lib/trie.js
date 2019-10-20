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
            // - combining diuresis (U+0308) which is used for letter "ё" or "Yo" (https://en.wiktionary.org/wiki/%D1%91)
            // - combining breve (U+032E) which is used for leter "й" or "Yot" (https://en.wiktionary.org/wiki/%D0%B9)
            key = key.normalize("NFD").replace(/[\u0300-\u0307,\u0309-\u032D,\u032F-\u036f]/g, ""); 

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
                node.datalist = node.datalist || [];
                if(Array.isArray(data)) {
                    node.datalist = node.datalist.concat(data);
                } else {
                    node.datalist.push(data);
                }
            }
            return [d, node];
        }
        find(key) {
            let orig_key = key;
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