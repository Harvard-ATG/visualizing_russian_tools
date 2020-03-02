(function(global, d3) {
    "use strict";

    /**
     * FrequencyGauge class
     * 
     * D3-based visualization that displays a donut-style gauge for comparing
     * the relative frequency of pairs of words (e.g. imperfective vs perfective).
     * 
     * Usage:
     * 
     *      var gauge = new FrequencyGauge({ parentElement: "#gauge" });
     *      
     *      // render with initial data
     *      gauge.setData([
     *          {"label": "писать", "value": 431.78, "description": "imperfective"}, 
     *          {"label": "написать", "value": 302.08,  "description": "perfective"} 
     *      ]);
     *      gauge.updateVis();
     * 
     *      // then update with new data later...
     *      gauge.setData([
     *          {"label": "умирать", "value": 66.6, "description": "imperfective"},
     *          {"label": "умереть", "value": 187.31,  "description": "perfective"}
     *      ]);
     *      gauge.updateVis();
     *
     */
    var FrequencyGauge = function(opts) {
        opts.parentElement = opts.parentElement || "body";
        opts.config = opts.config || {};
        opts.data = opts.data || [];
    
        this.config = {
            width: 250,
            height: 250,
            firstColor: '#336688',
            secondColor: '#FF9900',
        };
    
        for(var prop in opts.config) {
            this.config[prop] = opts.config[prop];
        }
    
        this.parentElement = opts.parentElement;
        this.setData(opts.data);
        this.initVis();
    }
    
    FrequencyGauge.prototype.initVis = function() {
        var vis = this;
    
        var width = vis.config.width;
        var height = vis.config.height;
        var radius = Math.min(width, height) / 2;
    
        vis._svg = d3.select(vis.parentElement)
            .append('svg:svg')
            .attr('width', width)
            .attr('height', height);
    
        vis._colorOrdinal = d3.scaleOrdinal([vis.config.firstColor, vis.config.secondColor]);
    
        vis._pieGenerator = d3.pie()
            .value((d) => d.value)
            .sort((a, b) => a.sort_order - b.sort_order)
            .startAngle(-.5 * Math.PI)
            .endAngle(.5 * Math.PI);
    
        vis._arcGenerator = d3.arc()
            .innerRadius(radius / 3)
            .outerRadius(radius)
            .padAngle(.02);
    
        vis._arcsGroup = vis._svg.append("g").attr("transform", `translate(${width/2},${height/2})`);
        vis._labelGroup = vis._svg.append("g");
    }
    
    FrequencyGauge.prototype.setData = function(data) {
        var vis = this;
        if(data.length <= 2) {
            vis.data = data;
        } else {
            console.error("setData() got too many data items (should be <= 2): ", data);
            vis.data = [];
        }
        vis.wrangeData();
        return this;
    }
    
    FrequencyGauge.prototype.wrangeData = function() {
        var vis = this;

        // get the total frequency
        var total = vis.data.reduce((sum, cur) => sum + cur.value, 0);
        
        // augment data with relative frequency and sort order
        vis.data = vis.data.map((d, i) => {
            return {...d, percent: d.value / total, sort_order: i};
        });
    
        return this;
    }
    
    FrequencyGauge.prototype.updateVis = function() {
        var vis = this;
        var pieData = vis._pieGenerator(vis.data);
        console.log(pieData);
        
        // create the donut slices
        var arcSelection = vis._arcsGroup.selectAll(".arc");
        var arcDataSelection = arcSelection.data(pieData);
        
        arcDataSelection
            .exit().remove();
        arcDataSelection
            .enter().append("path")
            .attr("class", "arc")
        
        arcSelection = vis._arcsGroup.selectAll(".arc");
        arcSelection
            .attr("fill", (d, i) => vis._colorOrdinal(i))
            .attr("d", vis._arcGenerator);
    
        // add values inside the donut slices
        var arcvalueSelection = vis._arcsGroup.selectAll(".arcvalue");
        var arcvalueDataSelection = arcvalueSelection.data(pieData);
    
        arcvalueDataSelection
            .exit().remove();
        arcvalueDataSelection
            .enter().append('text')
            .attr("class", "arcvalue");
    
        arcvalueSelection = vis._arcsGroup.selectAll(".arcvalue");
        arcvalueSelection
            .each(function(d, i) {
                var centroid = vis._arcGenerator.centroid(d);
                d3.select(this)
                    .attr('x', centroid[0])
                    .attr('y', centroid[1])
                    .text(d3.format(".0%")(d.data.percent))
                    .attr("fill", "white")
                    .attr('text-anchor', 'middle');
            });
            
    
        // add label under the donut slices
        var labelSelection = vis._labelGroup.selectAll(".arclabel");
        var labelDataSelection = labelSelection.data(pieData);
    
        labelDataSelection
            .exit().remove();
        labelDataSelection
            .enter().append("text")
            .attr("class", "arclabel");
    
        labelSelection = vis._labelGroup.selectAll(".arclabel");
        labelSelection
            .text((d) => d.data.label)
            .each(function(d, i) {
                d3.select(this)
                    .attr('x', d.data.sort_order == 0 ? 0 : vis.config.width)
                    .attr('y', vis.config.height / 2 + 15)
                    .attr('text-anchor', d.data.sort_order == 0 ? 'start' : 'end');
    
            })
            .attr("font-size", "16px")
            .attr("font-family", "sans-serif")
            .attr("fill", "black");
    
        return this;
    }
   
    // Exports
    global.app = global.app || {};
    global.app.FrequencyGauge = FrequencyGauge;
})(window, d3);