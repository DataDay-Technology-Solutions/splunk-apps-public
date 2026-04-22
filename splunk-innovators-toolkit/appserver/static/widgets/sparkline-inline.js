/*
 * ============================================================================
 * Sparkline Inline Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Adds tiny inline SVG sparkline trend charts below single-value KPI
 *   numbers. Shows a mini trend line for quick visual context. Can
 *   display randomized demo data or use actual Splunk search results.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/sparkline-inline.js">
 *
 *   The widget automatically adds sparklines to all single-value panels.
 *   By default, it generates a smooth demo sparkline for visual effect.
 *
 *   Optional panel classes (via <panel classNames="...">):
 *     - sparkline            : Explicit opt-in
 *     - sparkline-area       : Filled area under the line
 *     - sparkline-bar        : Bar chart style instead of line
 *     - sparkline-dots       : Add dots at data points
 *     - sparkline-green      : Green color theme
 *     - sparkline-red        : Red color theme
 *     - sparkline-blue       : Blue color theme (default)
 *     - sparkline-gradient   : Gradient fill under line
 *     - no-sparkline         : Disable for specific panels
 *
 *   Custom data via data attribute (comma-separated):
 *     <panel data-sparkline="10,15,12,18,22,20,25,30,28,35">
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        width: 120,
        height: 30,
        strokeWidth: 1.5,
        dataPoints: 20,
        animDuration: 800,
        pollInterval: 500,
        maxPollAttempts: 60,
        colors: {
            blue:   { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
            green:  { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)' },
            red:    { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)' },
            purple: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' }
        }
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.sparkline-container {',
        '    display: flex;',
        '    justify-content: center;',
        '    margin-top: 8px;',
        '    opacity: 0;',
        '    transition: opacity 0.5s ease;',
        '}',
        '.sparkline-container.visible {',
        '    opacity: 1;',
        '}',
        '.sparkline-svg {',
        '    overflow: visible;',
        '}',
        '.sparkline-line {',
        '    fill: none;',
        '    stroke-linecap: round;',
        '    stroke-linejoin: round;',
        '}',
        '.sparkline-area {',
        '    opacity: 0.3;',
        '}',
        '.sparkline-dot {',
        '    transition: r 0.2s ease;',
        '}',
        '.sparkline-container:hover .sparkline-dot {',
        '    r: 2.5;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Generate Demo Data
    // -------------------------------------------------------------------------
    function generateDemoData(points, baseValue) {
        var data = [];
        var value = baseValue || 50;
        for (var i = 0; i < points; i++) {
            // Random walk with slight upward trend
            value += (Math.random() - 0.45) * 10;
            value = Math.max(5, Math.min(95, value));
            data.push(value);
        }
        return data;
    }

    // -------------------------------------------------------------------------
    // Create SVG Sparkline
    // -------------------------------------------------------------------------
    function createSparklineSVG(data, options) {
        var w = options.width;
        var h = options.height;
        var sw = options.strokeWidth;
        var color = options.color;
        var showArea = options.showArea;
        var showDots = options.showDots;
        var showBars = options.showBars;
        var showGradient = options.showGradient;

        if (!data || data.length < 2) return '';

        // Normalize data to fit SVG
        var min = Math.min.apply(null, data);
        var max = Math.max.apply(null, data);
        var range = max - min || 1;
        var padding = 2;

        var points = data.map(function(val, i) {
            var x = padding + (i / (data.length - 1)) * (w - padding * 2);
            var y = padding + (1 - (val - min) / range) * (h - padding * 2);
            return { x: x, y: y };
        });

        var gradientId = 'spGrad_' + Math.random().toString(36).substr(2, 9);

        var svg = '<svg class="sparkline-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';

        // Gradient definition
        if (showGradient || showArea) {
            svg += '<defs>';
            svg += '  <linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1">';
            svg += '    <stop offset="0%" stop-color="' + color.stroke + '" stop-opacity="0.3" />';
            svg += '    <stop offset="100%" stop-color="' + color.stroke + '" stop-opacity="0.02" />';
            svg += '  </linearGradient>';
            svg += '</defs>';
        }

        if (showBars) {
            // Bar chart mode
            var barWidth = (w - padding * 2) / data.length * 0.7;
            var barGap = (w - padding * 2) / data.length * 0.3;

            points.forEach(function(pt, i) {
                var barHeight = h - pt.y;
                var x = padding + (i / data.length) * (w - padding * 2);
                svg += '<rect x="' + x + '" y="' + pt.y + '" width="' + barWidth + '" height="' + barHeight + '"';
                svg += ' fill="' + color.stroke + '" opacity="0.6" rx="1" />';
            });
        } else {
            // Line path
            var pathD = points.map(function(pt, i) {
                return (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1);
            }).join(' ');

            // Smooth curve version using cubic bezier
            var smoothD = 'M' + points[0].x.toFixed(1) + ',' + points[0].y.toFixed(1);
            for (var i = 1; i < points.length; i++) {
                var prev = points[i - 1];
                var curr = points[i];
                var cpx = (prev.x + curr.x) / 2;
                smoothD += ' C' + cpx.toFixed(1) + ',' + prev.y.toFixed(1) + ' ' +
                           cpx.toFixed(1) + ',' + curr.y.toFixed(1) + ' ' +
                           curr.x.toFixed(1) + ',' + curr.y.toFixed(1);
            }

            // Area fill
            if (showArea || showGradient) {
                var areaD = smoothD + ' L' + points[points.length - 1].x.toFixed(1) + ',' + h +
                    ' L' + points[0].x.toFixed(1) + ',' + h + ' Z';
                svg += '<path class="sparkline-area" d="' + areaD + '" fill="url(#' + gradientId + ')" />';
            }

            // Line
            svg += '<path class="sparkline-line" d="' + smoothD + '"';
            svg += ' stroke="' + color.stroke + '" stroke-width="' + sw + '" />';

            // Dots
            if (showDots) {
                points.forEach(function(pt) {
                    svg += '<circle class="sparkline-dot" cx="' + pt.x.toFixed(1) + '" cy="' + pt.y.toFixed(1) + '"';
                    svg += ' r="1.5" fill="' + color.stroke + '" />';
                });
            }

            // End dot (always shown)
            var last = points[points.length - 1];
            svg += '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '"';
            svg += ' r="2" fill="' + color.stroke + '">';
            svg += '<animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />';
            svg += '</circle>';
        }

        svg += '</svg>';
        return svg;
    }

    // -------------------------------------------------------------------------
    // Process Panels
    // -------------------------------------------------------------------------
    function processPanels() {
        var $panels = $('.dashboard-panel').has('.single-value');

        $panels.each(function() {
            var $panel = $(this);

            // Skip if disabled or already processed
            if ($panel.hasClass('no-sparkline') || $panel.data('sparkline-initialized')) return;

            var $singleValue = $panel.find('.single-value');
            var $singleResult = $singleValue.find('.single-result');

            if (!$singleResult.length) return;

            // Check for result number
            var $resultNumber = $singleResult.find('.result-number');
            if (!$resultNumber.length || !$resultNumber.text().trim()) return;

            // Parse data
            var customData = $panel.attr('data-sparkline');
            var data;
            if (customData) {
                data = customData.split(',').map(function(v) { return parseFloat(v.trim()); })
                    .filter(function(v) { return !isNaN(v); });
            } else {
                // Generate demo data based on the KPI value for visual variety
                var kpiVal = parseFloat($resultNumber.text().replace(/[^0-9.\-]/g, '')) || 50;
                data = generateDemoData(CONFIG.dataPoints, kpiVal);
            }

            if (data.length < 2) return;

            // Determine options from panel classes
            var colorTheme = CONFIG.colors.blue;
            if ($panel.hasClass('sparkline-green')) colorTheme = CONFIG.colors.green;
            if ($panel.hasClass('sparkline-red')) colorTheme = CONFIG.colors.red;

            var options = {
                width: CONFIG.width,
                height: CONFIG.height,
                strokeWidth: CONFIG.strokeWidth,
                color: colorTheme,
                showArea: $panel.hasClass('sparkline-area'),
                showDots: $panel.hasClass('sparkline-dots'),
                showBars: $panel.hasClass('sparkline-bar'),
                showGradient: $panel.hasClass('sparkline-gradient')
            };

            // Default to area if no specific style
            if (!options.showArea && !options.showBars && !options.showGradient) {
                options.showGradient = true;
            }

            // Create sparkline
            var svgHtml = createSparklineSVG(data, options);
            var $container = $('<div class="sparkline-container"></div>');
            $container.html(svgHtml);

            // Insert after result number or under-label
            var $underLabel = $singleResult.find('.under-label');
            if ($underLabel.length) {
                $underLabel.after($container);
            } else {
                $singleResult.append($container);
            }

            // Animate in
            setTimeout(function() {
                $container.addClass('visible');
            }, 100);

            $panel.data('sparkline-initialized', true);
        });
    }

    // -------------------------------------------------------------------------
    // MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) {
            return m.addedNodes.length > 0;
        });
        if (hasChanges) {
            setTimeout(processPanels, 200);
        }
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // -------------------------------------------------------------------------
    // Polling for Initial Load
    // -------------------------------------------------------------------------
    var attempts = 0;
    var pollTimer = setInterval(function() {
        attempts++;
        var hasContent = false;
        $('.single-value .single-result .result-number').each(function() {
            if ($(this).text().trim()) { hasContent = true; return false; }
        });

        if (hasContent || attempts >= CONFIG.maxPollAttempts) {
            clearInterval(pollTimer);
            processPanels();
        }
    }, CONFIG.pollInterval);
});
