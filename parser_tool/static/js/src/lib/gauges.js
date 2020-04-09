(function(global, d3) {
    "use strict";

    /**
     * FrequencyGauge class
     * 
     * D3-based visualization that displays a donut-style gauge for comparing
     * the relative frequency of pairs of words (e.g. imperfective vs perfective).
     * 
     * Usage:
     *      var gauge = new FrequencyGauge({ parentElement: "#gauge" });
     *      gauge.data([
     *          {"label": "писать", "value": 431.78, "description": "imperfective"}, 
     *          {"label": "написать", "value": 302.08,  "description": "perfective"} 
     *      ]);
     *      gauge.draw();
     */
    class FrequencyGauge {
        constructor({ parentElement, config, data}) {
            this._parentElement = parentElement;
            this.config(config);
            this.data(data);
            this.init();
        }

        init() {
            const svg = d3.select(this._parentElement)
                .append("svg:svg");
            svg.append("g").attr("class", "arcs");
            svg.append("g").attr("class", "labels");

            return this;
        }

        config(config) {
            const defaults = {
                colors: ['#336688', '#FF9900']
            };
            config = config || {};
            this._config = {...defaults, ...config};
            return this;
        }

        data(data) {
            // ensure we get an array with at most 2 data points
            data = Array.isArray(data) ? data.slice(0, 2) : [];

            // get the total frequency
            const total = data.reduce((sum, cur) => sum + cur.value, 0);

            // augment data with relative frequency and sort order
            data = data.map((d, i) => {
                return {...d, percent: d.value / total, sort_order: i};
            });

            this._data = data;
            return this;
        }


        draw() {
            const vis = this;

            // determine size based on parent element
            const parentElement = document.querySelector(vis._parentElement);
            const width = Math.max(parentElement.clientWidth, 200);
            const height = Math.max(parentElement.clientHeight, 200);
            const radius = Math.min(width, height) / 2;
            let fontSize = Math.max(Math.round(width / 16), 14);

            // setup shape primitives and scales
            const pieGenerator = d3.pie()
                .value((d) => d.value)
                .sort((a, b) => a.sort_order - b.sort_order)
                .startAngle(-.5 * Math.PI)
                .endAngle(.5 * Math.PI);
            const arcGenerator = d3.arc()
                .innerRadius(radius / 3)
                .outerRadius(radius)
                .padAngle(.02);
            const colorOrdinal = d3.scaleOrdinal(vis._config.colors);

            // select and update svg elements
            const svg = d3.select(vis._parentElement)
                .select("svg")
                .attr('width', width)
                .attr('height', height);
            const arcs = svg.select(".arcs")
                .attr("transform", `translate(${radius},${radius})`);
            const labels = svg.select(".labels")
                .attr("transform", `translate(0, ${radius*1.1})`);

            const pieData = pieGenerator(vis._data);
            console.log(pieData);

            // append the donut slice paths
            arcs.selectAll(".arc")
                .data(pieData)
                .enter().append("path")
                .attr("class", "arc")
                .on('mouseover', function(d, i) {
                    d3.select(this).transition().duration(50).attr('opacity', '.85');
                })
                .on('mouseout', function(d, i) {
                    d3.select(this).transition().duration(50).attr('opacity', '1');
                });

            arcs.selectAll(".arc")
                .attr("fill", (d, i) => colorOrdinal(i))
                .attr("d", arcGenerator);

            // append the percentage value text
            arcs.selectAll(".arcvalue")
                .data(pieData)
                .enter().append('text')
                .attr("class", "arcvalue");

            arcs.selectAll(".arcvalue")
                .each(function(d, i) {
                    const centroid = arcGenerator.centroid(d);
                    d3.select(this)
                        .attr('x', centroid[0])
                        .attr('y', centroid[1])
                        .text(d3.format(".0%")(d.data.percent))
                        .attr("fill", "white")
                        .attr('text-anchor', 'middle')
                        .attr('font-size', fontSize);
                });

            // append word labels to bottom of donut
            labels.selectAll(".arclabel")
                .data(pieData)
                .enter().append("text")
                .attr("class", "arclabel");

            let adjustedFontSize = fontSize;
            labels.selectAll(".arclabel")
                .text((d) => d.data.label)
                .attr('font-family', 'sans-serif')
                .attr('font-size', fontSize)
                .each(function(d, i) {
                    const text = d3.select(this);

                    // adjust fontSize so that each text does not exceed 50% of the width
                    let textwidth = text.node().getBBox().width;
                    adjustedFontSize = Math.min(adjustedFontSize, Math.floor((1 - (textwidth / width) + .5) * fontSize));
                    
                    text.attr('x', d.data.sort_order == 0 ? 0 : width)
                        .attr('text-anchor', d.data.sort_order == 0 ? 'start' : 'end')
                        .attr("fill", colorOrdinal(d.data.sort_order));
                })
                .attr('font-size', adjustedFontSize);

            return vis;
        }
    }
   
    // Exports
    global.app = global.app || {};
    global.app.FrequencyGauge = FrequencyGauge;
})(window, d3);
