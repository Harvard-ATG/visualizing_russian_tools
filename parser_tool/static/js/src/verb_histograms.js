

function chart(csv) {
    // Define the div for the tooltip
    const div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    var keys = csv.columns.slice(2);

    var verb = [...new Set(csv.map(d => d.Verb))]
    var states = [...new Set(csv.map(d => d.WindowSize))]

    verb.sort(function (a, b) {
        return a.localeCompare(b);
    })

    var z =
        d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeTableau10)

    var options = d3.select("#verb").selectAll("option")
        .data(verb)
        .enter().append("option")
        .text(d => d)

    var svg = d3.select("#chart"),
        margin = { top: 35, left: 35, bottom: 0, right: 70 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .range([margin.left, width - 100 - margin.right])
        .padding(0.1)

    var y = d3.scaleLinear()
        .rangeRound([height - margin.bottom, margin.top])

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "x-axis")

    var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")


    var startingverb = 'думать'
    d3.select('#verb').property('value', startingverb);
    // write the graph!!!
    update(startingverb, 0, false)

    $('#verb').on('select2:select', function (e) {
        console.log($('#verb').select2('data'))
            update(this.value, 750, false)
      });

    d3.select('#randomize').on('click', function () {
        var randomIndex = Math.floor(Math.random() * verb.length)
        var randomVerb = verb[randomIndex]
        // d3.select('#verb').property('value', randomVerb);
        $('#verb').val(randomVerb)
        $('#verb').trigger('change');
        update(randomVerb, 750, false)
    })


    // update function // 
    function update(input, speed, selectedCX) {
        d3.json('/static/js/src/data/verbConstructions.json').then(cxdata => build_cxx(cxdata))
        function build_cxx(cxdata) {
            var data = cxdata[0][input]

            d3.select('#aggregate').text('[ '+data.aggregate+' ]')
            
            d3.select('#use0').text(' ')
            d3.select('#use1').text(' ')
            d3.select('#use2').text(' ')
            
            if (data.separated.length == 0) {
                d3.select('#use0').text('Not Enough Data')
                d3.select('#use1').text(' ')
                d3.select('#use2').text(' ')
            }
            data.separated.forEach(function(cx,i) {
                d3.select('#use'+i).text(cx[1] + ' (' + cx[0] + ')')
            })
            d3.selectAll('.related').remove()

            if (data.relatedwords.length == 0) {
                d3.select('#wordcol0')
                .append('p').attr('class','related').text('Not Enough Data')
            }
            data.relatedwords.forEach(function(word, i) {
                if (i < 10) {
                    d3.select('#wordcol0')
                        .append('p')
                        .attr('class','related')
                        .text(word[1] + ' (' + word[0] + ')')
                } else {
                    d3.select('#wordcol1')
                    .append('p')
                    .attr('class','related')
                    .text(word[1] + ' (' + word[0] + ')')
                }
            })
        }

        d3.json('/static/js/src/data/verbHistogramSentences/' + input + '.json').then(sentdata => withSentences(sentdata))

        function withSentences(sentencedata) {
            d3.selectAll('.verblabel').text(input)
            d3.selectAll('.destroyonupdate').remove()

            var data = csv.filter(f => f.Verb == input)

            // get most prevalent constructions
x
            // 
            // deleting datapoints which aren't for selected AP
            if (selectedCX != false) {
                var newData = []
                data.forEach(function (w) {
                    var newObj = new Object
                    for (const [key, value] of Object.entries(w)) {
                        if ((key == selectedCX) || ['Verb', 'WindowSize', 'total'].includes(key)) {
                            newObj[key] = value
                        } else {
                            newObj[key] = 0
                        }
                    }
                    newData.push(newObj)
                })
                data = newData
            }
            data.forEach(function (d) {
                d.total = d3.sum(keys, k => +d[k])
                return d
            })
            var cxxObj = new Object()
            data.forEach(function (w) {
                for (const [key, value] of Object.entries(w)) {
                    if (value > 0 && !(['WindowSize', 'total'].includes(key))) {
                        cxxObj[key] = 0
                    }

                }
            })
            data.forEach(function (w) {
                for (const [key, value] of Object.entries(w)) {
                    if (value > 0 && !(['WindowSize', 'total'].includes(key))) {
                        cxxObj[key] += +value
                    }
                }
            })
            var cxxList = Object.entries(cxxObj);
            cxxList = cxxList.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
            cxx = cxxList.map(elt => elt[0]);

            y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();

            svg.selectAll(".y-axis").transition().duration(speed)
                .call(d3.axisLeft(y).ticks(null, "s"))

            data.sort(d3.select("#sort").property("checked")
                ? (a, b) => b.total - a.total
                : (a, b) => states.indexOf(a.WindowSize) - states.indexOf(b.WindowSize))

            x.domain(data.map(d => d.WindowSize));

            svg.selectAll(".x-axis").transition().duration(speed)
                .call(d3.axisBottom(x).tickSizeOuter(0))

            var group = svg.selectAll("g.layer")
                .data(d3.stack().keys(keys)(data), d => d.key)
                .style('cursor', 'pointer')

            group.exit().remove()

            group.enter().append("g")
                // .classed("layer", true)
                .attr('class', function (d) {
                    return 'layer ' + formatKeyClass(d.key)
                })
                .attr("fill", d => z(d.key))
            // .attr('class', function(d) {return d.key});

            var bars = svg.selectAll("g.layer").selectAll("rect")
                .data(d => d, e => e.data.WindowSize)

            bars.exit().remove()

            bars.enter().append("rect")
                .attr("width", x.bandwidth())
                .merge(bars)
                .transition().duration(speed)
                .attr("x", function (d) { return x(d.data.WindowSize) })
                .attr("y", d => y(d[1]))
                .attr('stroke', 'white')
                .attr("height", d => y(d[0]) - y(d[1]))




            // need to create dictionary which maps from rectangle to window + cx
            d3.selectAll('g.layer')
                // cursor mouseover on rectangles
                .on('mouseover', d => {

                    div
                        .transition()
                        .duration(200)
                        .style('opacity', 0.9);
                    div
                        .text(d.key)
                        .style('left', d3.event.pageX - 5 + 'px')
                        .style('top', d3.event.pageY - 20 + 'px');
                })
                .on('mouseout', () => {
                    div
                        .transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            d3.selectAll('rect').on('click', function (d) {
                var thiscx = get_cx(d)
                var windowSize = d.data.WindowSize
                displaySents(thiscx, windowSize)
            }).on('dblclick', function (d) {
                if (selectedCX != false) {
                    update(input, 500, false)
                } else {
                    update(input, 200, get_cx(d))
                }
            })

            function displaySents(cx, windowSize) {
                d3.select('.cx').text(cx)
                d3.select('#windowsize').text(windowSize)
                d3.selectAll('.sentence').remove()
                var sentences = sentencedata[windowSize][cx]
                sentences.forEach(function (sent) {
                    d3.select('#sentences')
                        .append('p')
                        .attr('class', 'sentence')
                        .text(sent)
                })
            }

            // get windowsize, cx in order to display sentences
            d3.selectAll('rect').on('mouseover', function (d) {
                var thiscx = get_cx(d)
                var classSelection = d3.selectAll('.' + formatKeyClass(thiscx))
                d3.selectAll('g.layer').attr('opacity', .25)
                d3.selectAll('.legend').attr('opacity', .25)
                d3.selectAll('.text').attr('opacity', .25)
                classSelection.attr('opacity', 1)
            }).on('mouseout', function (d) {
                var thiscx = get_cx(d)
                var classSelection = d3.selectAll('.' + formatKeyClass(thiscx))
                d3.selectAll('g.layer').attr('opacity', 1)
                d3.selectAll('.legend').attr('opacity', 1)
                d3.selectAll('.text').attr('opacity', 1)
                classSelection.attr('opacity', 1)
            })

            function get_cx(d) {
                var windowSize = d.data.WindowSize
                var y0 = d[0]
                var y1 = d[1]
                // search through stack
                var thiscx = 'undefined'
                d3.stack().keys(keys)(data).forEach(function (cxarray) {
                    var cx = cxarray.key
                    cxarray.forEach(function (miniarray, i) {
                        if ((miniarray[0] == y0) && (miniarray[1] == y1)) {
                            var thisWindowSize = miniarray.data.WindowSize
                            if (thisWindowSize == windowSize) {
                                thiscx = cx
                            }
                        }
                    })
                })
                return thiscx
            }

            var text = svg.selectAll(".text")
                .data(data, d => d.WindowSize);

            text.exit().remove()

            text.enter().append("text")
                .attr("class", function (d, i) {
                    if (i != 3) {
                        return "text"
                    } else {
                        return 'destroyonupdate'
                    }
                })
                .attr("text-anchor", "middle")
                .merge(text)
                .transition().duration(speed)
                .attr("x", d => x(d.WindowSize) + x.bandwidth() / 2)
                .attr("y", d => y(d.total) - 5)
                .attr('transform', function (d, i) {
                    if (i == 3) {
                        return 'translate(0,35)'
                    }
                })
                .text(function (d, i) {
                    if (i != 3) {
                        return d.total
                    } else {
                        return input
                    }
                })

            var size = 20

            d3.selectAll('.legend').remove()

            // Add one dot in the legend for each name.
            var circles = svg.selectAll("mydots")
                .data(cxx)
            circles.exit().remove()
            circles
                .enter().append("circle")
                // .attr('class', function(d, i) {'legend'})
                .attr("cx", function (d, i) {
                    if (i > 16) {
                        return width - 20
                    }
                    return width - 140
                })
                .attr("cy", function (d, i) {
                    if (i > 16) {
                        return 25 + i * 25 - 425
                    }
                    return 25 + i * 25
                }) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("r", 7)
                .style("fill", function (d) { return z(d) })
                .attr('class', function (d, i) { return 'legend ' + formatKeyClass(d) })

            // Add one dot in the legend for each name.
            var labels = svg.selectAll("mylabels")
                .data(cxx)
            labels.exit().remove()
            labels.enter().append("text")
                .style('font-size',14)
                // .attr('class', 'legend')
                .attr("x", function (d, i) {
                    if (i > 16) {
                        return width - 5
                    }
                    return width - 125
                })
                .attr("y", function (d, i) {
                    if (i > 16) {
                        return 25 + i * 25 - 425
                    }
                    return 25 + i * 25
                }) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function (d) { return z(d) })
                .text(function (d) { return d })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .attr('class', function (d, i) { return 'legend ' + formatKeyClass(d) })



            d3.selectAll('circle').on('mouseover', function (d) {
                legendMouseover(d3.select(this))
            }).on('mouseout', function () {
                legendMouseout(d3.select(this))
            }).on('click', function (d) {
                var thisSelection = d3.select(this)
                if (selectedCX != false) {
                    update(input, 500, false)
                } else {
                    update(input, 200, d)
                }
            })

            d3.selectAll('text').on('mouseover', function (d) {
                legendMouseover(d3.select(this))
            }).on('mouseout', function () {
                legendMouseout(d3.select(this))
            }).on('click', function (d) {
                var thisSelection = d3.select(this)
                if (selectedCX != false) {
                    update(input, 500, false)
                } else {
                    update(input, 200, d)
                }
            })

            function legendMouseover(selected) {
                var thisclass = selected.attr('class').replace('legend ', '').replace('layer ', '')
                d3.selectAll('g.layer').attr('opacity', .25)
                d3.selectAll('.legend').attr('opacity', .25)
                d3.selectAll('.text').attr('opacity', .25)
                d3.selectAll('.' + thisclass).attr('opacity', 1)
            }
            function legendMouseout(selected) {
                var thisclass = selected.attr('class').replace('legend ', '').replace('layer ', '')
                d3.selectAll('g.layer').attr('opacity', 1)
                d3.selectAll('.legend').attr('opacity', 1)
                d3.selectAll('.text').attr('opacity', 1)
                d3.selectAll('.' + thisclass).attr('opacity', 1)
            }
            function formatKeyClass(key) {
                return key.replaceAll('/','').replaceAll('+', '').replaceAll(' ', '').replaceAll(',','').toLowerCase()
            }
        }
    }
}

$(document).ready(function() {
    // $("#verb").select2();
    var prefixSorter = function(results) {
        if (!results || results.length == 0)
          return results
      
        // Find the open select2 search field and get its value
        var term = document.querySelector('.select2-search__field').value.toLowerCase()

        if (term.length == 0)
          return results
      
        return results.sort(function(a, b) {
          aHasPrefix = a.text.toLowerCase().indexOf(term) == 0
          bHasPrefix = b.text.toLowerCase().indexOf(term) == 0
      
          return bHasPrefix - aHasPrefix // If one is prefixed, push to the top. Otherwise, no sorting.
        })
      }
      
      $('#verb').select2({ sorter: prefixSorter })

    d3.csv('/static/js/src/data/verbHistogramData.csv').then(d => chart(d))
})