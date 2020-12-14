(function ($) {
    // const ApiClient = window.app.ApiClient;
    async function make_force(selectedroot, graph) {
        console.log('reached the function');
        svg = d3.select('#chartsvg');

        // clear output space
        svg.selectAll("*").remove();

        // add the options to the color button
        d3.select("#colorButton")
            .selectAll('myOptions')
            .data(["Color by level", "Color by part of speech"])
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button


        // add the options to the label button
        d3.select("#labelButton")
            .selectAll('myOptions')
            .data(['Show labels', 'Hide labels'])
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button

        // set radius of circle
        R = 18;

        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // get total word count
        total_word_count = graph.nodes.length - 1;
        console.log('orig', total_word_count)
        d3.select("#count").text(total_word_count);

        // size svg accordingly
        width = 1200
        height = 1000
        svg.attr('width', width)
        svg.attr('height', height)

        // get normalized values for link placement
        normalized_values = getNormalized(graph);

        // enter the simulation!!!
        simulation = d3.forceSimulation()
            .nodes(graph.nodes)
            .force('link', d3.forceLink().id(d => d.id)
                .distance(function (d, i) {
                    return ((3 / (normalized_values[i] ** 1.2 + .01)));
                }))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .on('tick', ticked);

        simulation.force('link')
            .links(graph.links);

        link = svg.selectAll('line')
            .data(graph.links)
            .enter().append('line')
            .attr('class', 'link');

        node = svg.selectAll('.node')
            .data(graph.nodes)
            .enter().append('g')
            .on('mouseover.tooltip', function (d) {
                tooltip.transition()
                    .duration(300)
                    .style("opacity", .8);
                tooltip.html("<b>Word: </b>" + d.id + "<br>" +
                    "<b>Translation: </b>" + d.translation + "<br>" +
                    "<b>POS: </b>" + d.pos + "<br>" +
                    "<b>Count: </b>" + d.count + "<br>" +
                    "<b>Level: </b>" + d.level)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 10) + "px")
                    .style("padding", "7px");
            })
            .on('mouseover.fade', fade(0.1))
            .on("mouseout.tooltip", function () {
                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            })
            .on('mouseout.fade', fade(1))
            .on("mousemove", function () {
                tooltip.style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 10) + "px");
            })
            .attr("class", function (d, i) {
                if (i == 0) {
                    var level = "";
                } else {
                    var level = "level" + d.level[0];
                };
                var thisclass = level + ' ' + d.pos;
                return thisclass;
            })
            .attr("opacity", 1)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));;

        node.append('circle')
            .attr('r', R)
            .attr("fill", function (d, i) {
                return get_level_color(d.level, i)
            })
            .attr('stroke-width', function (d, i) {
                if (i == 0) {
                    return '1px';
                } else {
                    return '35px';
                }
            })
            .attr("stroke", function (d, i) {
                if (i == 0) {
                    return '#777';
                } else {
                    return 'transparent';
                }
            })
            .classed("circleclass", true)
            .on('dblclick', releasenode)

        node.append('text')
            .attr('x', 0)
            .attr('dy', '.35em')
            .attr("display", "block")
            .text(d => d.id);

        // checkboxes for level
        d3.select("#level1").on("change", updateLevel);
        d3.select("#level2").on("change", updateLevel);
        d3.select("#level3").on("change", updateLevel);
        d3.select("#level4").on("change", updateLevel);
        function updateLevel() {
            var counter = 0
            for (i = 1; i <= 4; i++) {
                if (d3.select("#level" + i).property("checked")) {
                    setOpacity('.level' + i, 1)
                    counter += d3.selectAll('.level' + i).size()
                    d3.selectAll('.level' + i).select("circle").classed("noHover", false);
                } else {
                    setOpacity(".level" + i, 0)
                    d3.selectAll('.level' + i).select("circle").classed("noHover", true);
                }
            }
            console.log('levelcount', counter);
            d3.select("#count").text(counter);
        };
        updateLevel();

        // checkboxes for POS
        d3.select("#noun").on("change", updatePOS);
        d3.select("#adj").on("change", updatePOS);
        d3.select("#adv").on("change", updatePOS);
        d3.select("#verb").on("change", updatePOS);
        d3.select("#phrase").on("change", updatePOS);
        function updatePOS() {
            var counter = 0
            for (var pos of ['noun', 'adj', 'verb', 'adv', 'phrase']) {
                if (d3.select("#" + pos).property("checked")) {
                    setOpacity('.' + pos, 1)
                    counter += d3.selectAll('.' + pos).size()
                    d3.selectAll('.level' + i).select("circle").classed("noHover", false);
                } else {
                    setOpacity("." + pos, 0)
                    d3.selectAll('.level' + i).select("circle").classed("noHover", true);
                }
            }
            console.log('colorcount', counter);
            d3.select("#count").text(counter);
        };
        updatePOS();

        function setOpacity(selectedClass, opacity) {
            d3.selectAll(selectedClass)
                .transition()
                .duration(750)
                .attr("opacity", function (d, i) {
                    classed = d3.select(this).attr("class");
                    if (classed.includes('noHover')) {
                        return 0;
                    }
                    else {
                        return opacity;
                    }
                });
        };


        d3.select('#slider-step').selectAll('*').remove();
        d3.select('#slider-simple').selectAll('*').remove();

        // radius slider
        var sliderSimple = d3
            .sliderBottom()
            .min(0)
            .max(3)
            .width(300)
            .tickFormat(d3.format('.0%'))
            .ticks(5)
            .default(1)
            .on('onchange', val => {
                d3.select('p#value-simple').text(d3.format('.0%')(val));
                // d3.selectAll("circle")
                //     .transition()
                //     .duration(750)
                    // .attr('opacity', (2 - val)*1.5)
                    // .attr('r', val * R);
                simulation
                    .force('link', d3.forceLink().id(d => d.id)
                        .distance(function (d, i) {
                            return (val * (3 / (normalized_values[i] ** 1.2 + .01)));
                        }))
                    .force('charge', d3.forceManyBody().strength(-300))
                    .force('center', d3.forceCenter(width / 2, height / 2))
                    .on('tick', ticked)
                    .force('link')
                    .links(graph.links);
                simulation.alphaTarget(0.3).restart();
                console.log(node.select('text'));
                node.select('text').style('font-size', 14 * ((val-1)/2+1) + 'px')
            });

        var gSimple = d3
            .select('div#slider-simple')
            .append('svg')
            .attr('width', 500)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gSimple.call(sliderSimple);

        d3.select('p#value-simple').text(d3.format('.0%')(sliderSimple.value()));
        d3.select("#reset-simple").on("click", function () {
            sliderSimple.value(1); resetSim();
        });

        // show/hide slider
        var sliderStep = d3
            .sliderBottom()
            .min(0)
            .max(1)
            .width(300)
            .tickFormat(d3.format('.0%'))
            .ticks(10)
            // .tickValues([0, 0.25, 0.5, 0.75, 1])
            .step(.1)
            .default(1)
            .fill('#2196f3')
            .on('onchange', function () {
                var counter = valueChange(sliderStep.value());
                console.log('counter', counter)
                d3.select('p#value-step').text(d3.format('.0%')(sliderStep.value()));
                d3.select("#count").text(counter);
            });

        function valueChange(value) {
            var counter = 0
            if (value != 1) {
                d3.selectAll('.inputclass').each(function (d, i) {
                    d3.select(this).node().checked = true;
                    d3.select(this).node().disabled = true;
                });
            }
            else {
                d3.selectAll('.inputclass').each(function (d, i) {
                    d3.select(this).node().checked = true;
                    d3.select(this).node().disabled = false;
                });
            }
            node.transition().duration(850)
                .attr("opacity", function (d, i) {
                    if (i > (value * data.length)) {
                        return 0;
                    } else {
                        counter += 1
                        return 1;
                    };
                });
            node.classed("noHover", function (d, i) {
                return i > (value * data.length)
            });
            return counter - 1;
        };
        var gStep = d3
            .select('div#slider-step')
            .append('svg')
            .attr('width', 400)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gStep.call(sliderStep);
        d3.select('p#value-step').text(d3.format('.0%')(sliderStep.value()));

        d3.select("#reset-step").on("click", function () {
            sliderStep.value(1);
        });

        function resetSim() {
            simulation
                .force('link', d3.forceLink().id(d => d.id)
                    .distance(function (d, i) {
                        return ((3 / (normalized_values[i] ** 1.2 + .01)));
                    }))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .alpha(1)
                .on('tick', ticked)
                .force('link')
                .links(graph.links);
            simulation.alphaTarget(0.3).restart();
        }
        // function to change node color
        // https://www.d3-graph-gallery.com/graph/line_select.html
        function colorUpdate(selectedGroup) {
            circles = d3.selectAll("circle");
            if (selectedGroup == 'Color by part of speech') {
                resetColor();
                d3.select("#levellegend").style("display", "none");
                d3.select("#poslegend").style("display", "block");
                // update checkboxes
                d3.select("#levelcheckboxrow").style('display', 'none');
                d3.select("#colorcheckboxrow").style('display', 'block');
                circles
                    .transition()
                    .duration(750)
                    .attr("fill", function (d, i) {
                        return get_pos_color(d.pos, i)
                    })
            }
            if (selectedGroup == 'Color by level') {
                resetColor();
                d3.select("#levellegend").style("display", "block")
                d3.select("#poslegend").style("display", "none")
                // update checkboxes
                d3.select("#levelcheckboxrow").style('display', 'block');
                d3.select("#colorcheckboxrow").style('display', 'none');
                circles
                    .transition()
                    .duration(750)
                    .attr("fill", function (d, i) {
                        return get_level_color(d.level, i)
                    })
            }
        }
        function resetColor() {
            node.transition().duration(200).attr("opacity", 1);
            sliderStep.value(1);
        }
        // when the dropdown is changed, change color
        d3.select("#colorButton").on("change", function (d) {
            // recover the option that has been chosen
            var selectedOption = d3.select(this).property("value")
            // run the colorUpdate function with this selected option
            colorUpdate(selectedOption)
        })
        // function to change presence of label
        function labelUpdate() {
            var current_state = node.select("text").attr("display");
            node.select("text")
                .transition()
                .attr("display",
                    function () {
                        if (current_state == 'block') {
                            return "none"
                        } else {
                            return "block"
                        }
                    })
        }
        // when the dropdown is changed, change label
        d3.select("#labelButton").on("change", function (d) {
            // run the updateChart function with this selected option
            labelUpdate();
        })
        function ticked() {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        }
        function releasenode(d) {
            d.fx = null;
            d.fy = null;
        }

        const linkedByIndex = {};
        graph.links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
        });

        function isConnected(a, b) {
            return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
        }

        function fade(opacity) {
            return d => {
                node.style('stroke-opacity', function (o) {
                    const thisOpacity = isConnected(d, o) ? 1 : opacity;
                    this.setAttribute('fill-opacity', thisOpacity);
                    return thisOpacity;
                });
                link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
            };
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
        }

        function getNormalized(graph) {
            var val_total = 0
            // find average
            for (d of graph.nodes) {
                val_total += parseFloat(d.count);
            }
            var mean = val_total / graph.nodes.length;

            // find standard dev
            var variance_sum = 0;
            for (d of graph.nodes) {
                var count = parseFloat(d.count);
                variance_sum += (count - mean) ** 2;
            }
            var variance = variance_sum / graph.nodes.length;
            var std_dev = Math.sqrt(variance);

            // calc z-scores of all counts
            var z_scores = []
            for (d of graph.nodes) {
                var z_score = (parseFloat(d.count) - mean) / std_dev;
                z_scores.push(z_score);
            }
            // scale 0 to 1
            normalized_values = []
            var min = Math.min.apply(Math, z_scores);
            var max = Math.max.apply(Math, z_scores);
            for (i = 0; i < graph.nodes.length; i++) {
                var normalized_val = (z_scores[i] - min) / (max - min);
                normalized_values.push(normalized_val);
            }
            return normalized_values.sort().reverse();
        }
        data = graph.nodes;
    }

    function get_pos_color(pos, i) {
        if (i == 0) {
            return "white";
        }
        if (pos == "noun") {
            color = "#3da5d9";
        }
        if (pos == "adj") {
            color = "#ffd166";
        }
        if (pos == "verb") {
            color = "#ef476f";
        }
        if (pos == 'adv') {
            color = "#00ad43";
        }
        if (pos == 'phrase') {
            color = "#69359c";
        }
        return color;
    }
    function get_level_color(level, i) {
        if (i == 0) {
            return "white";
        }
        if (level == "1E") {
            color = "#00ad43"
        }
        if (level == "2I") {
            color = "#3da5d9"
        }
        if ((level == "3A") || (level == "3AU")) {
            color = "#69359c"
        }
        if ((level == "4SU") || (level == "4S")) {
            color = "#ffa41c"
        }
        return color;
    }

    $(document).ready(async function () {
        console.log("ready!");
        $.getJSON('/static/js/src/data/roots_12-14.json', function (roots) {
            d3.select("#rootButton")
                .selectAll('myOptions')
                .data(roots.sort())
                .enter()
                .append('option')
                .text(function (d) { return d; }) // text showed in the menu
                .attr("value", function (d) { return d; }) // corresponding value returned by the button

            $.getJSON("/static/js/src/data/root_data_12-14.json", function (rootdata) {
                $("#rootButton").change(function () {
                    var root = $("#rootButton option:selected").val();
                    make_force(root, getrootgraph(root));
                });
                document.getElementById('rootButton').value = 'клад';
                make_force('клад', getrootgraph('клад'));

                function getrootgraph(someRoot) {
                    for (graph of rootdata) {
                        if (someRoot == graph.nodes[0]['id'].slice(0, -7)) {
                            console.log(graph);
                            return graph
                        }
                    }
                }
            })
        });
    });

})(jQuery);