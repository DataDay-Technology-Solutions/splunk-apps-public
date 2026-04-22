/*
 * ============================================================================
 * Gauge Liquid Fill Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Animated liquid fill gauge with a circular container and wave motion on
 *   the liquid surface. The liquid level represents the KPI value as a
 *   percentage. Features smooth fill animation and continuous wave effect.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/gauge-liquid-fill.js">
 *
 *   The widget enhances all single-value panels. Values are treated as
 *   percentages (0-100) by default.
 *
 *   Optional panel classes (via <panel classNames="...">):
 *     - liquid-gauge          : Explicit opt-in
 *     - liquid-gauge-large    : Larger gauge size (200px)
 *     - liquid-gauge-small    : Smaller gauge size (100px)
 *     - liquid-gauge-blue     : Blue liquid (default)
 *     - liquid-gauge-green    : Green liquid
 *     - liquid-gauge-red      : Red liquid
 *     - liquid-gauge-auto     : Auto-color based on value
 *     - no-liquid-gauge       : Disable for specific panels
 *
 *   Custom max value:
 *     <panel data-liquid-max="500">
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        defaultSize: 150,
        largeSize: 200,
        smallSize: 100,
        defaultMax: 100,
        waveAmplitude: 4,
        waveFrequency: 2,
        waveSpeed: 0.04,
        fillDuration: 2000,
        pollInterval: 500,
        maxPollAttempts: 60,
        colors: {
            blue:  { liquid: '#3b82f6', dark: '#1d4ed8', text: '#ffffff' },
            green: { liquid: '#22c55e', dark: '#15803d', text: '#ffffff' },
            red:   { liquid: '#ef4444', dark: '#b91c1c', text: '#ffffff' },
            auto: function(pct) {
                if (pct < 33) return { liquid: '#ef4444', dark: '#b91c1c', text: '#ffffff' };
                if (pct < 66) return { liquid: '#f59e0b', dark: '#d97706', text: '#1a1a1a' };
                return { liquid: '#22c55e', dark: '#15803d', text: '#ffffff' };
            }
        }
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.liquid-gauge-container {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    justify-content: center;',
        '    margin: 10px auto;',
        '    position: relative;',
        '}',
        '',
        '.liquid-gauge-svg {',
        '    overflow: hidden;',
        '    border-radius: 50%;',
        '    box-shadow:',
        '        0 0 0 3px rgba(255, 255, 255, 0.1),',
        '        0 4px 15px rgba(0, 0, 0, 0.2),',
        '        inset 0 2px 8px rgba(0, 0, 0, 0.15);',
        '}',
        '',
        '.liquid-gauge-value {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    transform: translate(-50%, -50%);',
        '    text-align: center;',
        '    pointer-events: none;',
        '    z-index: 5;',
        '    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);',
        '}',
        '',
        '.liquid-gauge-number {',
        '    font-size: 1.6em;',
        '    font-weight: 700;',
        '    line-height: 1.2;',
        '}',
        '',
        '.liquid-gauge-label {',
        '    font-size: 0.65em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.1em;',
        '    opacity: 0.7;',
        '    margin-top: 2px;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Create Liquid Gauge with Canvas for Wave Animation
    // -------------------------------------------------------------------------
    function createLiquidGauge($panel, value, label, size, colorTheme, maxVal) {
        var percentage = Math.min(Math.max((value / maxVal) * 100, 0), 100);
        var colors = colorTheme;

        if (typeof colors === 'function') {
            colors = colors(percentage);
        }

        // Create container
        var $container = $('<div class="liquid-gauge-container"></div>');
        $container.css({ width: size + 'px', height: size + 'px' });

        // Create canvas
        var canvas = document.createElement('canvas');
        canvas.width = size * 2; // High DPI
        canvas.height = size * 2;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        canvas.style.borderRadius = '50%';
        canvas.className = 'liquid-gauge-svg';

        $container.append(canvas);

        // Value overlay
        var $valueOverlay = $(
            '<div class="liquid-gauge-value">' +
            '  <div class="liquid-gauge-number" style="color: ' + colors.text + ';">' + formatDisplay(value, maxVal) + '</div>' +
            (label ? '  <div class="liquid-gauge-label" style="color: ' + colors.text + ';">' + escapeHtml(label) + '</div>' : '') +
            '</div>'
        );
        $container.append($valueOverlay);

        // Animate
        animateLiquid(canvas, percentage, colors, size);

        return $container;
    }

    // -------------------------------------------------------------------------
    // Format Display Value
    // -------------------------------------------------------------------------
    function formatDisplay(value, maxVal) {
        if (maxVal === 100) {
            return Math.round(value) + '%';
        }
        // Format with commas
        return value.toLocaleString !== undefined ? value.toLocaleString() : value.toString();
    }

    // -------------------------------------------------------------------------
    // Liquid Wave Animation
    // -------------------------------------------------------------------------
    function animateLiquid(canvas, targetPct, colors, size) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var scale = w / size;

        var currentLevel = 0; // Start from 0
        var targetLevel = targetPct / 100;
        var waveOffset = 0;
        var fillStartTime = Date.now();

        function draw() {
            // Animate fill level
            var elapsed = Date.now() - fillStartTime;
            var fillProgress = Math.min(elapsed / CONFIG.fillDuration, 1);
            // Ease out cubic
            var eased = 1 - Math.pow(1 - fillProgress, 3);
            currentLevel = targetLevel * eased;

            var waterY = h - (currentLevel * h);

            // Clear
            ctx.clearRect(0, 0, w, h);

            // Background circle
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.fill();

            // Clip to circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
            ctx.clip();

            // Draw liquid body
            ctx.beginPath();

            // Wave parameters
            var amp = CONFIG.waveAmplitude * scale;
            var freq = CONFIG.waveFrequency;
            waveOffset += CONFIG.waveSpeed;

            // Primary wave
            ctx.moveTo(0, waterY);
            for (var x = 0; x <= w; x++) {
                var y = waterY + Math.sin((x / w) * freq * Math.PI * 2 + waveOffset) * amp;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();

            // Gradient fill
            var grad = ctx.createLinearGradient(0, waterY, 0, h);
            grad.addColorStop(0, colors.liquid);
            grad.addColorStop(1, colors.dark);
            ctx.fillStyle = grad;
            ctx.fill();

            // Secondary wave (lighter, offset)
            ctx.beginPath();
            ctx.moveTo(0, waterY);
            for (var x2 = 0; x2 <= w; x2++) {
                var y2 = waterY + Math.sin((x2 / w) * freq * Math.PI * 2 + waveOffset + 2) * amp * 0.6;
                ctx.lineTo(x2, y2);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = colors.liquid;
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Highlight on liquid surface
            ctx.beginPath();
            for (var x3 = 0; x3 <= w; x3++) {
                var y3 = waterY + Math.sin((x3 / w) * freq * Math.PI * 2 + waveOffset) * amp;
                if (x3 === 0) ctx.moveTo(x3, y3);
                else ctx.lineTo(x3, y3);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5 * scale;
            ctx.stroke();

            ctx.restore();

            // Rim highlight
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Glass reflection
            ctx.save();
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.ellipse(w * 0.35, h * 0.3, w * 0.12, w * 0.2, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.restore();

            requestAnimationFrame(draw);
        }

        draw();
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
    // Process Standalone HTML Panel Widgets
    // -------------------------------------------------------------------------
    function processWidgets() {
        $('.gauge-liquid-fill').each(function() {
            var $widget = $(this);
            if ($widget.data('liquid-running')) return;

            var value = parseFloat($widget.attr('data-value')) || 0;
            var maxVal = parseFloat($widget.attr('data-max')) || CONFIG.defaultMax;
            var label = $widget.attr('data-label') || '';
            var size = parseInt($widget.attr('data-size')) || CONFIG.defaultSize;

            var colorTheme = CONFIG.colors.blue;
            var color = $widget.attr('data-color') || '';
            if (color === 'green') colorTheme = CONFIG.colors.green;
            else if (color === 'red') colorTheme = CONFIG.colors.red;

            var $gauge = createLiquidGauge($widget, value, label, size, colorTheme, maxVal);
            $widget.empty().append($gauge);
            $widget.data('liquid-running', true);
        });
    }

    // -------------------------------------------------------------------------
    // Process Single-Value Panels (legacy + Splunk 10.2 SVG)
    // -------------------------------------------------------------------------
    function processPanels() {
        // First handle standalone HTML widgets
        processWidgets();

        // Then handle single-value panels
        var $panels = $('.dashboard-panel').has('.single-value');
        $panels.each(function() {
            var $panel = $(this);
            if ($panel.hasClass('no-liquid-gauge') || $panel.data('liquid-initialized')) return;

            var $singleValue = $panel.find('.single-value');
            var text = '';
            var label = '';

            // Try old DOM (.result-number)
            var $resultNumber = $singleValue.find('.single-result .result-number');
            if ($resultNumber.length && $resultNumber.text().trim()) {
                text = $resultNumber.text().trim();
                label = $singleValue.find('.single-result .under-label').text() || '';
            }

            // Try SVG text (Splunk 10.2)
            if (!text) {
                $singleValue.find('svg text').each(function() {
                    var t = $(this).text().trim();
                    if (t && !isNaN(parseFloat(t.replace(/[^0-9.\-]/g, '')))) {
                        text = t;
                        return false;
                    }
                });
            }

            if (!text) return;
            var numVal = parseFloat(text.replace(/[^0-9.\-]/g, ''));
            if (isNaN(numVal)) return;

            var maxVal = parseFloat($panel.attr('data-liquid-max')) || CONFIG.defaultMax;
            var size = CONFIG.defaultSize;
            if ($panel.hasClass('liquid-gauge-large')) size = CONFIG.largeSize;
            if ($panel.hasClass('liquid-gauge-small')) size = CONFIG.smallSize;

            var colorTheme = CONFIG.colors.blue;
            if ($panel.hasClass('liquid-gauge-green')) colorTheme = CONFIG.colors.green;
            if ($panel.hasClass('liquid-gauge-red')) colorTheme = CONFIG.colors.red;

            var $gauge = createLiquidGauge($panel, numVal, label, size, colorTheme, maxVal);
            var $body = $panel.find('.panel-body');
            $body.empty().append($gauge);
            $panel.data('liquid-initialized', true);
        });
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
