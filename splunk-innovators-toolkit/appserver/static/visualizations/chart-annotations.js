/**
 * Splunk Innovators Toolkit - Chart Annotations
 * Adds annotation/marker capability to Splunk charts. Overlays vertical line
 * markers (e.g., deployment times, incident start) with labels on top of
 * existing chart SVG elements.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add annotation data to any panel containing a chart:
 *    <html>
 *      <div id="chart-annotations"
 *           data-target-panel="my_chart_panel"
 *           data-annotations='[
 *             {"time":"2025-03-01T10:30:00","label":"Deploy v2.1","color":"#FD1875","style":"solid"},
 *             {"time":"2025-03-01T14:00:00","label":"Incident Start","color":"#DC3545","style":"dashed"},
 *             {"time":"2025-03-01T16:30:00","label":"Incident Resolved","color":"#5CC05C","style":"solid"},
 *             {"time":"2025-03-01T18:00:00","label":"Config Change","color":"#F7B500","style":"dotted"}
 *           ]'>
 *      </div>
 *    </html>
 *
 * 2. Reference:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/chart-annotations.js">
 *
 * 3. Alternative: Add annotations directly to a panel div via class:
 *    <panel>
 *      <chart>
 *        <option name="charting.chart">line</option>
 *      </chart>
 *    </panel>
 *    Then the div with data-annotations will overlay on the nearest chart.
 *
 * 4. Search binding: data-search-id. Fields: _time (or time), label, color, style
 *
 * Annotation styles: solid, dashed, dotted
 * Default color: #FD1875 (Splunk pink)
 */

