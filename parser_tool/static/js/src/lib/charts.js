(function(global, d3, c3) {
    "use strict";

    const COLORS = {
        'L_': '#333333', 
        'L1': 'green', 
        'L1-2': 'url(#striped-L1-2)', // blue-green #0d98ba
        'L2': 'blue', 
        'L3': '#8000ff', 
        'L4': 'orange', 
        'L5': 'orange'
    };
    

    class LevelsChart {
        constructor({ counts, bindto, combineLevels }) {
            this.counts = counts;
            this.bindto = bindto;
            this.colors = COLORS;
            this.combineLevels = (combineLevels === true);
            this.formatAsPercent = this.formatAsPercent.bind(this);
            this.toggleMask = this.toggleMask.bind(this);
        }

        getColumns() {
            if(this.combineLevels) {
                return this.getCombinedColumns();
            }
            return this.getSeparateColumns();
        }

        getSeparateColumns() {
            const columns = [
                ['L1', this.counts[1]],
                ['L2', this.counts[2]],
                ['L3', this.counts[3]],
                ['L4', this.counts[4]],
                ['L_', this.counts[0]]
            ];
            return columns;
        }

        getCombinedColumns() {
            const columns = [
                ['L1-2', this.counts[1] + this.counts[2]],
                ['L3', this.counts[3]],
                ['L4', this.counts[4]],
                ['L_', this.counts[0]]
            ];
            return columns;
        }

        formatAsPercent(v, id, i, j) {
            const result = v / this.counts.total;
            return d3.format('.1%')(Number.isNaN(result) ? 0 : result) 
        }

        orderByLevel(a, b) {
            const unknown_level = 10; // use a high number so it is ordered last
            const a_level = parseInt(a.id.charAt(1).replace("_", unknown_level), 10);
            const b_level = parseInt(b.id.charAt(1).replace("_", unknown_level), 10);
            return a_level - b_level;
        }

        toggleMask(data) {
            const cls = data.id.replace('L', 'level').replace("_", "0");
            const el = document.querySelector(".words");
            el.className = (el.classList.contains(cls) ? "words" : `words mask ${cls}`);
        }

        addStripePattern(bindto, id) {
            var pattern = d3.select(bindto)
                .select("defs").append("pattern");
            pattern.attr('id', id)
                .attr('width', 16)
                .attr('height', 16)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('patternTransform', 'rotate(-45)');
            pattern.append("rect")
                .attr('width', 15)
                .attr('height', 16)
                .attr('transform', 'translate(0,0)')
                .attr('fill', '#0d98ba'); // #0d98ba is "blue green"
        }

        addPatterns() {
            this.addStripePattern(this.bindto, "striped-L1-2");
        }
    }


    class LevelsPieChart extends LevelsChart {
        generate() {
            c3.generate({
                bindto: this.bindto,
                data: {
                    type: 'pie',
                    columns: this.getColumns(),
                    colors: this.colors,
                    order: this.orderByLevel,
                    labels: {format: this.formatAsPercent},
                    onclick: this.toggleMask,
                }
            });
            this.addPatterns();
        }
    }

    
    class LevelsBarChart extends LevelsChart {
        generate() {
            c3.generate({
                bindto: this.bindto,
                data: {
                    type: 'bar',
                    columns: this.getColumns(),
                    colors: this.colors,
                    order: this.orderByLevel,
                    labels: {format: this.formatAsPercent},
                    onclick: this.toggleMask,
                },
                tooltip: {show: false}
            });
            this.addPatterns();
        }
    }


    // Exports
    global.app = global.app || {};
    global.app.LevelsPieChart = LevelsPieChart;
    global.app.LevelsBarChart = LevelsBarChart;
})(window, d3, c3);
