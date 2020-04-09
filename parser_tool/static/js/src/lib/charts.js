(function(global, d3, c3) {
    "use strict";

    const BLACK = "#333333";
    const GREEN = "#008000";
    const BLUE = "#0000ff";
    const PURPLE = "#8000ff";
    const ORANGE = "#ffa500";
    const BLUEGREEN = "#0d98ba";

    const CHART_COLORS = {
        'L_': BLACK, 
        'L1': GREEN, 
        'L1-2': 'url(#stripe-L1-2)', 
        'L2': BLUE, 
        'L3': PURPLE, 
        'L4': ORANGE, 
        'L5': ORANGE
    };


    class LevelsChart {
        constructor({ counts, bindto, combineLevels }) {
            this.counts = counts;
            this.bindto = bindto;
            this.colors = CHART_COLORS;
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

        addStripePatternUsingGradient(bindto, id, gradient) {
            const pattern = d3.select(bindto)
                .select("defs").append("pattern");
            pattern.attr('id', id)
                .attr('width', 24)
                .attr('height', 24)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('patternTransform', 'rotate(-135)');
            pattern.append("rect")
                .attr('width', 24)
                .attr('height', 24)
                .attr('transform', 'translate(0,0)')
                .attr('fill', gradient); 
        }

        addGradientGreenToBlue(bindto, id) {
            const linearGradient = d3.select(bindto)
                .select("defs")
                .append("linearGradient");
            linearGradient.attr('id', id)
                .attr('x1', '0')
                .attr('y1', '0')
                .attr('x2', '0')
                .attr('y2', '100%');
            linearGradient.append('stop').attr('offset', '0').attr('stop-color', '#0F7001');
            linearGradient.append('stop').attr('offset', '50%').attr('stop-color', '#606dbc');
            linearGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0000FF');
            linearGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0000FF');
        }

        addPatterns() {
            this.addGradientGreenToBlue(this.bindto, "gradient-L1-2");
            this.addStripePatternUsingGradient(this.bindto, "stripe-L1-2", "url(#gradient-L1-2)");
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
            //this.addPatterns();
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
