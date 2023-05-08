(function ($) {
    const ApiClient = window.app.ApiClient;

    async function getNeighbors(algorithm_type) {
        const api = new ApiClient();
        $('#output0').empty();
        $('#output1').empty();
        $('#output2').empty();
        $("#graph").empty();
        $('#slider-step').empty();
        $('.timing').text(' ')
        $('#error').css('display', 'none')
        $('.hide').css('display', 'none')

        var input_text = $("#contentinput").val();
        var jqXhr;

        if (algorithm_type == 'lsh') {
            jqXhr = api.getSimilarLSH(input_text);
            $('#loading1').css('display', 'block');
            $('#loading2').css('display', 'none');
        } else {
            jqXhr = api.getSimilarBruteForce(input_text);
            $('#loading2').css('display', 'block');
            $('#loading1').css('display', 'none');
        }

        jqXhr.then(function (result, textStatus) {
            console.log('result:', result);
            if (result.status == 'error') {
                $('#error').css('display', 'block')
                $('.loading').css('display', 'none')
                return false;
            }
            $('.hide').css('display', 'block')

            $('#title').text('Most similar word forms to ' + input_text)
            $('.timing').text('in ' + result.timing.toFixed(2) + ' seconds')

            drawChart(result)

            d3.select('#slider-step').append('div')
                .text('Show/hide words:')
                .style('display', 'inline-block')

            // Step
            sliderStep = d3
                .sliderBottom()
                .min(0)
                .max(100)
                .width(300)
                .step(5)
                .ticks(10)
                .default(20)
                .on('onchange', val => {
                    $('#graph-title').text('2-D Representation of the closest ' + val + ' forms to ' + input_text)
                    circle.each(function () {
                        const rank = +d3.select(this).attr('data-rank');
                        if (rank <= val) {
                            d3.select(this).transition().attr('display', 'block');
                        } else {
                            d3.select(this).transition().attr('display', 'none');
                        }
                    })
                    label.each(function () {
                        const rank = +d3.select(this).attr('data-rank');
                        if (rank <= val) {
                            d3.select(this).transition().attr('display', 'block');
                        } else {
                            d3.select(this).transition().attr('display', 'none');
                        }
                    })
                });

            gStep = d3
                .select('#slider-step')
                .append('svg')
                .attr('width', 350)
                .attr('height', 100)
                .append('g')
                .style('display', 'none')
                .attr('transform', 'translate(30,30)')

            gStep.call(sliderStep);

            // var zoombutton = d3.select('#slider-step')
            //     .append('div')
            //     .attr('id','zoombutton')
            //     .text('Reset zoom')

            $('#graph-title').text('2-D Representation of the closest ' + sliderStep.value() + ' forms to ' + input_text)
            $('#graph-descript').text('Use mouse wheel or two finger zoom on mousepad to zoom in & out. Use top slider to adjust # of words shown on graph.')
            $('#header1').css('display', 'block')
            $('#header2').css('display', 'block')

            result.output.forEach((elt, i) => {
                $('#output0').append('<span id="result' + (i + 1) + '" style="opacity: 1">' + (i + 1) + '</span>')
                $('#output1').append('<span id="result' + (i + 1) + '" style="opacity: 1">' + elt.word + '</span>')
                $('#output2').append('<span id="sim' + (i + 1) + '" style="opacity: 1">' + elt.similarity.toFixed(4) + '</span>')
            });

            gStep.transition().style('display', 'block')
        });
    }

    function drawChart(result) {
        $("#graph").empty();

        var startvectors = []
        var labels = []
        result.output.forEach(function (elt) {
            startvectors.push(elt.vector)
            labels.push(elt.word)
        })

        var vectors = PCA.getEigenVectors(startvectors);
        var adData = PCA.computeAdjustedData(startvectors, vectors[0], vectors[1])
        var betterData = adData.formattedAdjustedData

        var data = []
        for (var i = 0; i < 100; i++) {
            if (betterData[0][i] === undefined) {
                break;
            }
            data.push({
                'x': betterData[0][i],
                'y': betterData[1][i],
            })
        }

        // max and min for graph
        var xvals = data.map(function (pair) { return pair.x })
        var yvals = data.map(function (pair) { return pair.y })

        var xMax = xvals.reduce(function (a, b) { return Math.max(a, b); });
        var xMin = xvals.reduce(function (a, b) { return Math.min(a, b); });
        var yMax = yvals.reduce(function (a, b) { return Math.max(a, b); });
        var yMin = yvals.reduce(function (a, b) { return Math.min(a, b); });

        var margin = { top: 20, right: 20, bottom: 30, left: 30 };
        width = 700 - margin.left - margin.right, height = 480 - margin.top - margin.bottom;

        let xTranslateCurrent = 0;
        let yTranslateCurrent = 0;


        var tooltip = d3.select("#graph").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var x = d3.scaleLinear()
            .domain([xMin - 1, xMax + 2])
            .range([0, width])

        var y = d3.scaleLinear()
            .domain([yMin - 1, yMax + 1])
            .range([height, 0]);

        var xAxis = d3.axisBottom(x).ticks(12).tickFormat(() => ''),
            yAxis = d3.axisLeft(y).ticks(12 * height / width).tickFormat(() => '');

        // var brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushended),
        //     idleTimeout,
        //     idleDelay = 350;

        var svg = d3.select("#graph").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define the zoom behavior
        var zoomBehavior = d3.zoom()
            .scaleExtent([0.5, 20]) // Set the minimum and maximum zoom scale
            .on("zoom", zoomed);
        // Apply the zoom behavior to the svg
        svg.call(zoomBehavior);


        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        var scatter = svg.append("g")
            .attr("id", "scatterplot")
            .attr("clip-path", "url(#clip)");

        var node = scatter.selectAll(".dot")
            .data(data)
            .enter()
            .append('g')
            .style('cursor','pointer')

        circle = node.append("circle")
            .attr("class", "dot")
            .attr('data-rank', (d, i) => i)
            .attr("r", 5)
            .attr("cx", function (d) { return x(d.x); })
            .attr("cy", function (d) { return y(d.y); })
            .attr("display", function (d, i) {
                if (i >= 20) {
                    return 'none';
                } return 'block';
            })
            .attr('id', function (d, i) { "circle" + (i + 1) })
            .style("fill", function (d, i) {
                if (i == 0) { return "tomato" };
                return "#4292c6";
            });

        label = node
            .append('text')
            .attr('data-rank', (d, i) => i)
            .attr("x", function (d) { return x(d.x) + 7; })
            .attr("y", function (d) { return y(d.y) + 7; })
            .attr('id', function (d, i) { "label" + (i + 1) })
            .attr('display', function (d, i) {
                if (i >= 20) {
                    return 'none';
                } return 'block';
            })
            .text(function (d, i) { return labels[i] });

        node.on('mouseover', function (d, thisi) {
            node.each(function (d, i) {
                var thisNode = d3.select(this)
                if (thisi == i) {
                    thisNode.transition().style('opacity', 1)
                } else {
                    thisNode.transition().style('opacity', .2)
                }
            })
        }).on('mouseout', function () {
            node.transition().style('opacity', 1)
        })

        // x axis
        svg.append("g")
            .attr("class", "x axis")
            .attr('id', "axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // y axis
        svg.append("g")
            .attr("class", "y axis")
            .attr('id', "axis--y")
            .call(yAxis);

        // Define the zoom function that will be called when the zoom event occurs
        function zoomed() {
            // Get the current zoom transform
            const transform = d3.event.transform;

            // Update the positions of the circles and labels based on the updated scales
            circle.attr("cx", d => transform.applyX(x(d.x)))
                .attr("cy", d => transform.applyY(y(d.y)));

            label.attr("x", d => transform.applyX(x(d.x)) + 7)
                .attr("y", d => transform.applyY(y(d.y)) + 7);

            // Update the axes with the new scales
            svg.select(".x.axis").call(xAxis.scale(transform.rescaleX(x)));
            svg.select(".y.axis").call(yAxis.scale(transform.rescaleY(y)));
        }

        function dragged() {
            const dx = d3.event.dx;
            const dy = d3.event.dy;

            const xTranslate = xTranslateCurrent + dx;
            const yTranslate = yTranslateCurrent + dy;

            svg.attr("transform", `translate(${xTranslate}, ${yTranslate}) scale(${currentScale})`);

            xTranslateCurrent = xTranslate;
            yTranslateCurrent = yTranslate;
        }
        const drag = d3.drag()
            .on("drag", dragged);
        svg.call(drag);

        document.getElementById('reset-button').addEventListener('click', resetZoomAndDrag);

        function resetZoomAndDrag() {
            svg.transition()
                .duration(750)
                .call(zoomBehavior.transform, d3.zoomIdentity);
        }


        // scatter.append("g")
        //     .attr("class", "brush")
        //     .call(brush);

        // function brushended() {
        //     var s = d3.event.selection;
        //     if (!s) {
        //         if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
        //         x.domain([xMin - 1, xMax + 2])
        //         y.domain([yMin - 1, yMax + 1])
        //     } else {

        //         x.domain([s[0][0], s[1][0]].map(x.invert, x));
        //         y.domain([s[1][1], s[0][1]].map(y.invert, y));
        //         scatter.select(".brush").call(brush.move, null);
        //     }
        //     zoom();
        // }

        // function idled() {
        //     idleTimeout = null;
        // }

        // function zoom() {
        //     var t = scatter.transition().duration(750);
        //     svg.select("#axis--x").transition(t).call(xAxis);
        //     svg.select("#axis--y").transition(t).call(yAxis);
        //     scatter.selectAll("circle").transition(t)
        //         .attr("cx", function (d) { return x(d.x); })
        //         .attr("cy", function (d) { return y(d.y); });
        //     label.transition(t)
        //         .attr("x", function (d) { return x(d.x) + 7; })
        //         .attr("y", function (d) { return y(d.y) + 7; })
        // }

    }


    $(document).ready(async function () {
        $("#submit1").on("click", function () { getNeighbors('lsh') })
        $("#submit2").on("click", function () { getNeighbors('bruteforce') })

        $('#contentinput').keydown(function (event) {
            let keyPressed = event.keyCode || event.which;
            // enter
            if (keyPressed === 13) {
                event.preventDefault();
                getNeighbors('lsh');
            }
            // space
            else if (keyPressed == 32) {
                event.preventDefault()
            }
        });

    });

    // // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function () {
        // happiness
        $("#contentinput").val('счастье');
    }

})(jQuery); 