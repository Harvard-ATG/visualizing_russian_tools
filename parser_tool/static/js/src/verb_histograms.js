function chart(csv) {
    // Define the div for the tooltip
    const div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    // cx labels
    var keys = csv.columns.slice(2);

    // set of all verbs
    var verb = [...new Set(csv.map(d => d.Verb))]
    verb.sort(function (a, b) {
        return a.localeCompare(b);
    })

    // window sizes
    var states = [...new Set(csv.map(d => d.WindowSize))]
    // break down each case set into parts for color distribution
    var caseList = ['NOM', 'ACC', 'GEN', 'LOC', 'DAT', 'INST', 'INFINITIVE', ', что']
    function getCaseOfKey(cx) {
        var correctLabel = ''
        caseList.forEach(function (caseLabel) {
            if (cx.includes(caseLabel)) { correctLabel = caseLabel }
        })
        return correctLabel
    }
    // creating case sets
    var cxSets = Object()
    caseList.forEach(function (caseLabel) {
        cxSets[caseLabel] = []
    })
    keys.forEach(function (k) {
        var keyCase = getCaseOfKey(k)
        cxSets[keyCase].push(k)
    })
    caseList.forEach(function (caseLabel) {
        cxSets[caseLabel].reverse()
    })
    // master color chooser
    var yellows = d3.scaleLinear().domain([0, 1])
        .range(["white", "yellow"])
    var browns = d3.scaleLinear().domain([0, 1])
        .range(["white", "#6F4E37"])

    function getColor(label, isText) {
        var labelCase = getCaseOfKey(label)
        var caseSet = cxSets[labelCase]
        var indexOfLabel = caseSet.indexOf(label)
        var scaledVal = 1 - (indexOfLabel + 1) / (caseSet.length + 1) * .75
        if (labelCase == 'NOM') {
            return d3.interpolateReds(scaledVal)
        }
        if (labelCase == 'ACC') {
            if (isText) { return 'black' } else { return yellows(scaledVal) }
        }
        if (labelCase == 'GEN') {
            return d3.interpolateGreens(scaledVal)
        }
        if (labelCase == 'LOC') {
            return d3.interpolateBlues(scaledVal)
        }
        if (labelCase == 'DAT') {
            return d3.interpolatePurples(scaledVal)
        }
        if (labelCase == 'INST') {
            return browns(scaledVal)
        }
        if (labelCase == 'INFINITIVE') {
            return 'HotPink'
        }
        if (labelCase == ', что') {
            return 'gray'
        }
    }
    var options = d3.select("#verb").selectAll("option")
        .data(verb)
        .enter().append("option")
        .text(d => d)

    var svg = d3.select("#chart"),
        margin = { top: 35, left: 35, bottom: 50, right: 70 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .range([margin.left, width - 100 - margin.right])
        .padding(0.2)

    var y = d3.scaleLinear()
        .rangeRound([height - margin.bottom, margin.top])

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "x-axis")

    var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")

    var startingverb = 'работать'
    d3.select('#verb').property('value', startingverb)
    d3.selectAll('.theverb').text(startingverb)

    // write the graph!!!
    var cValue = d3.select('#complexity').property('value')
    update(startingverb, 0, false, cValue)

    $('#verb').on('select2:select', function (e) {
        d3.selectAll('.theverb').text(d3.select('#verb').property('value'))
        var cValue = d3.select('#complexity').property('value')
        update(this.value, 750, false, cValue)
    });

    d3.select('#randomize').on('click', function () {
        var randomIndex = Math.floor(Math.random() * verb.length)
        const randomVerb = verb[randomIndex]
        $('#verb').val(randomVerb)
        $('#verb').trigger('change');
        var cValue = d3.select('#complexity').property('value')
        update(randomVerb, 750, false, cValue)
    })

    d3.select('#complexity').on('change', function() {
        var cValue = d3.select(this).property('value')
        var selectedVerb = d3.select('#verb').property('value')
        update(selectedVerb, 750, false, cValue)
    })

    // update function // 
    function update(input, speed, selectedCX, complexity) {
        d3.json('/static/js/src/data/verbConstructions.json').then(cxdata => build_cxx(cxdata))
        d3.json('/static/js/src/data/verbHistogramSentences/' + input + '.json').then(sentdata => withSentences(sentdata, complexity))

        function build_cxx(cxdata) {
            var data = cxdata[0][input]

            d3.select('#aggregate').text('[ ' + data.aggregate + ' ]')

            d3.select('#use0').text(' ')
            d3.select('#use1').text(' ')
            d3.select('#use2').text(' ')

            if (data.separated.length == 0) {
                d3.select('#use0').text('Not Enough Data')
                d3.select('#use1').text(' ')
                d3.select('#use2').text(' ')
            }
            data.separated.forEach(function (cx, i) {
                d3.select('#use' + i).text(cx[1] + ' (' + cx[0] + ')')
            })
            d3.selectAll('.related').remove()

            if (data.relatedwords.length == 0) {
                d3.select('#wordcol0')
                    .append('p').attr('class', 'related').text('Not Enough Data')
            }
            data.relatedwords.forEach(function (word, i) {
                if (i < 10) {
                    d3.select('#wordcol0')
                        .append('p')
                        .attr('class', 'related')
                        .text(word[1] + ' (' + word[0] + ')')
                } else {
                    d3.select('#wordcol1')
                        .append('p')
                        .attr('class', 'related')
                        .text(word[1] + ' (' + word[0] + ')')
                }
            })
        }

        function withSentences(sentencedata, complexity) {
            // d3.selectAll('.verblabel').text(input)
            d3.selectAll('.destroyonupdate').remove()

            var newcsv = JSON.parse(JSON.stringify(csv))
            var data = newcsv.filter(f => f.Verb == input)

            // deleting datapoints which aren't for selected AP
            if (selectedCX != false) {
                var newData = []
                data.forEach(function (w) {
                    var newObj = new Object
                    for (const [key, val] of Object.entries(w)) {
                        if ((key == selectedCX) || ['Verb', 'WindowSize', 'total'].includes(key)) {
                            newObj[key] = val
                        } else {
                            newObj[key] = 0
                        }
                    }
                    newData.push(newObj)
                })
                data = newData
            }
            if (complexity == 'simple') {
                console.log('is simple')
                data.forEach(function(window) {
                    for (const [key, val] of Object.entries(window)) {
                        if (key != 'Verb' && key != 'WindowSize') {
                            if (window[key] < 5) {
                                window[key] = 0
                            }
                        }
                    }
                })
            }

            var keysInObjSet = new Set()
            data.forEach(function (w) {
                for (const [key, value] of Object.entries(w)) {
                    if (value > 0 && !(['WindowSize', 'total'].includes(key))) {
                        keysInObjSet.add(key)
                    }
                }
            })
            var keysInObj = [...keysInObjSet]
            var keysInOrder = []
            caseList.forEach(function (caseLabel) {
                cxSets[caseLabel].forEach(function (label) {
                    keysInOrder.push(label)
                })
            })
            var cxx = []
            keysInOrder.forEach(function (k) {
                if (keysInObj.includes(k)) {
                    cxx.push(k)
                }
            })

            // create totals
            data.forEach(function (d) {
                d.total = d3.sum(keysInOrder, k => +d[k])
                return d
            })

            y.domain([0, d3.max(data, d => d3.sum(keysInOrder, k => +d[k]))]).nice();

            svg.selectAll(".y-axis").transition().duration(speed)
                .call(d3.axisLeft(y).ticks(null, "s"))

            data.sort(d3.select("#sort").property("checked")
                ? (a, b) => b.total - a.total
                : (a, b) => states.indexOf(a.WindowSize) - states.indexOf(b.WindowSize))

            x.domain(data.map(d => d.WindowSize));

            svg.selectAll(".x-axis").transition().duration(speed)
                .call(d3.axisBottom(x).tickSizeOuter(0))

            var group = svg.selectAll("g.layer")
                .data(d3.stack().keys(keysInOrder)(data), d => d.key)
                .style('cursor', 'pointer')

            group.exit().remove()

            group.enter().append("g")
                // .classed("layer", true)
                .attr('class', function (d) {
                    return 'layer ' + formatKeyClass(d.key)
                })
                .attr("fill", d => getColor(d.key))
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
                var cValue = d3.select('#complexity').property('value')
                if (selectedCX != false) {
                    update(input, 500, false, cValue)
                } else {
                    update(input, 200, get_cx(d), cValue)
                }
            })

            function displaySents(cx, windowSize) {
                // d3.select('.theverb').text(d3.select('#verb').property('value'))
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
                d3.stack().keys(keysInOrder)(data).forEach(function (cxarray) {
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
                    if (i == 3) {
                        return input
                    }
                })
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
                .style("fill", function (d) { return getColor(d) })
                .attr('class', function (d, i) { return 'legend ' + formatKeyClass(d) })

            // Add one dot in the legend for each name.
            var labels = svg.selectAll("mylabels")
                .data(cxx)
            labels.exit().remove()
            labels.enter().append("text")
                .style('font-size', 14)
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
                .style("fill", function (d) { return getColor(d, true) })
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
                var cValue = d3.select('#complexity').property('value')
                if (selectedCX != false) {
                    update(input, 500, false, cValue)
                } else {
                    update(input, 200, d, cValue)
                }
            })

            d3.selectAll('text').on('mouseover', function (d) {
                legendMouseover(d3.select(this))
            }).on('mouseout', function () {
                legendMouseout(d3.select(this))
            }).on('click', function (d) {
                var thisSelection = d3.select(this)
                var cValue = d3.select('#complexity').property('value')
                if (selectedCX != false) {
                    update(input, 500, false, cValue)
                } else {
                    update(input, 200, d, cValue)
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
                return key.replaceAll('/', '').replaceAll('+', '').replaceAll(' ', '').replaceAll(',', '').toLowerCase()
            }
        }
    }
}

$(document).ready(function () {
    // sorting the select on typed search
    var prefixSorter = function (results) {
        if (!results || results.length == 0)
            return results
        // Find the open select2 search field and get its value
        var term = document.querySelector('.select2-search__field').value.toLowerCase()
        if (term.length == 0)
            return results
        return results.sort(function (a, b) {
            aHasPrefix = a.text.toLowerCase().indexOf(term) == 0
            bHasPrefix = b.text.toLowerCase().indexOf(term) == 0
            return bHasPrefix - aHasPrefix // If one is prefixed, push to the top. Otherwise, no sorting.
        })
    }
    $('#verb').select2({ sorter: prefixSorter })

    d3.csv('/static/js/src/data/verbHistogramData.csv').then(d => chart(d))
})