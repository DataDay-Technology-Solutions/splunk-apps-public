/**
 * Splunk Innovators Toolkit - Timeline / Gantt Chart
 * Horizontal timeline visualization showing events/tasks as colored bars
 * on a time axis. Supports categories, hover details, and scrollable timeline.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel:
 *    <html>
 *      <div id="timeline-gantt"
 *           data-tasks='[
 *             {"id":"t1","label":"Deployment","start":"2025-03-01T08:00:00","end":"2025-03-01T09:30:00","category":"deploy","status":"complete"},
 *             {"id":"t2","label":"Monitoring","start":"2025-03-01T09:00:00","end":"2025-03-01T12:00:00","category":"ops","status":"active"},
 *             {"id":"t3","label":"Incident IR-001","start":"2025-03-01T10:30:00","end":"2025-03-01T11:45:00","category":"incident","status":"critical"},
 *             {"id":"t4","label":"Rollback Plan","start":"2025-03-01T11:00:00","end":"2025-03-01T13:00:00","category":"deploy","status":"pending"}
 *           ]'
 *           style="width:100%;height:350px;">
 *      </div>
 *    </html>
 *
 * 2. Reference:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/timeline-gantt.js">
 *
 * 3. Search binding: data-search-id. Fields: id, label, start (_time), end, category, status
 *
 * Categories: deploy (pink), ops (cyan), incident (red), maintenance (yellow), security (purple)
 * Status: complete, active, pending, critical
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

    var CATEGORY_COLORS = {
        deploy:      { bg: 'rgba(253,24,117,0.25)',  border: '#FD1875', text: '#FD1875' },
        ops:         { bg: 'rgba(23,162,184,0.25)',   border: '#17A2B8', text: '#17A2B8' },
        incident:    { bg: 'rgba(220,53,69,0.25)',    border: '#DC3545', text: '#DC3545' },
        maintenance: { bg: 'rgba(247,181,0,0.25)',    border: '#F7B500', text: '#F7B500' },
        security:    { bg: 'rgba(155,89,182,0.25)',   border: '#9B59B6', text: '#9B59B6' },
        'default':   { bg: 'rgba(253,122,43,0.25)',   border: '#FD7A2B', text: '#FD7A2B' }
    };

    var STATUS_INDICATORS = {
        complete: { icon: '\u2713', color: '#5CC05C' },
        active:   { icon: '\u25CF', color: '#17A2B8' },
        pending:  { icon: '\u25CB', color: '#6C757D' },
        critical: { icon: '\u26A0', color: '#DC3545' }
    };

    var ROW_HEIGHT = 44;
    var ROW_GAP = 6;
    var BAR_HEIGHT = 30;
    var HEADER_HEIGHT = 50;
    var SIDEBAR_WIDTH = 180;
    var TIME_TICK_HEIGHT = 30;

    // ========================================
    // GanttChart Class
    // ========================================

    function GanttChart(container, tasks) {
        this.$container = $(container);
        this.tasks = tasks || [];
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.init();
    }

    GanttChart.prototype.init = function() {
        if (this.tasks.length === 0) return;

        // Parse dates
        this.tasks.forEach(function(t) {
            t._start = new Date(t.start);
            t._end = new Date(t.end);
            if (isNaN(t._start.getTime())) t._start = new Date();
            if (isNaN(t._end.getTime())) t._end = new Date(t._start.getTime() + 3600000);
        });

        // Sort by start time
        this.tasks.sort(function(a, b) { return a._start - b._start; });

        // Compute time range
        this.minTime = this.tasks.reduce(function(m, t) { return Math.min(m, t._start.getTime()); }, Infinity);
        this.maxTime = this.tasks.reduce(function(m, t) { return Math.max(m, t._end.getTime()); }, -Infinity);

        // Add 5% padding on each side
        var range = this.maxTime - this.minTime;
        this.minTime -= range * 0.05;
        this.maxTime += range * 0.05;
        this.timeRange = this.maxTime - this.minTime;

        var containerWidth = this.$container.width() || 800;
        var chartWidth = Math.max(containerWidth - SIDEBAR_WIDTH - 20, 400);
        var chartHeight = HEADER_HEIGHT + TIME_TICK_HEIGHT + this.tasks.length * (ROW_HEIGHT + ROW_GAP) + 20;

        this.chartWidth = chartWidth;

        // Build wrapper
        this.$wrapper = $('<div></div>').css({
            background: '#111215',
            borderRadius: '8px',
            overflow: 'hidden',
            fontFamily: '"Splunk Platform Sans", Arial, sans-serif'
        });

        // Header
        var $header = $('<div></div>').css({
            padding: '14px 18px',
            borderBottom: '1px solid #2B3033',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });
        $header.append($('<span></span>').css({ color: '#FFF', fontSize: '14px', fontWeight: '600' }).text('Timeline'));
        $header.append($('<span></span>').css({ color: '#6C757D', fontSize: '11px' }).text(this.tasks.length + ' items'));
        this.$wrapper.append($header);

        // Scrollable area
        var $scrollArea = $('<div></div>').css({
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: this.$container.height() - 60 || 300
        });

        // Sidebar (task labels)
        var $sidebar = $('<div></div>').css({
            flexShrink: 0,
            width: SIDEBAR_WIDTH,
            borderRight: '1px solid #2B3033',
            paddingTop: TIME_TICK_HEIGHT
        });

        this.tasks.forEach(function(task) {
            var cat = CATEGORY_COLORS[task.category] || CATEGORY_COLORS['default'];
            var status = STATUS_INDICATORS[task.status] || STATUS_INDICATORS.pending;

            var $row = $('<div></div>').css({
                height: ROW_HEIGHT,
                marginBottom: ROW_GAP,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: '8px'
            });

            var $statusDot = $('<span></span>').css({
                color: status.color,
                fontSize: '12px',
                flexShrink: 0
            }).text(status.icon);

            var $label = $('<span></span>').css({
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }).text(task.label || task.id);

            $row.append($statusDot).append($label);
            $sidebar.append($row);
        });

        $scrollArea.append($sidebar);

        // Chart area (SVG)
        var svgFullHeight = TIME_TICK_HEIGHT + this.tasks.length * (ROW_HEIGHT + ROW_GAP) + 10;
        var svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('width', chartWidth);
        svg.setAttribute('height', svgFullHeight);
        svg.style.display = 'block';
        svg.style.flexShrink = '0';

        // Draw time axis
        this._drawTimeAxis(svg, chartWidth);

        // Draw rows
        this._drawRows(svg, chartWidth);

        // Tooltip layer
        this._createTooltip(svg);

        // Current time marker
        this._drawNowLine(svg, chartWidth, svgFullHeight);

        var $chartDiv = $('<div></div>').css({ flex: 1, overflowX: 'auto' });
        $chartDiv.append(svg);
        $scrollArea.append($chartDiv);
        this.$wrapper.append($scrollArea);

        // Legend
        this._drawLegend();

        this.$container.empty().append(this.$wrapper);
    };

    GanttChart.prototype._timeToX = function(time) {
        return ((time - this.minTime) / this.timeRange) * this.chartWidth;
    };

    GanttChart.prototype._drawTimeAxis = function(svg, width) {
        var self = this;

        // Background for time axis
        var axisRect = document.createElementNS(this.svgNS, 'rect');
        axisRect.setAttribute('x', 0);
        axisRect.setAttribute('y', 0);
        axisRect.setAttribute('width', width);
        axisRect.setAttribute('height', TIME_TICK_HEIGHT);
        axisRect.setAttribute('fill', '#171D21');
        svg.appendChild(axisRect);

        // Compute tick interval
        var tickCount = Math.max(4, Math.min(12, Math.floor(width / 80)));
        var tickInterval = this.timeRange / tickCount;

        for (var i = 0; i <= tickCount; i++) {
            var time = this.minTime + i * tickInterval;
            var x = self._timeToX(time);
            var d = new Date(time);

            // Tick line
            var line = document.createElementNS(this.svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', TIME_TICK_HEIGHT - 6);
            line.setAttribute('x2', x);
            line.setAttribute('y2', TIME_TICK_HEIGHT);
            line.setAttribute('stroke', '#3C444D');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            // Grid line (vertical, faint)
            var gridLine = document.createElementNS(this.svgNS, 'line');
            gridLine.setAttribute('x1', x);
            gridLine.setAttribute('y1', TIME_TICK_HEIGHT);
            gridLine.setAttribute('x2', x);
            gridLine.setAttribute('y2', '100%');
            gridLine.setAttribute('stroke', 'rgba(255,255,255,0.03)');
            gridLine.setAttribute('stroke-width', '1');
            svg.appendChild(gridLine);

            // Label
            var label = document.createElementNS(this.svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', TIME_TICK_HEIGHT - 12);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', '#6C757D');
            label.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
            label.setAttribute('font-size', '10');

            // Format: show date if range > 1 day, else show time
            var rangeHours = this.timeRange / 3600000;
            if (rangeHours > 48) {
                label.textContent = (d.getMonth() + 1) + '/' + d.getDate();
            } else {
                label.textContent = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            }
            svg.appendChild(label);
        }
    };

    GanttChart.prototype._drawRows = function(svg, width) {
        var self = this;

        this.tasks.forEach(function(task, idx) {
            var y = TIME_TICK_HEIGHT + idx * (ROW_HEIGHT + ROW_GAP);
            var cat = CATEGORY_COLORS[task.category] || CATEGORY_COLORS['default'];

            // Row background (alternating)
            if (idx % 2 === 0) {
                var rowBg = document.createElementNS(self.svgNS, 'rect');
                rowBg.setAttribute('x', 0);
                rowBg.setAttribute('y', y);
                rowBg.setAttribute('width', width);
                rowBg.setAttribute('height', ROW_HEIGHT);
                rowBg.setAttribute('fill', 'rgba(255,255,255,0.015)');
                svg.appendChild(rowBg);
            }

            // Task bar
            var barX = self._timeToX(task._start.getTime());
            var barW = Math.max(4, self._timeToX(task._end.getTime()) - barX);
            var barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2;

            // Bar background
            var bar = document.createElementNS(self.svgNS, 'rect');
            bar.setAttribute('x', barX);
            bar.setAttribute('y', barY);
            bar.setAttribute('width', barW);
            bar.setAttribute('height', BAR_HEIGHT);
            bar.setAttribute('rx', '4');
            bar.setAttribute('ry', '4');
            bar.setAttribute('fill', cat.bg);
            bar.setAttribute('stroke', cat.border);
            bar.setAttribute('stroke-width', '1');
            bar.style.cursor = 'pointer';
            bar.style.transition = 'filter 0.2s ease, stroke-width 0.2s ease';
            svg.appendChild(bar);

            // Progress fill for complete tasks
            if (task.status === 'complete') {
                var progress = document.createElementNS(self.svgNS, 'rect');
                progress.setAttribute('x', barX);
                progress.setAttribute('y', barY);
                progress.setAttribute('width', barW);
                progress.setAttribute('height', BAR_HEIGHT);
                progress.setAttribute('rx', '4');
                progress.setAttribute('ry', '4');
                progress.setAttribute('fill', cat.border);
                progress.setAttribute('fill-opacity', '0.3');
                progress.style.pointerEvents = 'none';
                svg.appendChild(progress);
            }

            // Active task pulse
            if (task.status === 'active') {
                var pulse = document.createElementNS(self.svgNS, 'rect');
                pulse.setAttribute('x', barX);
                pulse.setAttribute('y', barY);
                pulse.setAttribute('width', barW);
                pulse.setAttribute('height', BAR_HEIGHT);
                pulse.setAttribute('rx', '4');
                pulse.setAttribute('ry', '4');
                pulse.setAttribute('fill', 'none');
                pulse.setAttribute('stroke', cat.border);
                pulse.setAttribute('stroke-width', '1');
                pulse.setAttribute('stroke-opacity', '0.5');
                pulse.style.pointerEvents = 'none';

                var animate = document.createElementNS(self.svgNS, 'animate');
                animate.setAttribute('attributeName', 'stroke-opacity');
                animate.setAttribute('values', '0.5;0.1;0.5');
                animate.setAttribute('dur', '2s');
                animate.setAttribute('repeatCount', 'indefinite');
                pulse.appendChild(animate);
                svg.appendChild(pulse);
            }

            // Bar label text
            if (barW > 60) {
                var barLabel = document.createElementNS(self.svgNS, 'text');
                barLabel.setAttribute('x', barX + 8);
                barLabel.setAttribute('y', barY + BAR_HEIGHT / 2 + 4);
                barLabel.setAttribute('fill', cat.text);
                barLabel.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
                barLabel.setAttribute('font-size', '11');
                barLabel.setAttribute('font-weight', '500');
                barLabel.style.pointerEvents = 'none';

                // Clip text to bar width
                var clipText = task.label || task.id;
                if (clipText.length > barW / 7) {
                    clipText = clipText.substring(0, Math.floor(barW / 7) - 1) + '\u2026';
                }
                barLabel.textContent = clipText;
                svg.appendChild(barLabel);
            }

            // Hover events
            $(bar).on('mouseenter', function() {
                bar.setAttribute('stroke-width', '2');
                bar.style.filter = 'drop-shadow(0 0 6px ' + cat.border + ')';
                self._showTooltip(task, barX + barW / 2, barY - 8);
            }).on('mouseleave', function() {
                bar.setAttribute('stroke-width', '1');
                bar.style.filter = '';
                self._hideTooltip();
            });
        });
    };

    GanttChart.prototype._drawNowLine = function(svg, width, height) {
        var now = Date.now();
        if (now < this.minTime || now > this.maxTime) return;

        var x = this._timeToX(now);

        var line = document.createElementNS(this.svgNS, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', TIME_TICK_HEIGHT);
        line.setAttribute('x2', x);
        line.setAttribute('y2', height);
        line.setAttribute('stroke', '#DC3545');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4,3');
        svg.appendChild(line);

        var nowLabel = document.createElementNS(this.svgNS, 'text');
        nowLabel.setAttribute('x', x);
        nowLabel.setAttribute('y', TIME_TICK_HEIGHT + 14);
        nowLabel.setAttribute('text-anchor', 'middle');
        nowLabel.setAttribute('fill', '#DC3545');
        nowLabel.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        nowLabel.setAttribute('font-size', '9');
        nowLabel.setAttribute('font-weight', '600');
        nowLabel.textContent = 'NOW';
        svg.appendChild(nowLabel);
    };

    GanttChart.prototype._createTooltip = function(svg) {
        this.tooltipGroup = document.createElementNS(this.svgNS, 'g');
        this.tooltipGroup.style.display = 'none';
        this.tooltipGroup.style.pointerEvents = 'none';

        this._ttRect = document.createElementNS(this.svgNS, 'rect');
        this._ttRect.setAttribute('rx', '6');
        this._ttRect.setAttribute('ry', '6');
        this._ttRect.setAttribute('fill', '#2B3033');
        this._ttRect.setAttribute('stroke', '#3C444D');
        this._ttRect.setAttribute('stroke-width', '1');
        this.tooltipGroup.appendChild(this._ttRect);

        this._ttLine1 = document.createElementNS(this.svgNS, 'text');
        this._ttLine1.setAttribute('fill', '#FFFFFF');
        this._ttLine1.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        this._ttLine1.setAttribute('font-size', '12');
        this._ttLine1.setAttribute('font-weight', '600');
        this.tooltipGroup.appendChild(this._ttLine1);

        this._ttLine2 = document.createElementNS(this.svgNS, 'text');
        this._ttLine2.setAttribute('fill', '#A0A0A0');
        this._ttLine2.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        this._ttLine2.setAttribute('font-size', '11');
        this.tooltipGroup.appendChild(this._ttLine2);

        this._ttLine3 = document.createElementNS(this.svgNS, 'text');
        this._ttLine3.setAttribute('fill', '#6C757D');
        this._ttLine3.setAttribute('font-family', '"Splunk Platform Sans", Arial, sans-serif');
        this._ttLine3.setAttribute('font-size', '10');
        this.tooltipGroup.appendChild(this._ttLine3);

        svg.appendChild(this.tooltipGroup);
    };

    GanttChart.prototype._showTooltip = function(task, x, y) {
        var title = task.label || task.id;
        var timeStr = this._formatTime(task._start) + ' - ' + this._formatTime(task._end);
        var durationMs = task._end - task._start;
        var durationMin = Math.round(durationMs / 60000);
        var durStr = 'Duration: ' + (durationMin >= 60 ? Math.floor(durationMin / 60) + 'h ' + (durationMin % 60) + 'm' : durationMin + 'm');
        durStr += '  |  ' + (task.category || 'general') + '  |  ' + (task.status || 'unknown');

        this._ttLine1.textContent = title;
        this._ttLine2.textContent = timeStr;
        this._ttLine3.textContent = durStr;

        var maxLen = Math.max(title.length, timeStr.length, durStr.length);
        var w = Math.max(180, maxLen * 6.5 + 24);
        var h = 60;

        this._ttRect.setAttribute('x', x - w / 2);
        this._ttRect.setAttribute('y', y - h - 4);
        this._ttRect.setAttribute('width', w);
        this._ttRect.setAttribute('height', h);

        this._ttLine1.setAttribute('x', x - w / 2 + 10);
        this._ttLine1.setAttribute('y', y - h + 16);
        this._ttLine2.setAttribute('x', x - w / 2 + 10);
        this._ttLine2.setAttribute('y', y - h + 32);
        this._ttLine3.setAttribute('x', x - w / 2 + 10);
        this._ttLine3.setAttribute('y', y - h + 48);

        this.tooltipGroup.style.display = '';
    };

    GanttChart.prototype._hideTooltip = function() {
        this.tooltipGroup.style.display = 'none';
    };

    GanttChart.prototype._formatTime = function(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
    };

    GanttChart.prototype._drawLegend = function() {
        var $legend = $('<div></div>').css({
            display: 'flex',
            gap: '16px',
            padding: '10px 18px',
            borderTop: '1px solid #2B3033',
            flexWrap: 'wrap'
        });

        Object.keys(CATEGORY_COLORS).forEach(function(cat) {
            if (cat === 'default') return;
            var colors = CATEGORY_COLORS[cat];
            var $item = $('<div></div>').css({
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: '#A0A0A0'
            });
            $item.append($('<span></span>').css({
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: colors.border,
                flexShrink: 0
            }));
            $item.append($('<span></span>').text(cat));
            $legend.append($item);
        });

        this.$wrapper.append($legend);
    };

    // ========================================
    // Initialization
    // ========================================

    function initGanttCharts() {
        $('[id*="timeline-gantt"], [data-viz="timeline-gantt"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-gantt-initialized')) return;
            $el.data('sit-gantt-initialized', true);

            var tasks = [];
            try {
                tasks = JSON.parse($el.attr('data-tasks') || '[]');
            } catch(e) {
                console.error('[SIT Gantt] Failed to parse tasks:', e);
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
                            var t = rows.map(function(row) {
                                return {
                                    id: row[fi['id']] || '',
                                    label: row[fi['label']] || row[fi['id']] || '',
                                    start: row[fi['start']] || row[fi['_time']] || '',
                                    end: row[fi['end']] || '',
                                    category: row[fi['category']] || 'default',
                                    status: row[fi['status']] || 'pending'
                                };
                            });
                            new GanttChart($el[0], t);
                        });
                        return;
                    }
                } catch(e) {
                    console.warn('[SIT Gantt] Could not bind to search:', searchId, e);
                }
            }

            new GanttChart($el[0], tasks);
        });
    }

    var observer = new MutationObserver(function() { initGanttCharts(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initGanttCharts();

    console.log('[SIT] Timeline Gantt loaded');
});
