(function ($) {
    // const ApiClient = window.app.ApiClient;
    async function get_radar_config() {
        var RadarChart = {
            draw: function (id, d, options) {
                var cfg = {
                    radius: 5,
                    w: 600,
                    h: 600,
                    factor: 1,
                    factorLegend: .85,
                    levels: 3,
                    maxValue: 0,
                    radians: 2 * Math.PI,
                    opacityArea: 0.5,
                    ToRight: 5,
                    TranslateX: 80,
                    TranslateY: 30,
                    ExtraWidthX: 100,
                    ExtraWidthY: 100,
                    color: d3.scaleOrdinal() // D3 Version 4
                    .domain([0, 1])
                    .range(["#32CD32"])
                };

                if ('undefined' !== typeof options) {
                    for (var i in options) {
                        if ('undefined' !== typeof options[i]) {
                            cfg[i] = options[i];
                        }
                    }
                }
                cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function (i) { return d3.max(i.map(function (o) { return o.value; })) }));
                var allAxis = (d[0].map(function (i, j) { return i.axis }));
                var total = allAxis.length;
                var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
                var Format = d3.format("");
                d3.select(id).select("svg").remove();

                var g = d3.select(id)
                    .append("svg")
                    .attr("width", 600)
                    .attr("height", cfg.h + cfg.ExtraWidthY)
                    .append("g")
                    .attr("transform", "translate(" + (cfg.TranslateX + 00) + "," + cfg.TranslateY + ")");
                ;

                var tooltip;

                //Circular segments
                for (var j = 0; j < cfg.levels - 1; j++) {
                    var levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
                    g.selectAll(".levels")
                        .data(allAxis)
                        .enter()
                        .append("svg:line")
                        .attr("x1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
                        .attr("y1", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
                        .attr("x2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total)); })
                        .attr("y2", function (d, i) { return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total)); })
                        .attr("class", "line")
                        .style("stroke", "grey")
                        .style("stroke-opacity", "0.75")
                        .style("stroke-width", "0.3px")
                        .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
                }

                series = 0;

                var axis = g.selectAll(".axis")
                    .data(allAxis)
                    .enter()
                    .append("g")
                    .attr("class", "axis");

                axis.append("line")
                    .attr("x1", cfg.w / 2)
                    .attr("y1", cfg.h / 2)
                    .attr("x2", function (d, i) { return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total)); })
                    .attr("y2", function (d, i) { return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total)); })
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-width", "1px");

                axis.append("text")
                    .attr("class", "legend")
                    .text(function (d) { return d })
                    .style("font-family", "sans-serif")
                    .style("font-size", "20px")
                    .attr("text-anchor", "middle")
                    .attr("dy", "1.5em")
                    .attr("fill","gray")
                    .attr("transform", function (d, i) { return "translate(0, -10)" })
                    .attr("x", function (d, i) { return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total); })
                    .attr("y", function (d, i) { return cfg.h / 2 * (1 - Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total); });


                d.forEach(function (y, x) {
                    dataValues = [];
                    g.selectAll(".nodes")
                        .data(y, function (j, i) {
                            dataValues.push([
                                cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                                cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                            ]);
                        });

                    dataValues.push(dataValues[0]);

                    g.selectAll(".area")
                        .data([dataValues])
                        .enter()
                        .append("polygon")
                        .attr("class", "radar-chart-serie" + series)
                        .style("stroke-width", "2px")
                        .style("stroke", cfg.color(series))
                        .attr("points", function (d) {
                            var str = "";
                            for (var pti = 0; pti < d.length; pti++) {
                                str = str + d[pti][0] + "," + d[pti][1] + " ";
                            }
                            return str;
                        })
                        .style("fill", function (j, i) { return cfg.color(series) })
                        .style("fill-opacity", cfg.opacityArea)
                        .on('mouseover', function (d) {
                            z = "polygon." + d3.select(this).attr("class");
                            g.selectAll("polygon")
                                .transition(200)
                                .style("fill-opacity", 0.1);
                            g.selectAll(z)
                                .transition(200)
                                .style("fill-opacity", .7);
                        })
                        .on('mouseout', function () {
                            g.selectAll("polygon")
                                .transition(200)
                                .style("fill-opacity", cfg.opacityArea);
                        });
                    series++;
                });
                series = 0;


                d.forEach(function (y, x) {
                    g.selectAll(".nodes")
                        .data(y).enter()
                        .append("svg:circle")
                        .attr("class", "radar-chart-serie" + series)
                        .attr('r', 7)
                        .style("stroke","transparent")
                        .style("stroke-width","40px")
                        .attr("alt", function (j) { return Math.max(j.value, 0) })
                        .attr("cx", function (j, i) {
                            dataValues.push([
                                cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                                cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                            ]);
                            return cfg.w / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                        })
                        .attr("cy", function (j, i) {
                            return cfg.h / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total));
                        })
                        .attr("data-id", function (j) { return j.axis })
                        .style("fill", cfg.color(series)).style("fill-opacity", .9)
                        .on('mouseover', function (d) {
                            newX = parseFloat(d3.select(this).attr('cx')) - 10;
                            newY = parseFloat(d3.select(this).attr('cy')) - 5;

                            tooltip
                                .attr('x', newX)
                                .attr('y', newY)
                                .text(Format(d.value))
                                .transition(200)
                                .style('opacity', 1);

                            z = "polygon." + d3.select(this).attr("class");
                            g.selectAll("polygon")
                                .transition(200)
                                .style("fill-opacity", 0.1);
                            g.selectAll(z)
                                .transition(200)
                                .style("fill-opacity", .7);
                        })
                        .on('mouseout', function () {
                            tooltip
                                .transition(200)
                                .style('opacity', 0);
                            g.selectAll("polygon")
                                .transition(200)
                                .style("fill-opacity", cfg.opacityArea);
                        })
                        .append("svg:title")
                        .text(function (j) { return Math.max(j.value, 0) });

                    series++;
                });
                //Tooltip
                tooltip = g.append('text')
                    .style('opacity', 0)
                    .style('font-family', 'sans-serif')
                    .style('font-size', '20px');
            }
        };
        return RadarChart
    }
    async function make_chart(data, lemma_lookup) {
        $("#error").hide();
        var input_text = $("#contentinput").val().trim();
        var index = lemma_lookup[input_text];

        if (index == undefined) {
            $("#output").hide();
            $("#error").show();
            return false;
        }

        var radar_data = data[index];

        $("#lemma").text(input_text);
        $("#output").show();

        get_radar_config().then(function (result) {
            var RadarChart = result;

            var w = 500,
                h = 500;

            //Data
            var d = [
                radar_data.data[0].axes
            ]            
            // get totals
            var total = 0;
            for (var val in d[0]) {
                total += d[0][val]["value"];
            }
            $("#total").text(total);
            var past_total = d[0][1]['value'];
            var present_total = d[0][0]['value'];
            var future_total = d[0][2]['value'];
            $("#past").text(past_total);
            $("#present").text(present_total);
            $("#future").text(future_total);

            //Options for the Radar chart, other than default
            var mycfg = {
                w: w,
                h: h,
                maxValue: 0.6,
                levels: 6,
                ExtraWidthX: 300
            }

            //Call function to draw the Radar chart
            RadarChart.draw("#chart", d, mycfg);
        })
    };

    $(document).ready(async function () {
        console.log("ready!");
        $("#output").hide();
        $.getJSON("/static/js/src/data/verb-radar-data_1-11.json", function (data) {
            // create lookup from lemma to array number to avoid looping every time
            var lemma_lookup = new Object();
            for (var key in data) {
                var lemma = data[key]["lemma"]
                lemma_lookup[lemma] = key;
            }
            console.log('data loaded!');
            $("#makechart").on("click", function(){make_chart(data, lemma_lookup)});
        });
    });

    // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function () {
        var input_list = 'дерево';
        $("#contentinput").val(input_list);
    }

})(jQuery);