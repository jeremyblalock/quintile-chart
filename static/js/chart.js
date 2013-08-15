window.AggregateChart = function(config) {

    var wrapper = d3.select('#' + config.id),
        data = config.data || {},
        scale = 0, offset = 0,
        self = this;

    this.setData = function(newData, time) {
        data = newData;
        for (var i = 0; i < data.length; i += 1) {
            data[i].value = d3.sum(data[i].values, function(d) { return d.value });
            data[i].max = Math.max(data[i].value,
                d3.max(data[i].values, function(d) { return d.value }));
            data[i].min = Math.min(data[i].value,
                d3.min(data[i].values, function(d) { return d.value }));
        }
        this.update(time);
    }

    this.init = function() {
        wrapper.selectAll('div').remove();
        this.el = wrapper.append('div');
        this.el.style({
            position: 'relative'
        });
        this.yAxis = this.el.append('div').classed('y-axis', true)
            .style({
                position: 'absolute',
                top: 0,
                bottom: 0,
                'border-left': '1px solid rgba(0, 0, 0, .2)',
                left: '50%'
            });
    }

    this.update = function(time) {

        if (typeof time == 'undefined') {
            time = 400;
        }

        // Set up widths, to create fluid layout
        var totalWidth = this.el.node().clientWidth;
        var labelPadding = 20;
        var labelMaxWidth = 120;
        var accordionWidth = 30;
        var tooltipWidth = 80;

        // TODO: Incorporate the individual effects, since somemay surpass
        //  the sum values maximums/minimums.
        var max = Math.max(0, d3.max(data, function(d) { return d.max })),
            min = Math.min(0, d3.min(data, function(d) { return d.min }));
        scale = (totalWidth - labelMaxWidth - labelPadding -
            accordionWidth - tooltipWidth) / (max - min);
        offset = -1 * min * scale + labelMaxWidth + labelPadding
            + accordionWidth;

        // COMMENTING TO SIMPLIFY, FOR NOW
        // Calculate the width of the label column
        // TODO: include sub-item labels
        //this.el.selectAll('.chart-label').every(function(divs) {
        //    divs.forEach(function(div) {
        //        if (div.clientWidth > labelMaxWidth) {
        //            labelMaxWidth = div.clientWidth;
        //        }
        //    });
        //});

        // Selects
        var chartRows = this.el.selectAll('.chart-row')
                            .data(data);
        var enter = chartRows.enter().append('div')
                .classed('chart-row', true)
                .style({
                    position: 'relative',
                    'padding-left':
                        (labelMaxWidth + labelPadding + accordionWidth) + 'px'
                    });
        var arrows = enter.append('span').classed('accordion-button', true)
            .html('&#9654;')
            .style({
                position: 'absolute',
                left: '0px'
            }).on('click', function(sel, n) {
                var sel2;
                chartRows.every(function(d) { sel2 = d3.select(d[n]); });
                sel2.classed('expanded', !sel2.classed('expanded'));
            });

        // Add text row labels
        enter.append('div').classed('chart-label', true)
            .style('display', 'inline-block')
            .text(function(d) {
                return d.label
            }).style({
                'margin-left': -1 * (labelMaxWidth + labelPadding) + 'px'
            });

        // Create the bar for positive effects
        enter.append('div').classed('bar', true).classed('positive', true)
            .style({
                position: 'absolute',
                background: '#7d7',
                top: 0,
                height: '1em',
                left: '50%'
            }).append('div').classed('tooltip', true);

        // Create the bar for negative effects
        enter.append('div').classed('bar', true).classed('negative', true)
            .style({
                position: 'absolute',
                background: '#f77',
                top: 0,
                height: '1em',
                right: '50%'
            });

        enter.append('div').classed('breakdown', true);

        var breakdowns = chartRows.select('.breakdown');
        var breakdownItems = breakdowns.selectAll('.breakdown-item')
                .data(function(d) { return d.values });
        var breakdownItemsEnter = breakdownItems.enter().append('div')
                                    .classed('breakdown-item', true)
                                    .style({
                                        position: 'relative'
                                    });
        breakdownItemsEnter.append('div').classed('chart-label', true)
                .text(function(d) { return d.label })
                .style({
                    'margin-left': -1 * (labelMaxWidth + labelPadding) + 'px'
                });


        // Create bar for positive effects in breakdown
        breakdownItemsEnter.append('div').classed('bar', true).classed('positive', true)
            .style({
                position: 'absolute',
                background: '#cfc',
                top: 0,
                height: '1em',
                left: '50%'
            }).append('div').classed('tooltip', true);
        breakdownItemsEnter.append('div').classed('breakdown', true);

        // Create the bar for negative effects in breakdown
        breakdownItemsEnter.append('div').classed('bar', true).classed('negative', true)
            .style({
                position: 'absolute',
                background: '#fcc',
                top: 0,
                height: '1em',
                right: '50%'
            });

        // Change the widths & offsets of bars
        chartRows.select('.bar.positive').transition().duration(time)
            .style({
                width: function(d) { return d.value > 0 ?
                    scale * d.value + 'px' : '0px' },
                left: offset + 'px'
            });
        chartRows.select('.bar.negative').transition().duration(time)
            .style({
                width: function(d) { return d.value < 0 ?
                    scale * -1 * d.value + 'px' : '0px' },
                right: (max * scale + tooltipWidth) + 'px'
            });

        // Change the widths & offsets of bars
        breakdownItems.select('.bar.positive').transition().duration(time)
            .style({
                width: function(d) { return d.value > 0 ?
                    scale * d.value + 'px' : '0px' },
                left: -1 * min * scale + 'px'
            });
        breakdownItems.select('.bar.negative').transition().duration(time)
            .style({
                width: function(d) { return d.value < 0 ?
                    scale * -1 * d.value + 'px' : '0px' },
                right: (max * scale + tooltipWidth) + 'px'
            });
        this.yAxis.transition().duration(time)
            .style({
                left: offset + 'px'
            });
        chartRows.select('.tooltip')
            .text(function(d) { return Math.round(d.value) });
        breakdownItems.select('.tooltip')
            .text(function(d) { return Math.round(d.value) });

    }

    this.init();
    d3.select(window).on('resize', function() {
        self.update(0);
    });

};
