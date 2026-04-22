/*
 * ============================================================================
 * Real-Time Clock Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   World clock widget with timezone support. Shows current time with smooth
 *   seconds ticking. Can display multiple timezones for NOC boards. Features
 *   both digital and analog clock faces.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/real-time-clock.js">
 *
 *   HTML Panel approach (multiple clocks):
 *     <html>
 *       <div class="world-clock" data-timezone="America/New_York" data-label="New York"></div>
 *       <div class="world-clock" data-timezone="Europe/London" data-label="London"></div>
 *       <div class="world-clock" data-timezone="Asia/Tokyo" data-label="Tokyo"></div>
 *     </html>
 *
 *   For a clock row:
 *     <html>
 *       <div class="clock-row">
 *         <div class="world-clock" data-timezone="UTC" data-label="UTC"></div>
 *         <div class="world-clock" data-timezone="America/Los_Angeles" data-label="PST"></div>
 *         <div class="world-clock" data-timezone="America/New_York" data-label="EST"></div>
 *       </div>
 *     </html>
 *
 *   Optional attributes:
 *     - data-timezone  : IANA timezone string (default: local)
 *     - data-label     : Clock label
 *     - data-format    : "12" or "24" (default: 24)
 *     - data-style     : "digital" (default), "analog", "both"
 *     - data-show-date : "true" to show date below time
 *     - data-show-seconds: "false" to hide seconds
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.clock-row {',
        '    display: flex;',
        '    flex-wrap: wrap;',
        '    justify-content: center;',
        '    gap: 20px;',
        '    padding: 10px;',
        '}',
        '',
        '.world-clock-container {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    padding: 16px 24px;',
        '    background: rgba(255, 255, 255, 0.04);',
        '    border-radius: 12px;',
        '    border: 1px solid rgba(255, 255, 255, 0.08);',
        '    min-width: 160px;',
        '    transition: all 0.3s ease;',
        '}',
        '.world-clock-container:hover {',
        '    background: rgba(255, 255, 255, 0.07);',
        '    border-color: rgba(255, 255, 255, 0.12);',
        '}',
        '',
        '.clock-label {',
        '    font-size: 0.7em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.15em;',
        '    color: rgba(255, 255, 255, 0.4);',
        '    font-weight: 600;',
        '    margin-bottom: 8px;',
        '}',
        '',
        '/* Digital Clock */',
        '.clock-digital {',
        '    font-family: "SF Mono", "Fira Code", "Consolas", monospace;',
        '    font-size: 1.8em;',
        '    font-weight: 700;',
        '    color: rgba(255, 255, 255, 0.9);',
        '    letter-spacing: 0.04em;',
        '    line-height: 1;',
        '    display: flex;',
        '    align-items: baseline;',
        '}',
        '.clock-seconds {',
        '    font-size: 0.55em;',
        '    color: rgba(255, 255, 255, 0.45);',
        '    margin-left: 2px;',
        '    font-weight: 500;',
        '}',
        '.clock-ampm {',
        '    font-size: 0.4em;',
        '    color: rgba(255, 255, 255, 0.35);',
        '    margin-left: 4px;',
        '    font-weight: 500;',
        '    text-transform: uppercase;',
        '}',
        '.clock-colon {',
        '    animation: clockColonBlink 1s steps(2) infinite;',
        '}',
        '@keyframes clockColonBlink {',
        '    0% { opacity: 1; }',
        '    50% { opacity: 0.2; }',
        '}',
        '',
        '.clock-date {',
        '    font-size: 0.7em;',
        '    color: rgba(255, 255, 255, 0.3);',
        '    margin-top: 6px;',
        '    font-weight: 400;',
        '}',
        '',
        '/* Analog Clock */',
        '.clock-analog {',
        '    position: relative;',
        '    width: 100px;',
        '    height: 100px;',
        '    margin: 8px 0;',
        '}',
        '.clock-analog-face {',
        '    width: 100%;',
        '    height: 100%;',
        '    border-radius: 50%;',
        '    background: rgba(255, 255, 255, 0.03);',
        '    border: 2px solid rgba(255, 255, 255, 0.12);',
        '    position: relative;',
        '    box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);',
        '}',
        '.clock-hand {',
        '    position: absolute;',
        '    bottom: 50%;',
        '    left: 50%;',
        '    transform-origin: bottom center;',
        '    border-radius: 2px;',
        '}',
        '.clock-hand-hour {',
        '    width: 3px;',
        '    height: 25px;',
        '    background: rgba(255, 255, 255, 0.8);',
        '    margin-left: -1.5px;',
        '}',
        '.clock-hand-minute {',
        '    width: 2px;',
        '    height: 33px;',
        '    background: rgba(255, 255, 255, 0.65);',
        '    margin-left: -1px;',
        '}',
        '.clock-hand-second {',
        '    width: 1px;',
        '    height: 37px;',
        '    background: #ef4444;',
        '    margin-left: -0.5px;',
        '    transition: transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44);',
        '}',
        '.clock-center-dot {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    width: 6px;',
        '    height: 6px;',
        '    background: #ef4444;',
        '    border-radius: 50%;',
        '    transform: translate(-50%, -50%);',
        '    z-index: 10;',
        '}',
        '',
        '/* Tick marks */',
        '.clock-tick {',
        '    position: absolute;',
        '    top: 3px;',
        '    left: 50%;',
        '    width: 1px;',
        '    height: 6px;',
        '    background: rgba(255, 255, 255, 0.2);',
        '    transform-origin: bottom center;',
        '    margin-left: -0.5px;',
        '}',
        '.clock-tick.major {',
        '    height: 10px;',
        '    width: 2px;',
        '    margin-left: -1px;',
        '    background: rgba(255, 255, 255, 0.4);',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Get Time in Timezone
    // -------------------------------------------------------------------------
    function getTimeInTimezone(timezone) {
        var now = new Date();

        try {
            var options = {
                timeZone: timezone,
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: false
            };
            var formatter = new Intl.DateTimeFormat('en-US', options);
            var parts = formatter.formatToParts(now);

            var result = { hour: 0, minute: 0, second: 0 };
            parts.forEach(function(part) {
                if (part.type === 'hour') result.hour = parseInt(part.value, 10);
                if (part.type === 'minute') result.minute = parseInt(part.value, 10);
                if (part.type === 'second') result.second = parseInt(part.value, 10);
            });

            // Get date
            var dateFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            result.dateStr = dateFormatter.format(now);

            return result;
        } catch (e) {
            // Fallback to local time
            return {
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
                dateStr: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            };
        }
    }

    // -------------------------------------------------------------------------
    // Build Digital Clock HTML
    // -------------------------------------------------------------------------
    function buildDigitalClock() {
        return (
            '<div class="clock-digital">' +
            '  <span class="clock-hh">00</span>' +
            '  <span class="clock-colon">:</span>' +
            '  <span class="clock-mm">00</span>' +
            '  <span class="clock-seconds">:00</span>' +
            '  <span class="clock-ampm"></span>' +
            '</div>'
        );
    }

    // -------------------------------------------------------------------------
    // Build Analog Clock HTML
    // -------------------------------------------------------------------------
    function buildAnalogClock() {
        var html = '<div class="clock-analog"><div class="clock-analog-face">';

        // Tick marks
        for (var i = 0; i < 12; i++) {
            var angle = i * 30;
            var isMajor = (i % 3 === 0);
            var tickH = isMajor ? 44 : 47;
            html += '<div class="clock-tick' + (isMajor ? ' major' : '') + '"';
            html += ' style="transform: rotate(' + angle + 'deg) translateY(' + tickH + 'px);"></div>';
        }

        html += '<div class="clock-hand clock-hand-hour"></div>';
        html += '<div class="clock-hand clock-hand-minute"></div>';
        html += '<div class="clock-hand clock-hand-second"></div>';
        html += '<div class="clock-center-dot"></div>';
        html += '</div></div>';

        return html;
    }

    // -------------------------------------------------------------------------
    // Update Digital Clock
    // -------------------------------------------------------------------------
    function updateDigitalClock($container, time, format, showSeconds) {
        var h = time.hour;
        var m = time.minute;
        var s = time.second;
        var ampm = '';

        if (format === '12') {
            ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
        }

        $container.find('.clock-hh').text(String(h).padStart(2, '0'));
        $container.find('.clock-mm').text(String(m).padStart(2, '0'));

        if (showSeconds !== false) {
            $container.find('.clock-seconds').text(':' + String(s).padStart(2, '0'));
        } else {
            $container.find('.clock-seconds').hide();
        }

        if (format === '12') {
            $container.find('.clock-ampm').text(ampm);
        }
    }

    // -------------------------------------------------------------------------
    // Update Analog Clock
    // -------------------------------------------------------------------------
    function updateAnalogClock($container, time) {
        var hourAngle = (time.hour % 12) * 30 + time.minute * 0.5;
        var minuteAngle = time.minute * 6 + time.second * 0.1;
        var secondAngle = time.second * 6;

        $container.find('.clock-hand-hour').css('transform', 'rotate(' + hourAngle + 'deg)');
        $container.find('.clock-hand-minute').css('transform', 'rotate(' + minuteAngle + 'deg)');
        $container.find('.clock-hand-second').css('transform', 'rotate(' + secondAngle + 'deg)');
    }

    // -------------------------------------------------------------------------
    // Initialize Clocks
    // -------------------------------------------------------------------------
    function initClocks() {
        $('.world-clock').each(function() {
            var $el = $(this);
            if ($el.data('clock-running')) return;

            var timezone = $el.attr('data-timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
            var label = $el.attr('data-label') || timezone.split('/').pop().replace(/_/g, ' ');
            var format = $el.attr('data-format') || '24';
            var style = $el.attr('data-style') || 'digital';
            var showDate = $el.attr('data-show-date') === 'true';
            var showSeconds = $el.attr('data-show-seconds') !== 'false';

            // Build structure
            var html = '<div class="world-clock-container">';
            html += '<div class="clock-label">' + escapeHtml(label) + '</div>';

            if (style === 'analog' || style === 'both') {
                html += buildAnalogClock();
            }
            if (style === 'digital' || style === 'both') {
                html += buildDigitalClock();
            }
            if (showDate) {
                html += '<div class="clock-date"></div>';
            }

            html += '</div>';
            $el.html(html);

            var $container = $el.find('.world-clock-container');

            // Update function
            function update() {
                var time = getTimeInTimezone(timezone);

                if (style === 'digital' || style === 'both') {
                    updateDigitalClock($container, time, format, showSeconds);
                }
                if (style === 'analog' || style === 'both') {
                    updateAnalogClock($container, time);
                }
                if (showDate) {
                    $container.find('.clock-date').text(time.dateStr);
                }
            }

            // Initial update
            update();

            // Start interval
            setInterval(update, 1000);

            $el.data('clock-running', true);
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
        if (hasChanges) initClocks();
    });

    var dashBody = document.querySelector('.dashboard-body') || document.body;
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial — retry multiple times because HTML panel CDATA
    // content may load after the JS runs
    setTimeout(initClocks, 300);
    setTimeout(initClocks, 1000);
    setTimeout(initClocks, 2000);
    setTimeout(initClocks, 4000);

    // Public API
    window.splunkClock = { init: initClocks };
});
