/*
 * ============================================================================
 * Gauge Speedometer Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Real speedometer-style gauge with animated needle. Semicircular gauge
 *   with colored zones (green/yellow/red) and a needle that swings
 *   smoothly to the target value. Includes tick marks and value label.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/gauge-speedometer.js">
 *
 *   Enhances all single-value panels. Values are treated as 0-100 by default.
 *
 *   Optional panel classes (via <panel classNames="...">):
 *     - speedometer           : Explicit opt-in
 *     - speedometer-large     : Larger gauge (240px)
 *     - speedometer-small     : Smaller gauge (140px)
 *     - speedometer-dark      : Dark theme
 *     - speedometer-minimal   : Minimal/clean style
 *     - no-speedometer        : Disable for specific panels
 *
 *   Custom range:
 *     <panel data-speedo-max="1000" data-speedo-min="0">
 *
 *   Custom zone thresholds (as percentages of range):
 *     <panel data-speedo-zones="0,60,80,100">
 *     (green 0-60%, yellow 60-80%, red 80-100%)
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        defaultSize: 180,
        largeSize: 240,
        smallSize: 140,
        defaultMin: 0,
        defaultMax: 100,
        needleAnimDuration: 1500,
        startAngle: -135,       // degrees from 12 o'clock
        endAngle: 135,
        pollInterval: 500,
        maxPollAttempts: 60,
        zones: [
            { end: 0.6,  color: '#22c55e' },  // Green: 0-60%
            { end: 0.8,  color: '#f59e0b' },  // Yellow: 60-80%
            { end: 1.0,  color: '#ef4444' }    // Red: 80-100%
        ]
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.speedometer-container {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    justify-content: center;',
        '    margin: 5px auto;',
        '    position: relative;',
        '}',
        '.speedometer-value-display {',
        '    text-align: center;',
        '    margin-top: -15px;',
        '    position: relative;',
        '    z-index: 5;',
        '}',
        '.speedometer-number {',
        '    font-size: 1.4em;',
        '    font-weight: 700;',
        '    color: rgba(255, 255, 255, 0.9);',
        '}',
        '.speedometer-label {',
        '    font-size: 0.65em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.1em;',
        '    color: rgba(255, 255, 255, 0.5);',
        '    margin-top: 2px;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Utility: Degrees to Radians
    // -------------------------------------------------------------------------
    function degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    // -------------------------------------------------------------------------
    // Utility: Polar to Cartesian
    // -------------------------------------------------------------------------
    function polarToCartesian(cx, cy, r, angleDeg) {
        var rad = degToRad(angleDeg - 90); // -90 to start from top
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    }

    // -------------------------------------------------------------------------
    // Utility: Arc Path
    // -------------------------------------------------------------------------
    function describeArc(cx, cy, r, startAngle, endAngle) {
        var start = polarToCartesian(cx, cy, r, endAngle);
        var end = polarToCartesian(cx, cy, r, startAngle);
        var largeArc = endAngle - startAngle <= 180 ? '0' : '1';
        return [
            'M', start.x, start.y,
            'A', r, r, 0, largeArc, 0, end.x, end.y
        ].join(' ');
    }

    // -------------------------------------------------------------------------
    // Create Speedometer SVG
    // -------------------------------------------------------------------------
    function createSpeedometer(value, label, size, minVal, maxVal, zones) {
        var cx = size / 2;
        var cy = size / 2 + 10; // slight offset down
        var outerR = size / 2 - 15;
        var innerR = outerR - 12;
        var needleLen = outerR - 5;
        var totalAngle = CONFIG.endAngle - CONFIG.startAngle;

        // Normalize value
        var pct = Math.min(Math.max((value - minVal) / (maxVal - minVal), 0), 1);
        var targetAngle = CONFIG.startAngle + pct * totalAngle;

        var svg = '<svg class="speedometer-svg" width="' + size + '" height="' + (size * 0.65) + '" viewBox="0 0 ' + size + ' ' + (size * 0.65) + '">';

        // Defs
        svg += '<defs>';
        svg += '  <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">';
        svg += '    <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)" />';
        svg += '  </filter>';
        svg += '  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">';
        svg += '    <feGaussianBlur stdDeviation="2" result="glow" />';
        svg += '    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>';
        svg += '  </filter>';
        svg += '</defs>';

        // Background arc
        svg += '<path d="' + describeArc(cx, cy, outerR, CONFIG.startAngle, CONFIG.endAngle) + '"';
        svg += ' fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14" stroke-linecap="round" />';

        // Zone arcs
        var zoneStart = 0;
        zones.forEach(function(zone) {
            var startA = CONFIG.startAngle + zoneStart * totalAngle;
            var endA = CONFIG.startAngle + zone.end * totalAngle;
            svg += '<path d="' + describeArc(cx, cy, outerR, startA, endA) + '"';
            svg += ' fill="none" stroke="' + zone.color + '" stroke-width="12" stroke-linecap="butt"';
            svg += ' opacity="0.25" />';
            zoneStart = zone.end;
        });

        // Active zone (filled up to value)
        zoneStart = 0;
        zones.forEach(function(zone) {
            var zoneEndPct = zone.end;
            if (pct <= zoneStart) return; // Value hasn't reached this zone
            var fillEnd = Math.min(pct, zoneEndPct);
            var startA = CONFIG.startAngle + zoneStart * totalAngle;
            var endA = CONFIG.startAngle + fillEnd * totalAngle;
            svg += '<path d="' + describeArc(cx, cy, outerR, startA, endA) + '"';
            svg += ' fill="none" stroke="' + zone.color + '" stroke-width="12" stroke-linecap="butt"';
            svg += ' filter="url(#glowFilter)" />';
            zoneStart = zone.end;
        });

        // Tick marks
        var numTicks = 10;
        for (var i = 0; i <= numTicks; i++) {
            var tickPct = i / numTicks;
            var tickAngle = CONFIG.startAngle + tickPct * totalAngle;
            var outerPt = polarToCartesian(cx, cy, outerR + 8, tickAngle);
            var innerPt = polarToCartesian(cx, cy, outerR + 2, tickAngle);
            var isMajor = (i % 2 === 0);

            svg += '<line x1="' + innerPt.x + '" y1="' + innerPt.y + '"';
            svg += ' x2="' + outerPt.x + '" y2="' + outerPt.y + '"';
            svg += ' stroke="rgba(255,255,255,' + (isMajor ? '0.4' : '0.15') + ')"';
            svg += ' stroke-width="' + (isMajor ? '2' : '1') + '" />';

            // Labels on major ticks
            if (isMajor) {
                var labelPt = polarToCartesian(cx, cy, outerR + 16, tickAngle);
                var tickVal = Math.round(minVal + tickPct * (maxVal - minVal));
                svg += '<text x="' + labelPt.x + '" y="' + labelPt.y + '"';
                svg += ' text-anchor="middle" dominant-baseline="middle"';
                svg += ' font-size="8" fill="rgba(255,255,255,0.35)" font-family="sans-serif">';
                svg += tickVal;
                svg += '</text>';
            }
        }

        // Needle
        var needleAngle = CONFIG.startAngle; // Start position (will animate)
        var needleTip = polarToCartesian(cx, cy, needleLen, needleAngle);
        var needleBase1 = polarToCartesian(cx, cy, 4, needleAngle + 90);
        var needleBase2 = polarToCartesian(cx, cy, 4, needleAngle - 90);
        var needleTail = polarToCartesian(cx, cy, 15, needleAngle + 180);

        svg += '<g class="speedometer-needle" filter="url(#needleShadow)"';
        svg += ' style="transform-origin: ' + cx + 'px ' + cy + 'px; transition: transform ' + (CONFIG.needleAnimDuration / 1000) + 's cubic-bezier(0.34, 1.56, 0.64, 1);"';
        svg += ' data-start-angle="' + CONFIG.startAngle + '" data-target-angle="' + targetAngle + '">';
        svg += '  <path d="M' + needleTip.x + ' ' + needleTip.y + ' L' + needleBase1.x + ' ' + needleBase1.y;
        svg += ' L' + needleTail.x + ' ' + needleTail.y + ' L' + needleBase2.x + ' ' + needleBase2.y + ' Z"';
        svg += '  fill="rgba(255, 255, 255, 0.9)" />';
        svg += '</g>';

        // Center cap
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="6"';
        svg += ' fill="rgba(255,255,255,0.9)" />';
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="3"';
        svg += ' fill="rgba(100,100,100,0.8)" />';

        svg += '</svg>';

        return svg;
    }

    // -------------------------------------------------------------------------
    // Animate Needle
    // -------------------------------------------------------------------------
    function animateNeedle($container) {
        var $needle = $container.find('.speedometer-needle');
        if (!$needle.length) return;

        var startAngle = parseFloat($needle.attr('data-start-angle'));
        var targetAngle = parseFloat($needle.attr('data-target-angle'));
        var rotation = targetAngle - startAngle;

        // Trigger animation after a brief delay
        setTimeout(function() {
            $needle.css('transform', 'rotate(' + rotation + 'deg)');
        }, 50);
    }

    // -------------------------------------------------------------------------
    // Parse Zone Configuration
    // -------------------------------------------------------------------------
    function parseZones(zoneStr) {
        if (!zoneStr) return CONFIG.zones;

        var parts = zoneStr.split(',').map(function(v) { return parseFloat(v.trim()) / 100; });
        if (parts.length < 4) return CONFIG.zones;

        var zoneColors = ['#22c55e', '#f59e0b', '#ef4444'];
        var zones = [];
        for (var i = 1; i < parts.length; i++) {
            zones.push({
                end: parts[i],
                color: zoneColors[i - 1] || '#888'
            });
        }
        return zones;
    }

    // -------------------------------------------------------------------------
    // Process Standalone HTML Panel Widgets
    // -------------------------------------------------------------------------
    function processWidgets() {
        $('.gauge-speedometer').each(function() {
            var $widget = $(this);
            if ($widget.data('speedo-running')) return;

            var value = parseFloat($widget.attr('data-value')) || 0;
            var maxVal = parseFloat($widget.attr('data-max')) || CONFIG.defaultMax;
            var minVal = parseFloat($widget.attr('data-min')) || CONFIG.defaultMin;
            var label = $widget.attr('data-label') || '';
            var zones = parseZones($widget.attr('data-zones'));
            var size = parseInt($widget.attr('data-size')) || CONFIG.defaultSize;

            var svgHtml = createSpeedometer(value, label, size, minVal, maxVal, zones);

            var $container = $('<div class="speedometer-container"></div>');
            $container.html(svgHtml);

            var $valueDisplay = $(
                '<div class="speedometer-value-display">' +
                '  <div class="speedometer-number">' + escapeHtml(String(value)) + '</div>' +
                (label ? '  <div class="speedometer-label">' + escapeHtml(label) + '</div>' : '') +
                '</div>'
            );
            $container.append($valueDisplay);

            $widget.empty().append($container);
            animateNeedle($container);
            $widget.data('speedo-running', true);
        });
    }

    // -------------------------------------------------------------------------
    // Process Single-Value Panels (legacy approach)
    // -------------------------------------------------------------------------
    function processPanels() {
        // First handle standalone HTML widgets
        processWidgets();

        // Then handle single-value panels (Splunk 10.2 uses SVG)
        var $panels = $('.dashboard-panel').has('.single-value');
        $panels.each(function() {
            var $panel = $(this);
            if ($panel.hasClass('no-speedometer') || $panel.data('speedo-initialized')) return;

            var $singleValue = $panel.find('.single-value');

            // Splunk 10.2: value is in SVG text element
            var numVal = NaN;
            var text = '';
            var label = '';

            // Try old DOM first (.result-number)
            var $resultNumber = $singleValue.find('.single-result .result-number');
            if ($resultNumber.length && $resultNumber.text().trim()) {
                text = $resultNumber.text().trim();
            }

            // Try SVG text (Splunk 10.2)
            if (!text) {
                var svgTexts = $singleValue.find('svg text');
                svgTexts.each(function() {
                    var t = $(this).text().trim();
                    if (t && !isNaN(parseFloat(t.replace(/[^0-9.\-]/g, '')))) {
                        text = t;
                        return false;
                    }
                });
                // Under-label from SVG
                var $underText = $singleValue.find('svg .under-label text, svg text').last();
                if ($underText.length) label = $underText.text().trim();
            } else {
                var $underLabel = $singleValue.find('.single-result .under-label');
                label = $underLabel.text() || '';
            }

            if (!text) return;
            numVal = parseFloat(text.replace(/[^0-9.\-]/g, ''));
            if (isNaN(numVal)) return;

            var minVal = parseFloat($panel.attr('data-speedo-min')) || CONFIG.defaultMin;
            var maxVal = parseFloat($panel.attr('data-speedo-max')) || CONFIG.defaultMax;
            var zones = parseZones($panel.attr('data-speedo-zones'));

            var size = CONFIG.defaultSize;
            if ($panel.hasClass('speedometer-large')) size = CONFIG.largeSize;
            if ($panel.hasClass('speedometer-small')) size = CONFIG.smallSize;

            var svgHtml = createSpeedometer(numVal, label, size, minVal, maxVal, zones);
            var $container = $('<div class="speedometer-container"></div>');
            $container.html(svgHtml);
            var $valueDisplay = $(
                '<div class="speedometer-value-display">' +
                '  <div class="speedometer-number">' + escapeHtml(text) + '</div>' +
                (label && label !== text ? '  <div class="speedometer-label">' + escapeHtml(label) + '</div>' : '') +
                '</div>'
            );
            $container.append($valueDisplay);

            // Replace the single value content
            var $body = $panel.find('.panel-body');
            $body.empty().append($container);
            animateNeedle($container);
            $panel.data('speedo-initialized', true);
        });
    }

    // -------------------------------------------------------------------------
    // HTML Escape
    // -------------------------------------------------------------------------
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // -------------------------------------------------------------------------
    // MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) { return m.addedNodes.length > 0; });
        if (hasChanges) setTimeout(processPanels, 200);
    });

    var dashBody = document.querySelector('.dashboard-body') || document.body;
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // -------------------------------------------------------------------------
    // Init — retry for late-loading DOM
    // -------------------------------------------------------------------------
    setTimeout(processPanels, 300);
    setTimeout(processPanels, 1000);
    setTimeout(processPanels, 2000);
    setTimeout(processPanels, 4000);
});