require([
    'jquery'
], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // ========================================
    // Configuration
    // ========================================

    var DEFAULTS = {
        color: '#FD1875',
        style: 'solid',
        labelFontSize: 10,
        labelBg: '#2B3033',
        labelBorder: '#3C444D',
        labelText: '#FFFFFF',
        lineWidth: 1.5,
        lineOpacity: 0.8,
        flagSize: 8
    };

    var DASH_PATTERNS = {
        solid: 'none',
        dashed: '6,4',
        dotted: '2,3'
    };

    // ========================================
    // ChartAnnotations Class
    // ========================================

    function ChartAnnotations(configElement) {
        this.$config = $(configElement);
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.annotations = [];
        this.retryCount = 0;
        this.maxRetries = 30; // 30 * 500ms = 15s max wait
        this.init();
    }

    ChartAnnotations.prototype.init = function() {
        var self = this;

        // Parse annotations
        try {
            this.annotations = JSON.parse(this.$config.attr('data-annotations') || '[]');
        } catch(e) {
            console.error('[SIT Chart Annotations] Failed to parse annotations:', e);
            return;
        }

        // Parse annotation times
        this.annotations.forEach(function(ann) {
            ann._time = new Date(ann.time).getTime();
            ann.color = ann.color || DEFAULTS.color;
            ann.style = ann.style || DEFAULTS.style;
        });

        // Find the target chart
        var targetPanelId = this.$config.attr('data-target-panel');
        this._findAndOverlay(targetPanelId);
    };

    ChartAnnotations.prototype._findAndOverlay = function(targetPanelId) {
        var self = this;

        // Strategy 1: specific panel ID
        if (targetPanelId) {
            var $panel = $('#' + targetPanelId);
            if ($panel.length) {
                this._waitForChart($panel);
                return;
            }
        }

        // Strategy 2: closest previous sibling chart panel
        var $parent = this.$config.closest('.dashboard-panel');
        if ($parent.length) {
            this._waitForChart($parent);
            return;
        }

        // Strategy 3: find the first chart on the page
        var $charts = $('.chart-container, .highcharts-container, [data-viz-type="charting"]');
        if ($charts.length) {
            this._waitForChart($charts.first().closest('.dashboard-panel'));
            return;
        }

        // Strategy 4: retry with polling
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(function() { self._findAndOverlay(targetPanelId); }, 500);
        } else {
            console.warn('[SIT Chart Annotations] Could not find target chart after ' + this.maxRetries + ' retries');
        }
    };

    ChartAnnotations.prototype._waitForChart = function($panel) {
        var self = this;

        // Look for the SVG inside the chart
        var $svg = $panel.find('svg.highcharts-root, svg[class*="chart"], .chart-container svg').first();
        if (!$svg.length) {
            $svg = $panel.find('svg').first();
        }

        if ($svg.length && $svg[0].getBBox) {
            this._overlay($svg, $panel);
        } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(function() { self._waitForChart($panel); }, 500);
        }
    };

    ChartAnnotations.prototype._overlay = function($svg, $panel) {
        var self = this;
        var svg = $svg[0];

        // Determine the chart's plot area
        var plotArea = this._findPlotArea(svg);
        if (!plotArea) {
            console.warn('[SIT Chart Annotations] Could not determine plot area');
            return;
        }

        // Determine time range from the chart's x-axis
        var timeRange = this._extractTimeRange(svg, plotArea);
        if (!timeRange) {
            console.warn('[SIT Chart Annotations] Could not extract time range from chart');
            return;
        }

        // Create overlay SVG group
        var group = document.createElementNS(this.svgNS, 'g');
        group.setAttribute('class', 'sit-chart-annotations');

        this.annotations.forEach(function(ann) {
            if (ann._time < timeRange.min || ann._time > timeRange.max) return;

            var xRatio = (ann._time - timeRange.min) / (timeRange.max - timeRange.min);
            var x = plotArea.x + xRatio * plotArea.width;

            self._drawAnnotation(group, ann, x, plotArea);
        });

        svg.appendChild(group);

        // Also watch for chart re-renders
        var chartObserver = new MutationObserver(function(mutations) {
            var existingGroup = svg.querySelector('.sit-chart-annotations');
            if (existingGroup) {
                existingGroup.remove();
            }
            // Re-overlay after a short delay
            setTimeout(function() { self._overlay($svg, $panel); }, 200);
        });

        // Only observe direct children changes (chart re-renders), not our own additions
        var $plotGroup = $svg.find('.highcharts-series-group, .highcharts-plot-background');
        if ($plotGroup.length) {
            chartObserver.observe($plotGroup[0], { childList: true });
        }
    };

    ChartAnnotations.prototype._findPlotArea = function(svg) {
        // Try Highcharts plot background
        var plotBg = svg.querySelector('.highcharts-plot-background');
        if (plotBg) {
            var bbox = plotBg.getBBox();
            return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
        }

        // Try Splunk chart area
        var chartArea = svg.querySelector('.chart-area, .plot-area, rect[class*="plot"]');
        if (chartArea) {
            var b = chartArea.getBBox();
            return { x: b.x, y: b.y, width: b.width, height: b.height };
        }

        // Fallback: estimate from SVG dimensions with margins
        var svgWidth = parseFloat(svg.getAttribute('width')) || svg.viewBox.baseVal.width || 800;
        var svgHeight = parseFloat(svg.getAttribute('height')) || svg.viewBox.baseVal.height || 300;
        return {
            x: 60,
            y: 20,
            width: svgWidth - 100,
            height: svgHeight - 60
        };
    };

    ChartAnnotations.prototype._extractTimeRange = function(svg, plotArea) {
        // Try Highcharts x-axis labels
        var xLabels = svg.querySelectorAll('.highcharts-xaxis-labels text, .highcharts-axis-labels text');
        if (xLabels.length >= 2) {
            var times = [];
            var positions = [];
            xLabels.forEach(function(label) {
                var text = label.textContent.trim();
                var parsed = Date.parse(text);
                if (!isNaN(parsed)) {
                    times.push(parsed);
                    positions.push(parseFloat(label.getAttribute('x')) || 0);
                }
            });

            if (times.length >= 2) {
                // Extrapolate full range from label positions
                var firstX = positions[0];
                var lastX = positions[positions.length - 1];
                var firstTime = times[0];
                var lastTime = times[times.length - 1];

                if (lastX !== firstX && lastTime !== firstTime) {
                    var pixelsPerMs = (lastX - firstX) / (lastTime - firstTime);
                    var minTime = firstTime - (firstX - plotArea.x) / pixelsPerMs;
                    var maxTime = firstTime + (plotArea.x + plotArea.width - firstX) / pixelsPerMs;
                    return { min: minTime, max: maxTime };
                }
            }
        }

        // Fallback: use annotation times themselves to define the range
        if (this.annotations.length > 0) {
            var annotTimes = this.annotations.map(function(a) { return a._time; }).filter(function(t) { return !isNaN(t); });
            if (annotTimes.length > 0) {
                var minT = Math.min.apply(null, annotTimes);
                var maxT = Math.max.apply(null, annotTimes);
                var padding = (maxT - minT) * 0.1 || 3600000;
                return { min: minT - padding, max: maxT + padding };
            }
        }

        return null;
    };

    ChartAnnotations.prototype._drawAnnotation = function(group, ann, x, plotArea) {
        var dashArray = DASH_PATTERNS[ann.style] || DASH_PATTERNS.solid;

        // Vertical line
        var line = document.createElementNS(this.svgNS, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', plotArea.y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', plotArea.y + plotArea.height);
        line.setAttribute('stroke', ann.color);
        line.setAttribute('stroke-width', DEFAULTS.lineWidth);
        line.setAttribute('stroke-opacity', DEFAULTS.lineOpacity);
        if (dashArray !== 'none') {
            line.setAttribute('stroke-dasharray', dashArray);
        }
        group.appendChild(line);

        // Flag/marker at top
        var flag = document.createElementNS(this.svgNS, 'path');
        var fs = DEFAULTS.flagSize;
        var fy = plotArea.y - 2;
        flag.setAttribute('d', 'M' + x + ',' + fy +
            ' L' + (x + fs) + ',' + (fy - fs) +
            ' L' + (x + fs) + ',' + (fy - fs * 2.5) +
            ' L' + (x - fs) + ',' + (fy - fs * 2.5) +
            ' L' + (x - fs) + ',' + (fy - fs) +
            ' Z');
        flag.setAttribute('fill', ann.color);
        flag.setAttribute('fill-opacity', '0.9');
        flag.style.cursor = 'pointer';
        group.appendChild(flag);

        // Label background
        var labelText = ann.label || '';
        var labelWidth = labelText.length * 6 + 16;
        var labelHeight = 20;
        var labelX = x - labelWidth / 2;
        var labelY = plotArea.y - DEFAULTS.flagSize * 2.5 - labelHeight - 4;

        var labelBg = document.createElementNS(this.svgNS, 'rect');
        labelBg.setAttribute('x', labelX);
        labelBg.setAttribute('y', labelY);
        labelBg.setAttribute('width', labelWidth);
        labelBg.setAttribute('height', labelHeight);
        labelBg.setAttribute('rx', '4');
        labelBg.setAttribute('ry', '4');
        labelBg.setAttribute('fill', DEFAULTS.labelBg);
        labelBg.setAttribute('stroke', ann.color);
        labelBg.setAttribute('stroke-width', '1');
        labelBg.setAttribute('stroke-opacity', '0.6');
        labelBg.style.display = 'none';
        group.appendChild(labelBg);

        // Label text
        var text = document.createElementNS(this.svgNS, 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', labelY + 14);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', DEFAULTS.labelText);
        text.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        text.setAttribute('font-size', DEFAULTS.labelFontSize);
        text.setAttribute('font-weight', '500');
        text.textContent = labelText;
        text.style.display = 'none';
        group.appendChild(text);

        // Hover interaction: show label on hover over flag/line
        var hoverZone = document.createElementNS(this.svgNS, 'rect');
        hoverZone.setAttribute('x', x - 8);
        hoverZone.setAttribute('y', plotArea.y - DEFAULTS.flagSize * 3);
        hoverZone.setAttribute('width', 16);
        hoverZone.setAttribute('height', plotArea.height + DEFAULTS.flagSize * 3);
        hoverZone.setAttribute('fill', 'transparent');
        hoverZone.style.cursor = 'pointer';
        group.appendChild(hoverZone);

        $(hoverZone).add(flag).on('mouseenter', function() {
            labelBg.style.display = '';
            text.style.display = '';
            line.setAttribute('stroke-width', DEFAULTS.lineWidth + 1);
            line.setAttribute('stroke-opacity', '1');
        }).on('mouseleave', function() {
            labelBg.style.display = 'none';
            text.style.display = 'none';
            line.setAttribute('stroke-width', DEFAULTS.lineWidth);
            line.setAttribute('stroke-opacity', DEFAULTS.lineOpacity);
        });
    };

    // ========================================
    // Initialization
    // ========================================

    function initAnnotations() {
        $('[id*="chart-annotations"], [data-viz="chart-annotations"], [data-annotations]').each(function() {
            var $el = $(this);
            if ($el.data('sit-annotations-initialized')) return;
            if (!$el.attr('data-annotations')) return;
            $el.data('sit-annotations-initialized', true);

            // Search binding
            var searchId = $el.attr('data-search-id');
            if (searchId && mvc) {
                try {
                    var sm = mvc.Components.get(searchId);
                    if (sm) {
                        var results = sm.data('results', { count: 0 });
                        results.on('data', function() {
                            var rows = results.data().rows;
                            var fields = results.data().fields;
                            var fi = {};
                            fields.forEach(function(f, i) { fi[f] = i; });
                            var anns = rows.map(function(row) {
                                return {
                                    time: row[fi['_time']] || row[fi['time']] || '',
                                    label: row[fi['label']] || '',
                                    color: row[fi['color']] || DEFAULTS.color,
                                    style: row[fi['style']] || DEFAULTS.style
                                };
                            });
                            $el.attr('data-annotations', JSON.stringify(anns));
                            new ChartAnnotations($el[0]);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Chart Annotations] Could not bind to search:', searchId, e);
                }
            }

            new ChartAnnotations($el[0]);
        });
    }

    // Wait for charts to render before attempting annotation overlay
    setTimeout(initAnnotations, 2000);

    var observer = new MutationObserver(function() {
        setTimeout(initAnnotations, 1000);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('[SIT] Chart Annotations loaded');
});
