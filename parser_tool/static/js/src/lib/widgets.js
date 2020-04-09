(function(global) {
    "use strict";

    // Widget that renders a stress pattern abbreviation in a table form
    class StressPatternWidget {

        constructor({ stress_pattern_semu }) {
            // Stress pattern "SEMU" abbreviations:
            //    S = Stem Stress
            //    E = End Stress
            //    M = Moving Stress
            //    U = ?
            // In the 2 letter codes, the first letter represents the position of stress 
            // in the Singular cases and the second represents stress in the Plural cases.
            this.stress_pattern_semu = stress_pattern_semu;
        }

        // This function returns a 2-element array with the stress pattern for
        // singular and plural nouns, and further subdivided for each case (N,A,G,L,D,I).
        // For each case, the value is 0 if it is stem stressed or 1 if it is end stressed.
        lookup(stress_pattern_semu) {
            const table = {
                UM: [
                    {N:1,A:0,G:1,L:1,D:1,I:1},
                    {N:0,A:0,G:1,L:1,D:1,I:1}
                ],
                US: [
                    {N:1,A:0,G:1,L:1,D:1,I:1},
                    {N:0,A:0,G:0,L:0,D:0,I:0}
                ],
                EM: [
                    {N:1,A:1,G:1,L:1,D:1,I:1},
                    {N:0,A:0,G:1,L:1,D:1,I:1}
                ],
                SM: [
                    {N:0,A:0,G:0,L:0,D:0,I:0},
                    {N:0,A:0,G:1,L:1,D:1,I:1}
                ],
                ES: [
                    {N:1,A:1,G:1,L:1,D:1,I:1},
                    {N:0,A:0,G:0,L:0,D:0,I:0}
                ],
                SE: [
                    {N:0,A:0,G:0,L:0,D:0,I:0},
                    {N:1,A:1,G:1,L:1,D:1,I:1}
                ],
                SS: [
                    {N:0,A:0,G:0,L:0,D:0,I:0},
                    {N:0,A:0,G:0,L:0,D:0,I:0}
                ],
                EE: [
                    {N:1,A:1,G:1,L:1,D:1,I:1},
                    {N:1,A:1,G:1,L:1,D:1,I:1}
                ]
            };
            return table[stress_pattern_semu];
        }

        render() {
            const result = this.lookup(this.stress_pattern_semu);
            if(!result) {
                return '';
            }
            const [singular, plural] = result;
            
            const thead = `<thead><tr><th colspan="2">[${this.stress_pattern_semu}]</th></tr></thead>`;
            const caseforms = ['N','A','G','L','D','I'];
            const trs = caseforms.map((c) => {
                const col1 = `<th scope="row" class="singular">${c}</td><td><span class="stem ${singular[c]?'':'stress'}"></span>-<span class="end ${singular[c]?'stress':''}"></span></td>`;
                const col2 = `<th scope="row" class="plural">${c}</td><td><span class="stem ${plural[c]?'':'stress'}"></span>-<span class="end ${plural[c]?'stress':''}"></span></td>`;
                return `<tr>${col1}${col2}</tr>`;
            }).join("");
            const table = `<table class="stress-pattern">${thead}${trs}</table>`;
            const html = `<div class="stress-pattern-widget">${table}</div>`;

            return html;
        }
    }


    // Exports
    global.app = global.app || {};
    global.app.StressPatternWidget = StressPatternWidget;

})(window);