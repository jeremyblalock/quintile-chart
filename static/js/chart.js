window.AggregateChart = function(config) {

    var wrapper = config.el ? d3.select(config.el) : d3.select('#' + config.id),
        data = config.data || {},
        scale = 0, offset = 0,
        self = this;

    self.format = config.format || Math.round;

    this.setData = function(newData, time) {
        data = newData;
        for (var i = 0; i < data.length; i += 1) {
            data[i].value = d3.sum(data[i].values,
                function(d) { return d.value });
            data[i].max = Math.max(data[i].value,
                d3.max(data[i].values, function(d) { return d.value }));
            data[i].min = Math.min(data[i].value,
                d3.min(data[i].values, function(d) { return d.value }));
        }
        this.update(time);
    }

    this.init = function() {
        wrapper.selectAll('div').remove();
        this.el = wrapper.append('div').classed('aggregate-chart', true);
        this.el.style({
            position: 'relative'
        });
        this.xAxisSvg = this.el.append('div').classed('x-axis-wrapper', true)
            .append('svg');
        this.xAxis = d3.svg.axis().tickSize(-1000);
        this.xAxis.orient('top');
        this.xAxis.scale(d3.scale.linear().domain([0, 0]).range([0, 0]));
        this.xAxisGroup = this.xAxisSvg.append('g')
            .attr('transform', 'translate(50 50)');
        this.xAxisGroup.call(this.xAxis);
        this.rows = this.el.append('div').classed('aggregate-chart-rows', true);
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
        var barWidth = (totalWidth - labelMaxWidth - labelPadding -
            accordionWidth - tooltipWidth);
        scale = barWidth / (max - min);
        offsetSub = Math.round(-1 * min * scale);
        offset = offsetSub + labelMaxWidth + labelPadding + accordionWidth;
        offsetRight = totalWidth - offset - 1;

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
        var chartRows = this.rows.selectAll('.aggregate-chart-row')
                            .data(data);
        var enter = chartRows.enter().append('div')
                .classed('aggregate-chart-row', true)
                .style({
                    position: 'relative',
                    'padding-left':
                        (labelMaxWidth + labelPadding + accordionWidth) + 'px'
                    });
        var arrows = enter.append('span').classed('aggregate-accordion-button', true)
            .html('&#9654;')
            .style({
                position: 'absolute',
                left: '5px'
            }).on('click', function(sel, n) {
                var sel2;
                chartRows.every(function(d) { sel2 = d3.select(d[n]); });
                sel2.classed('expanded', !sel2.classed('expanded'));
            });

        // Add text row labels
        enter.append('div').classed('aggregate-chart-label', true)
            .style('display', 'inline-block')
            .text(function(d) {
                return d.label
            }).style({
                'margin-left': -1 * (labelMaxWidth + labelPadding) + 'px'
            }).on('click', function(sel, n) {
                var sel2;
                chartRows.every(function(d) { sel2 = d3.select(d[n]); });
                sel2.classed('expanded', !sel2.classed('expanded'));
            });

        // Create the bar for positive effects
        enter.append('div').classed('aggregate-chart-bar', true).classed('positive', true)
            .style({
                position: 'absolute',
                background: '#7d7',
                top: 0,
                height: '1em',
                left: '50%'
            }).append('div').classed('aggregate-tooltip', true);

        // Create the bar for negative effects
        enter.append('div').classed('aggregate-chart-bar', true).classed('negative', true)
            .style({
                position: 'absolute',
                background: '#f77',
                top: 0,
                height: '1em',
                right: '50%'
            });

        enter.append('div').classed('aggregate-breakdown', true);

        var breakdowns = chartRows.select('.aggregate-breakdown');
        var breakdownItems = breakdowns.selectAll('.aggregate-breakdown-item')
                .data(function(d) { return d.values });
        var breakdownItemsEnter = breakdownItems.enter().append('div')
                                    .classed('aggregate-breakdown-item', true)
                                    .style({
                                        position: 'relative'
                                    });
        breakdownItemsEnter.append('div').classed('aggregate-chart-label', true)
                .text(function(d) { return d.label })
                .style({
                    'margin-left': -1 * (labelMaxWidth + labelPadding) + 'px'
                });


        // Create bar for positive effects in breakdown
        breakdownItemsEnter.append('div').classed('aggregate-chart-bar', true)
            .classed('positive', true)
            .style({
                position: 'absolute',
                background: '#cfc',
                top: 0,
                height: '1em',
                left: '50%'
            }).append('div').classed('aggregate-tooltip', true);

        // Create the bar for negative effects in breakdown
        breakdownItemsEnter.append('div').classed('aggregate-chart-bar', true)
            .classed('negative', true)
            .style({
                position: 'absolute',
                background: '#fcc',
                top: 0,
                height: '1em',
                right: '50%'
            });

        // Change the widths & offsets of bars
        chartRows.select('.aggregate-chart-bar.positive').transition().duration(time)
            .style({
                width: function(d) {
                    return d.value > 0 ? scale * d.value + 'px' : '0px';
                },
                left: offset + 'px'
            });
        chartRows.select('.aggregate-chart-bar.negative').transition().duration(time)
            .style({
                width: function(d) { return d.value < 0 ?
                    scale * -1 * d.value + 'px' : '0px' },
                right: offsetRight + 'px' //(max * scale + tooltipWidth) + 'px'
            });

        // Change the widths & offsets of bars
        breakdownItems.select('.aggregate-chart-bar.positive').transition().duration(time)
            .style({ width: function(d) { return d.value > 0 ?
                    scale * d.value + 'px' : '0px' },
                left: offsetSub + 'px'
            });
        breakdownItems.select('.aggregate-chart-bar.negative').transition().duration(time)
            .style({
                width: function(d) { return d.value < 0 ?
                    scale * -1 * d.value + 'px' : '0px' },
                right: offsetRight + 'px' //(max * scale + tooltipWidth) + 'px'
            });
        chartRows.select('.aggregate-tooltip')
            .text(function(d) { return self.format(d.value) });
        breakdownItems.select('.aggregate-tooltip')
            .text(function(d) { return self.format(d.value) });

        
        this.xAxis.scale(d3.scale.linear().domain([min, max]).range([0, barWidth]));
        this.xAxisGroup.transition().duration(time).call(this.xAxis);
        this.xAxisGroup.attr('transform', 'translate(' + (labelMaxWidth + labelPadding + accordionWidth) + ', 30)');

    }

    this.init();
    d3.select(window).on('resize', function() {
        self.update(0);
    });

};
