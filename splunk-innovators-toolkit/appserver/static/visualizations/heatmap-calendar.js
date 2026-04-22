/**
 * Splunk Innovators Toolkit - Heatmap Calendar
 * GitHub-style contribution heatmap calendar showing daily data as colored
 * squares in a calendar grid. Built with SVG for crisp rendering.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel to your dashboard:
 *    <html>
 *      <div id="heatmap-calendar"
 *           data-year="2025"
 *           data-color-scheme="pink"
 *           data-values='{
 *             "2025-01-15": 5,
 *             "2025-01-16": 12,
 *             "2025-02-03": 8,
 *             "2025-03-22": 20
 *           }'
 *           data-label="Events"
 *           style="width:100%;height:200px;overflow-x:auto;">
 *      </div>
 *    </html>
 *
 * 2. Reference this script:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/heatmap-calendar.js">
 *
 * 3. Search binding: add data-search-id attribute. Search should return _time and count fields.
 *    The _time field will be bucketed by day. Use: | timechart span=1d count
 *
 * Color schemes: pink, blue, green, orange, purple, red
 * data-max-value: Override auto-detected max (useful for consistent coloring)
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

    var CELL_SIZE = 13;
    var CELL_GAP = 3;
    var CELL_TOTAL = CELL_SIZE + CELL_GAP;
    var MONTH_LABEL_HEIGHT = 20;
    var DAY_LABEL_WIDTH = 30;
    var PADDING = 10;
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var COLOR_SCHEMES = {
        pink:   { empty: '#1a1a2e', levels: ['#2d1a2e', '#5c1a3e', '#8c1a4e', '#bc1a5e', '#FD1875'] },
        blue:   { empty: '#1a1a2e', levels: ['#1a2040', '#1a3060', '#1a4080', '#1a50a0', '#17A2B8'] },
        green:  { empty: '#1a1a2e', levels: ['#1a2e1a', '#2a4a2a', '#3a6a3a', '#4a8a4a', '#5CC05C'] },
        orange: { empty: '#1a1a2e', levels: ['#2e241a', '#4a3620', '#6a4e2a', '#8a6a34', '#FD7A2B'] },
        purple: { empty: '#1a1a2e', levels: ['#251a2e', '#3c1a4e', '#551a6e', '#6e1a8e', '#9B59B6'] },
        red:    { empty: '#1a1a2e', levels: ['#2e1a1a', '#4e2020', '#6e2a2a', '#8e3434', '#DC3545'] }
    };

    // ========================================
    // HeatmapCalendar Class
    // ========================================

    function HeatmapCalendar(container, options) {
        this.$container = $(container);
        this.year = options.year || new Date().getFullYear();
        this.values = options.values || {};
        this.colorScheme = COLOR_SCHEMES[options.colorScheme] || COLOR_SCHEMES.pink;
        this.maxValue = options.maxValue || null;
        this.label = options.label || 'events';
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.init();
    }

    HeatmapCalendar.prototype.init = function() {
        // Calculate max value if not provided
        if (!this.maxValue) {
            var vals = Object.values(this.values);
            this.maxValue = vals.length > 0 ? Math.max.apply(null, vals) : 10;
        }
        if (this.maxValue === 0) this.maxValue = 1;

        // Calculate dimensions
        var startDate = new Date(this.year, 0, 1);
        var endDate = new Date(this.year, 11, 31);
        var startDay = startDate.getDay();
        var totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        var totalWeeks = Math.ceil((totalDays + startDay) / 7);

        var svgWidth = DAY_LABEL_WIDTH + totalWeeks * CELL_TOTAL + PADDING * 2;
        var svgHeight = MONTH_LABEL_HEIGHT + 7 * CELL_TOTAL + PADDING * 2 + 50; // extra for legend

        // Create wrapper with background
        this.$wrapper = $('<div></div>').css({
            background: '#111215',
            borderRadius: '8px',
            padding: '16px',
            overflowX: 'auto'
        });

        // Title
        this.$title = $('<div></div>').css({
            fontFamily: '"Splunk Platform Sans", Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '12px'
        }).text(this.year + ' Activity — ' + this._totalCount() + ' total ' + this.label);
        this.$wrapper.append(this.$title);

        // Create SVG
        var svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.style.display = 'block';

        // Tooltip element
        this.tooltipGroup = document.createElementNS(this.svgNS, 'g');
        this.tooltipGroup.style.display = 'none';
        this.tooltipGroup.style.pointerEvents = 'none';

        var tooltipRect = document.createElementNS(this.svgNS, 'rect');
        tooltipRect.setAttribute('rx', '4');
        tooltipRect.setAttribute('ry', '4');
        tooltipRect.setAttribute('fill', '#2B3033');
        tooltipRect.setAttribute('stroke', '#3C444D');
        tooltipRect.setAttribute('stroke-width', '1');
        this.tooltipGroup.appendChild(tooltipRect);
        this._tooltipRect = tooltipRect;

        var tooltipText = document.createElementNS(this.svgNS, 'text');
        tooltipText.setAttribute('fill', '#FFFFFF');
        tooltipText.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        tooltipText.setAttribute('font-size', '11');
        this.tooltipGroup.appendChild(tooltipText);
        this._tooltipText = tooltipText;

        // Day labels (Mon, Wed, Fri)
        [1, 3, 5].forEach(function(dayIdx) {
            var text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', PADDING + DAY_LABEL_WIDTH - 6);
            text.setAttribute('y', PADDING + MONTH_LABEL_HEIGHT + dayIdx * CELL_TOTAL + CELL_SIZE - 2);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#6C757D');
            text.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
            text.setAttribute('font-size', '10');
            text.textContent = DAYS[dayIdx];
            svg.appendChild(text);
        }.bind(this));

        // Month labels
        var monthPositions = {};
        var currentDate = new Date(this.year, 0, 1);
        for (var d = 0; d < totalDays; d++) {
            var month = currentDate.getMonth();
            var dayOfWeek = currentDate.getDay();
            var weekNum = Math.floor((d + startDay) / 7);

            if (!monthPositions[month]) {
                monthPositions[month] = weekNum;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        Object.keys(monthPositions).forEach(function(month) {
            var weekX = monthPositions[month];
            var text = document.createElementNS(this.svgNS, 'text');
            text.setAttribute('x', PADDING + DAY_LABEL_WIDTH + weekX * CELL_TOTAL);
            text.setAttribute('y', PADDING + MONTH_LABEL_HEIGHT - 6);
            text.setAttribute('fill', '#6C757D');
            text.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
            text.setAttribute('font-size', '10');
            text.textContent = MONTHS[parseInt(month)];
            svg.appendChild(text);
        }.bind(this));

        // Draw cells
        currentDate = new Date(this.year, 0, 1);
        for (var i = 0; i < totalDays; i++) {
            var dow = currentDate.getDay();
            var week = Math.floor((i + startDay) / 7);

            var dateStr = this._formatDate(currentDate);
            var val = this.values[dateStr] || 0;
            var color = this._getColor(val);

            var x = PADDING + DAY_LABEL_WIDTH + week * CELL_TOTAL;
            var y = PADDING + MONTH_LABEL_HEIGHT + dow * CELL_TOTAL;

            var rect = document.createElementNS(this.svgNS, 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', CELL_SIZE);
            rect.setAttribute('height', CELL_SIZE);
            rect.setAttribute('rx', '2');
            rect.setAttribute('ry', '2');
            rect.setAttribute('fill', color);
            rect.setAttribute('data-date', dateStr);
            rect.setAttribute('data-value', val);
            rect.style.transition = 'fill 0.15s ease, transform 0.15s ease';
            rect.style.cursor = 'pointer';

            this._bindCellEvents(rect, svg);
            svg.appendChild(rect);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Legend
        this._drawLegend(svg, PADDING + DAY_LABEL_WIDTH, PADDING + MONTH_LABEL_HEIGHT + 7 * CELL_TOTAL + 16);

        svg.appendChild(this.tooltipGroup);
        this.$wrapper.append(svg);
        this.$container.empty().append(this.$wrapper);
    };

    HeatmapCalendar.prototype._bindCellEvents = function(rect, svg) {
        var self = this;
        $(rect).on('mouseenter', function(e) {
            var date = rect.getAttribute('data-date');
            var val = rect.getAttribute('data-value');
            var text = val + ' ' + self.label + ' on ' + date;

            self._tooltipText.textContent = text;
            var textLen = text.length * 6 + 16;

            var cx = parseFloat(rect.getAttribute('x'));
            var cy = parseFloat(rect.getAttribute('y'));

            self._tooltipRect.setAttribute('x', cx - 4);
            self._tooltipRect.setAttribute('y', cy - 26);
            self._tooltipRect.setAttribute('width', textLen);
            self._tooltipRect.setAttribute('height', 22);

            self._tooltipText.setAttribute('x', cx + 4);
            self._tooltipText.setAttribute('y', cy - 11);

            self.tooltipGroup.style.display = '';

            // Brighten the cell
            rect.setAttribute('stroke', '#FFFFFF');
            rect.setAttribute('stroke-width', '1.5');
        }).on('mouseleave', function() {
            self.tooltipGroup.style.display = 'none';
            rect.removeAttribute('stroke');
            rect.removeAttribute('stroke-width');
        });
    };

    HeatmapCalendar.prototype._drawLegend = function(svg, x, y) {
        // "Less" label
        var lessText = document.createElementNS(this.svgNS, 'text');
        lessText.setAttribute('x', x);
        lessText.setAttribute('y', y + CELL_SIZE - 2);
        lessText.setAttribute('fill', '#6C757D');
        lessText.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        lessText.setAttribute('font-size', '10');
        lessText.textContent = 'Less';
        svg.appendChild(lessText);

        // Color boxes
        var legendX = x + 32;
        var allColors = [this.colorScheme.empty].concat(this.colorScheme.levels);
        for (var i = 0; i < allColors.length; i++) {
            var rect = document.createElementNS(this.svgNS, 'rect');
            rect.setAttribute('x', legendX + i * (CELL_SIZE + 2));
            rect.setAttribute('y', y);
            rect.setAttribute('width', CELL_SIZE);
            rect.setAttribute('height', CELL_SIZE);
            rect.setAttribute('rx', '2');
            rect.setAttribute('ry', '2');
            rect.setAttribute('fill', allColors[i]);
            svg.appendChild(rect);
        }

        // "More" label
        var moreText = document.createElementNS(this.svgNS, 'text');
        moreText.setAttribute('x', legendX + allColors.length * (CELL_SIZE + 2) + 4);
        moreText.setAttribute('y', y + CELL_SIZE - 2);
        moreText.setAttribute('fill', '#6C757D');
        moreText.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        moreText.setAttribute('font-size', '10');
        moreText.textContent = 'More';
        svg.appendChild(moreText);
    };

    HeatmapCalendar.prototype._getColor = function(value) {
        if (value === 0) return this.colorScheme.empty;
        var ratio = value / this.maxValue;
        var idx = Math.min(Math.floor(ratio * this.colorScheme.levels.length), this.colorScheme.levels.length - 1);
        return this.colorScheme.levels[idx];
    };

    HeatmapCalendar.prototype._formatDate = function(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    };

    HeatmapCalendar.prototype._totalCount = function() {
        var sum = 0;
        var vals = this.values;
        Object.keys(vals).forEach(function(k) { sum += vals[k]; });
        return sum.toLocaleString();
    };

    // ========================================
    // Initialization
    // ========================================

    function initHeatmapCalendars() {
        $('[id*="heatmap-calendar"], [data-viz="heatmap-calendar"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-heatmap-initialized')) return;
            $el.data('sit-heatmap-initialized', true);

            var options = {
                year: parseInt($el.attr('data-year'), 10) || new Date().getFullYear(),
                colorScheme: $el.attr('data-color-scheme') || 'pink',
                label: $el.attr('data-label') || 'events',
                maxValue: parseInt($el.attr('data-max-value'), 10) || null,
                values: {}
            };

            // Parse inline values
            try {
                var rawValues = $el.attr('data-values');
                if (rawValues) {
                    options.values = JSON.parse(rawValues);
                }
            } catch(e) {
                console.error('[SIT Heatmap Calendar] Failed to parse values:', e);
            }

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

                            var vals = {};
                            rows.forEach(function(row) {
                                var timeVal = row[fi['_time']] || row[fi['date']];
                                var countVal = parseFloat(row[fi['count']] || row[fi['value']] || 0);
                                if (timeVal) {
                                    // Extract date part from ISO timestamp
                                    var dateStr = timeVal.substring(0, 10);
                                    vals[dateStr] = (vals[dateStr] || 0) + countVal;
                                }
                            });

                            options.values = vals;
                            new HeatmapCalendar($el[0], options);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Heatmap Calendar] Could not bind to search:', searchId, e);
                }
            }

            new HeatmapCalendar($el[0], options);
        });
    }

    var observer = new MutationObserver(function() { initHeatmapCalendars(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initHeatmapCalendars();

    console.log('[SIT] Heatmap Calendar loaded');
});
