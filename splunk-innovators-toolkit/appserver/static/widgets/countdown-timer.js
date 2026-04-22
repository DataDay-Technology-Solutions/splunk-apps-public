/*
 * ============================================================================
 * Countdown Timer Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Live countdown timer that counts down to a specific datetime. Ideal for
 *   maintenance windows, SLA deadlines, or event countdowns. Features a
 *   flip-clock style animation for each digit change.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/countdown-timer.js">
 *
 *   Configure via HTML panel or panel data attributes:
 *
 *   HTML Panel approach:
 *     <html>
 *       <div class="countdown-widget"
 *            data-target="2026-04-15T00:00:00"
 *            data-label="Maintenance Window">
 *       </div>
 *     </html>
 *
 *   Single-value panel approach:
 *     <panel classNames="countdown-panel" data-countdown-target="2026-04-15T00:00:00">
 *
 *   Optional attributes:
 *     - data-target / data-countdown-target : ISO datetime string
 *     - data-label                          : Description text
 *     - data-expired-text                   : Text when countdown reaches 0
 *     - data-theme                          : "dark" (default), "light", "neon"
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        updateInterval: 1000,
        flipDuration: 600,
        defaultExpiredText: 'EXPIRED',
        defaultLabel: 'Countdown'
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.countdown-container {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    padding: 20px;',
        '    font-family: "SF Mono", "Fira Code", "Consolas", monospace;',
        '}',
        '',
        '.countdown-label {',
        '    font-size: 0.8em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.15em;',
        '    color: rgba(255, 255, 255, 0.5);',
        '    margin-bottom: 16px;',
        '    font-weight: 600;',
        '}',
        '',
        '.countdown-units {',
        '    display: flex;',
        '    gap: 8px;',
        '    align-items: center;',
        '}',
        '',
        '.countdown-unit {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '}',
        '',
        '.countdown-digits {',
        '    display: flex;',
        '    gap: 3px;',
        '}',
        '',
        '.countdown-digit {',
        '    position: relative;',
        '    width: 36px;',
        '    height: 50px;',
        '    perspective: 300px;',
        '    overflow: hidden;',
        '}',
        '',
        '.countdown-digit-face {',
        '    position: absolute;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    font-size: 1.6em;',
        '    font-weight: 700;',
        '    background: linear-gradient(180deg, #2a2a35 0%, #1a1a24 49.9%, #15151e 50%, #1e1e28 100%);',
        '    color: rgba(255, 255, 255, 0.9);',
        '    border-radius: 6px;',
        '    box-shadow:',
        '        0 2px 6px rgba(0, 0, 0, 0.3),',
        '        inset 0 1px 0 rgba(255, 255, 255, 0.05);',
        '}',
        '',
        '/* Center divider line */',
        '.countdown-digit-face::after {',
        '    content: "";',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 2px;',
        '    right: 2px;',
        '    height: 1px;',
        '    background: rgba(0, 0, 0, 0.3);',
        '}',
        '',
        '.countdown-digit-unit-label {',
        '    font-size: 0.6em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.1em;',
        '    color: rgba(255, 255, 255, 0.35);',
        '    margin-top: 6px;',
        '    font-weight: 500;',
        '}',
        '',
        '.countdown-separator {',
        '    font-size: 1.5em;',
        '    font-weight: 700;',
        '    color: rgba(255, 255, 255, 0.3);',
        '    padding: 0 2px;',
        '    margin-bottom: 20px;',
        '    animation: colonBlink 1s ease-in-out infinite;',
        '}',
        '',
        '@keyframes colonBlink {',
        '    0%, 100% { opacity: 1; }',
        '    50% { opacity: 0.3; }',
        '}',
        '',
        '/* Flip animation */',
        '@keyframes flipTop {',
        '    0% { transform: rotateX(0deg); }',
        '    100% { transform: rotateX(-90deg); }',
        '}',
        '',
        '@keyframes flipBottom {',
        '    0% { transform: rotateX(90deg); }',
        '    100% { transform: rotateX(0deg); }',
        '}',
        '',
        '.countdown-digit.flipping .countdown-digit-face {',
        '    animation: digitPulse 0.3s ease;',
        '}',
        '',
        '@keyframes digitPulse {',
        '    0% { transform: scale(1); }',
        '    50% { transform: scale(1.08); color: rgba(255, 255, 255, 1); }',
        '    100% { transform: scale(1); }',
        '}',
        '',
        '/* Expired state */',
        '.countdown-expired {',
        '    font-size: 1.3em;',
        '    font-weight: 700;',
        '    color: #ef4444;',
        '    text-shadow: 0 0 10px rgba(239, 68, 68, 0.4);',
        '    animation: expiredPulse 2s ease-in-out infinite;',
        '}',
        '',
        '@keyframes expiredPulse {',
        '    0%, 100% { opacity: 1; }',
        '    50% { opacity: 0.6; }',
        '}',
        '',
        '/* Neon theme */',
        '.countdown-neon .countdown-digit-face {',
        '    background: linear-gradient(180deg, #0a0a1a 0%, #060614 49.9%, #040410 50%, #080820 100%);',
        '    color: #00f0ff;',
        '    text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);',
        '    border: 1px solid rgba(0, 240, 255, 0.2);',
        '}',
        '',
        '.countdown-neon .countdown-separator {',
        '    color: rgba(0, 240, 255, 0.5);',
        '}',
        '',
        '/* Light theme */',
        '.countdown-light .countdown-digit-face {',
        '    background: linear-gradient(180deg, #f0f0f5 0%, #e0e0e8 49.9%, #d8d8e0 50%, #e5e5ed 100%);',
        '    color: #1a1a2e;',
        '    box-shadow: 0 2px 6px rgba(0,0,0,0.1);',
        '}',
        '.countdown-light .countdown-separator {',
        '    color: rgba(0, 0, 0, 0.25);',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Build Countdown HTML
    // -------------------------------------------------------------------------
    function buildCountdownHTML(label, theme) {
        var themeClass = theme ? ' countdown-' + theme : '';

        return (
            '<div class="countdown-container' + themeClass + '">' +
            '  <div class="countdown-label">' + escapeHtml(label) + '</div>' +
            '  <div class="countdown-units">' +
            '    <div class="countdown-unit">' +
            '      <div class="countdown-digits">' +
            '        <div class="countdown-digit" data-unit="d1"><div class="countdown-digit-face">0</div></div>' +
            '        <div class="countdown-digit" data-unit="d2"><div class="countdown-digit-face">0</div></div>' +
            '        <div class="countdown-digit" data-unit="d3"><div class="countdown-digit-face">0</div></div>' +
            '      </div>' +
            '      <div class="countdown-digit-unit-label">Days</div>' +
            '    </div>' +
            '    <div class="countdown-separator">:</div>' +
            '    <div class="countdown-unit">' +
            '      <div class="countdown-digits">' +
            '        <div class="countdown-digit" data-unit="h1"><div class="countdown-digit-face">0</div></div>' +
            '        <div class="countdown-digit" data-unit="h2"><div class="countdown-digit-face">0</div></div>' +
            '      </div>' +
            '      <div class="countdown-digit-unit-label">Hours</div>' +
            '    </div>' +
            '    <div class="countdown-separator">:</div>' +
            '    <div class="countdown-unit">' +
            '      <div class="countdown-digits">' +
            '        <div class="countdown-digit" data-unit="m1"><div class="countdown-digit-face">0</div></div>' +
            '        <div class="countdown-digit" data-unit="m2"><div class="countdown-digit-face">0</div></div>' +
            '      </div>' +
            '      <div class="countdown-digit-unit-label">Min</div>' +
            '    </div>' +
            '    <div class="countdown-separator">:</div>' +
            '    <div class="countdown-unit">' +
            '      <div class="countdown-digits">' +
            '        <div class="countdown-digit" data-unit="s1"><div class="countdown-digit-face">0</div></div>' +
            '        <div class="countdown-digit" data-unit="s2"><div class="countdown-digit-face">0</div></div>' +
            '      </div>' +
            '      <div class="countdown-digit-unit-label">Sec</div>' +
            '    </div>' +
            '  </div>' +
            '</div>'
        );
    }

    // -------------------------------------------------------------------------
    // Update Countdown Display
    // -------------------------------------------------------------------------
    function updateCountdown($container, targetDate, expiredText) {
        var now = new Date();
        var diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
            // Expired
            $container.find('.countdown-units').html(
                '<div class="countdown-expired">' + escapeHtml(expiredText) + '</div>'
            );
            return false; // Stop updating
        }

        var totalSec = Math.floor(diff / 1000);
        var days = Math.floor(totalSec / 86400);
        var hours = Math.floor((totalSec % 86400) / 3600);
        var minutes = Math.floor((totalSec % 3600) / 60);
        var seconds = totalSec % 60;

        var dayStr = String(days).padStart(3, '0');
        var hourStr = String(hours).padStart(2, '0');
        var minStr = String(minutes).padStart(2, '0');
        var secStr = String(seconds).padStart(2, '0');

        // Update digits with flip animation
        setDigit($container, 'd1', dayStr[0]);
        setDigit($container, 'd2', dayStr[1]);
        setDigit($container, 'd3', dayStr[2]);
        setDigit($container, 'h1', hourStr[0]);
        setDigit($container, 'h2', hourStr[1]);
        setDigit($container, 'm1', minStr[0]);
        setDigit($container, 'm2', minStr[1]);
        setDigit($container, 's1', secStr[0]);
        setDigit($container, 's2', secStr[1]);

        return true; // Continue updating
    }

    function setDigit($container, unit, value) {
        var $digit = $container.find('[data-unit="' + unit + '"]');
        var $face = $digit.find('.countdown-digit-face');
        var current = $face.text();

        if (current !== value) {
            $face.text(value);
            $digit.addClass('flipping');
            setTimeout(function() {
                $digit.removeClass('flipping');
            }, 300);
        }
    }

    // -------------------------------------------------------------------------
    // Initialize Countdown Widgets
    // -------------------------------------------------------------------------
    function initCountdowns() {
        // HTML panel widgets
        $('.countdown-widget').each(function() {
            var $widget = $(this);
            if ($widget.data('countdown-running')) return;

            var target = $widget.attr('data-countdown-date') || $widget.attr('data-target');
            if (!target) return;

            var targetDate = new Date(target);
            if (isNaN(targetDate.getTime())) return;

            var label = $widget.attr('data-label') || CONFIG.defaultLabel;
            var expiredText = $widget.attr('data-expired-text') || CONFIG.defaultExpiredText;
            var theme = $widget.attr('data-theme') || '';

            $widget.html(buildCountdownHTML(label, theme));

            var $container = $widget.find('.countdown-container');

            // Initial update
            updateCountdown($container, targetDate, expiredText);

            // Start interval
            var interval = setInterval(function() {
                var shouldContinue = updateCountdown($container, targetDate, expiredText);
                if (!shouldContinue) {
                    clearInterval(interval);
                }
            }, CONFIG.updateInterval);

            $widget.data('countdown-running', true);
        });

        // Panel-based countdowns
        $('.countdown-panel, .dashboard-panel.countdown-panel').each(function() {
            var $panel = $(this);
            if ($panel.data('countdown-running')) return;

            var target = $panel.attr('data-countdown-target');
            if (!target) return;

            var targetDate = new Date(target);
            if (isNaN(targetDate.getTime())) return;

            var label = $panel.find('.panel-head h3').text() || CONFIG.defaultLabel;
            var expiredText = $panel.attr('data-expired-text') || CONFIG.defaultExpiredText;
            var theme = $panel.attr('data-theme') || '';

            var $singleValue = $panel.find('.single-value .single-result');
            if (!$singleValue.length) {
                $singleValue = $panel.find('.panel-body');
            }

            $singleValue.html(buildCountdownHTML(label, theme));
            var $container = $singleValue.find('.countdown-container');

            updateCountdown($container, targetDate, expiredText);

            var interval = setInterval(function() {
                var shouldContinue = updateCountdown($container, targetDate, expiredText);
                if (!shouldContinue) clearInterval(interval);
            }, CONFIG.updateInterval);

            $panel.data('countdown-running', true);
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
    // String.padStart polyfill
    // -------------------------------------------------------------------------
    if (!String.prototype.padStart) {
        String.prototype.padStart = function(targetLength, padString) {
            targetLength = targetLength >> 0;
            padString = String(typeof padString !== 'undefined' ? padString : ' ');
            if (this.length >= targetLength) return String(this);
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        };
    }

    // -------------------------------------------------------------------------
    // MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) { return m.addedNodes.length > 0; });
        if (hasChanges) initCountdowns();
    });

    var dashBody = document.querySelector('.dashboard-body') || document.body;
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial — retry multiple times because HTML panel content
    // may load after the JS runs (especially in Design Studio preview)
    setTimeout(initCountdowns, 300);
    setTimeout(initCountdowns, 1000);
    setTimeout(initCountdowns, 2000);
    setTimeout(initCountdowns, 4000);

    // Public API
    window.splunkCountdown = {
        init: initCountdowns
    };
});
