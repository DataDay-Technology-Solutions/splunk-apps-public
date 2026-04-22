/*
 * ============================================================================
 * KPI Circular Progress Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Wraps single-value panels with a donut-style circular progress ring.
 *   The ring fills based on the value (percentage). Animated on load with
 *   smooth arc drawing. Supports custom color ranges.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/kpi-circular-progress.js">
 *
 *   The widget enhances all single-value panels that display percentage
 *   values. Non-percentage values are treated as a 0-100 range by default.
 *
 *   Optional panel classes (via <panel classNames="...">):
 *     - progress-ring          : Explicit opt-in
 *     - progress-ring-thin     : Thinner ring stroke
 *     - progress-ring-thick    : Thicker ring stroke
 *     - progress-ring-gradient : Gradient color ring
 *     - progress-ring-glow     : Glowing ring effect
 *     - no-progress-ring       : Disable for specific panels
 *
 *   Custom max value via data attribute:
 *     <panel data-progress-max="500">
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        size: 140,                  // SVG canvas size
        strokeWidth: 8,             // Default stroke width
        thinStroke: 4,
        thickStroke: 14,
        animDuration: 1500,         // ms
        bgStrokeColor: 'rgba(255, 255, 255, 0.08)',
        defaultMax: 100,
        pollInterval: 500,
        maxPollAttempts: 60,
        colors: {
            low:    { threshold: 33,  color: '#ef4444' },  // Red
            mid:    { threshold: 66,  color: '#f59e0b' },  // Amber
            high:   { threshold: 100, color: '#22c55e' }   // Green
        }
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.progress-ring-container {',
        '    position: relative;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    margin: 10px auto;',
        '}',
        '',
        '.progress-ring-svg {',
        '    transform: rotate(-90deg);',
        '    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));',
        '}',
        '',
        '.progress-ring-center {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    transform: translate(-50%, -50%);',
        '    text-align: center;',
        '    pointer-events: none;',
        '}',
        '',
        '.progress-ring-center .result-number {',
        '    font-size: 1.6em;',
        '    font-weight: 700;',
        '    line-height: 1.2;',
        '}',
        '',
        '.progress-ring-center .under-label {',
        '    font-size: 0.7em;',
        '    opacity: 0.6;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.08em;',
        '}',
        '',
        '/* Glow variant */',
        '.progress-ring-glow .progress-ring-svg {',
        '    filter: drop-shadow(0 0 8px var(--ring-color, #22c55e));',
        '}',
        '',
        '/* Hide original content when ring is active */',
        '.progress-ring-active .single-result {',
        '    position: relative;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Get Color Based on Value
    // -------------------------------------------------------------------------
    function getColor(percentage) {
        if (percentage <= CONFIG.colors.low.threshold) return CONFIG.colors.low.color;
        if (percentage <= CONFIG.colors.mid.threshold) return CONFIG.colors.mid.color;
        return CONFIG.colors.high.color;
    }

    // -------------------------------------------------------------------------
    // Create SVG Ring
    // -------------------------------------------------------------------------
    function createRing(size, strokeWidth, percentage, color, useGradient) {
        var radius = (size - strokeWidth) / 2;
        var circumference = 2 * Math.PI * radius;
        var center = size / 2;

        var gradientId = 'ringGrad_' + Math.random().toString(36).substr(2, 9);

        var svg = '<svg class="progress-ring-svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">';

        // Gradient definition (for gradient variant)
        if (useGradient) {
            svg += '<defs>';
            svg += '  <linearGradient id="' + gradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">';
            svg += '    <stop offset="0%" style="stop-color:#6366f1" />';
            svg += '    <stop offset="50%" style="stop-color:#8b5cf6" />';
            svg += '    <stop offset="100%" style="stop-color:#d946ef" />';
            svg += '  </linearGradient>';
            svg += '</defs>';
        }

        // Background circle
        svg += '<circle';
        svg += '  cx="' + center + '"';
        svg += '  cy="' + center + '"';
        svg += '  r="' + radius + '"';
        svg += '  fill="none"';
        svg += '  stroke="' + CONFIG.bgStrokeColor + '"';
        svg += '  stroke-width="' + strokeWidth + '"';
        svg += '/>';

        // Progress circle
        var strokeColor = useGradient ? 'url(#' + gradientId + ')' : color;
        svg += '<circle';
        svg += '  class="progress-ring-arc"';
        svg += '  cx="' + center + '"';
        svg += '  cy="' + center + '"';
        svg += '  r="' + radius + '"';
        svg += '  fill="none"';
        svg += '  stroke="' + strokeColor + '"';
        svg += '  stroke-width="' + strokeWidth + '"';
        svg += '  stroke-linecap="round"';
        svg += '  stroke-dasharray="' + circumference + '"';
        svg += '  stroke-dashoffset="' + circumference + '"';
        svg += '  data-circumference="' + circumference + '"';
        svg += '  data-target-offset="' + (circumference - (percentage / 100) * circumference) + '"';
        svg += '/>';

        svg += '</svg>';

        return svg;
    }

    // -------------------------------------------------------------------------
    // Animate Ring Fill
    // -------------------------------------------------------------------------
    function animateRing($arc, duration) {
        var circumference = parseFloat($arc.attr('data-circumference'));
        var targetOffset = parseFloat($arc.attr('data-target-offset'));
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            var eased = 1 - Math.pow(1 - progress, 3);
            var currentOffset = circumference - (circumference - targetOffset) * eased;

            $arc[0].setAttribute('stroke-dashoffset', currentOffset);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    // -------------------------------------------------------------------------
    // Parse Value from Element
    // -------------------------------------------------------------------------
    function parseValue(text) {
        if (!text) return null;
        text = text.trim();
        var isPercent = text.indexOf('%') >= 0;
        var num = parseFloat(text.replace(/[^0-9.\-]/g, ''));
        if (isNaN(num)) return null;
        return { value: num, isPercent: isPercent };
    }

    // -------------------------------------------------------------------------
    // Process Panels
    // -------------------------------------------------------------------------
    function processPanels() {
        var $panels = $('.dashboard-panel').has('.single-value');

        $panels.each(function() {
            var $panel = $(this);

            // Skip if disabled or already processed
            if ($panel.hasClass('no-progress-ring') || $panel.data('ring-initialized')) return;

            var $singleValue = $panel.find('.single-value');
            var $resultNumber = $singleValue.find('.single-result .result-number');
            var $underLabel = $singleValue.find('.single-result .under-label');

            if (!$resultNumber.length) return;

            var text = $resultNumber.text();
            var parsed = parseValue(text);
            if (!parsed) return;

            // Determine max value
            var maxVal = parseFloat($panel.attr('data-progress-max')) || CONFIG.defaultMax;
            var percentage = Math.min(Math.max((parsed.value / maxVal) * 100, 0), 100);

            // Determine stroke width
            var strokeWidth = CONFIG.strokeWidth;
            if ($panel.hasClass('progress-ring-thin')) strokeWidth = CONFIG.thinStroke;
            if ($panel.hasClass('progress-ring-thick')) strokeWidth = CONFIG.thickStroke;

            // Determine color
            var color = getColor(percentage);
            var useGradient = $panel.hasClass('progress-ring-gradient');

            // Build the ring
            var svgHtml = createRing(CONFIG.size, strokeWidth, percentage, color, useGradient);

            // Create container
            var $container = $('<div class="progress-ring-container"></div>');
            $container.html(svgHtml);

            // Center content (value + label)
            var $center = $('<div class="progress-ring-center"></div>');
            $center.append($resultNumber.clone());
            if ($underLabel.length) {
                $center.append($underLabel.clone());
            }
            $container.append($center);

            // Set ring color CSS variable for glow variant
            $container.css('--ring-color', color);

            // Replace content
            var $singleResult = $singleValue.find('.single-result');
            $singleResult.empty().append($container);

            $singleValue.addClass('progress-ring-active');
            $panel.data('ring-initialized', true);

            // Animate
            var $arc = $container.find('.progress-ring-arc');
            if ($arc.length) {
                animateRing($arc, CONFIG.animDuration);
            }
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
        observer.observe(dashBody, {
            childList: true,
            subtree: true
        });
    }

    // -------------------------------------------------------------------------
    // Polling for Initial Load
    // -------------------------------------------------------------------------
    var attempts = 0;
    var pollTimer = setInterval(function() {
        attempts++;
        var $results = $('.single-value .single-result .result-number');
        var hasContent = false;

        $results.each(function() {
            if ($(this).text().trim()) {
                hasContent = true;
                return false;
            }
        });

        if (hasContent || attempts >= CONFIG.maxPollAttempts) {
            clearInterval(pollTimer);
            processPanels();
        }
    }, CONFIG.pollInterval);
});
