/*
 * ============================================================================
 * Weather Widget (CSS-Only Animations)
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Creates a simple animated weather display widget with configurable city.
 *   Uses CSS-only weather animations (sun, rain, clouds, snow). No external
 *   API needed -- this is purely visual/decorative for NOC boards.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/weather-widget.js">
 *
 *   HTML Panel approach:
 *     <html>
 *       <div class="weather-widget"
 *            data-city="San Francisco"
 *            data-condition="sunny"
 *            data-temp="72"
 *            data-unit="F">
 *       </div>
 *     </html>
 *
 *   Multiple cities:
 *     <html>
 *       <div class="weather-row">
 *         <div class="weather-widget" data-city="NYC" data-condition="rain" data-temp="58"></div>
 *         <div class="weather-widget" data-city="London" data-condition="cloudy" data-temp="12" data-unit="C"></div>
 *         <div class="weather-widget" data-city="Tokyo" data-condition="sunny" data-temp="24" data-unit="C"></div>
 *       </div>
 *     </html>
 *
 *   Conditions: sunny, cloudy, rain, storm, snow, partly-cloudy, fog, windy
 *   Units: F (Fahrenheit), C (Celsius)
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.weather-row {',
        '    display: flex;',
        '    flex-wrap: wrap;',
        '    justify-content: center;',
        '    gap: 16px;',
        '    padding: 10px;',
        '}',
        '',
        '.weather-card {',
        '    display: flex;',
        '    flex-direction: column;',
        '    align-items: center;',
        '    padding: 20px 28px;',
        '    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);',
        '    border-radius: 16px;',
        '    border: 1px solid rgba(255, 255, 255, 0.08);',
        '    min-width: 140px;',
        '    position: relative;',
        '    overflow: hidden;',
        '    transition: all 0.3s ease;',
        '}',
        '.weather-card:hover {',
        '    background: rgba(255,255,255,0.08);',
        '    transform: translateY(-2px);',
        '}',
        '',
        '.weather-city {',
        '    font-size: 0.75em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.12em;',
        '    color: rgba(255, 255, 255, 0.45);',
        '    font-weight: 600;',
        '    margin-bottom: 12px;',
        '}',
        '',
        '.weather-icon-area {',
        '    width: 70px;',
        '    height: 70px;',
        '    position: relative;',
        '    margin-bottom: 10px;',
        '}',
        '',
        '.weather-temp {',
        '    font-size: 2em;',
        '    font-weight: 300;',
        '    color: rgba(255, 255, 255, 0.9);',
        '    line-height: 1;',
        '}',
        '.weather-temp-unit {',
        '    font-size: 0.5em;',
        '    color: rgba(255, 255, 255, 0.4);',
        '    vertical-align: super;',
        '}',
        '',
        '.weather-condition-label {',
        '    font-size: 0.7em;',
        '    color: rgba(255, 255, 255, 0.35);',
        '    margin-top: 6px;',
        '    text-transform: capitalize;',
        '}',
        '',
        '/* ---- SUN ---- */',
        '.weather-sun {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    width: 30px;',
        '    height: 30px;',
        '    transform: translate(-50%, -50%);',
        '    border-radius: 50%;',
        '    background: #fbbf24;',
        '    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.2);',
        '    animation: sunPulse 3s ease-in-out infinite;',
        '}',
        '@keyframes sunPulse {',
        '    0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2); }',
        '    50% { box-shadow: 0 0 25px rgba(251,191,36,0.7), 0 0 50px rgba(251,191,36,0.3); }',
        '}',
        '',
        '/* Sun rays */',
        '.weather-sun-ray {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    width: 2px;',
        '    height: 10px;',
        '    background: rgba(251, 191, 36, 0.6);',
        '    border-radius: 1px;',
        '    transform-origin: center 20px;',
        '    animation: rayRotate 10s linear infinite;',
        '}',
        '@keyframes rayRotate {',
        '    0% { transform: rotate(0deg) translateY(-20px); }',
        '    100% { transform: rotate(360deg) translateY(-20px); }',
        '}',
        '',
        '/* ---- CLOUD ---- */',
        '.weather-cloud {',
        '    position: absolute;',
        '    top: 50%;',
        '    left: 50%;',
        '    transform: translate(-50%, -50%);',
        '}',
        '.weather-cloud-body {',
        '    width: 44px;',
        '    height: 20px;',
        '    background: rgba(255, 255, 255, 0.25);',
        '    border-radius: 10px;',
        '    position: relative;',
        '}',
        '.weather-cloud-body::before {',
        '    content: "";',
        '    position: absolute;',
        '    top: -12px;',
        '    left: 8px;',
        '    width: 18px;',
        '    height: 18px;',
        '    background: rgba(255, 255, 255, 0.25);',
        '    border-radius: 50%;',
        '}',
        '.weather-cloud-body::after {',
        '    content: "";',
        '    position: absolute;',
        '    top: -8px;',
        '    left: 20px;',
        '    width: 14px;',
        '    height: 14px;',
        '    background: rgba(255, 255, 255, 0.25);',
        '    border-radius: 50%;',
        '}',
        '',
        '.weather-cloud-float {',
        '    animation: cloudFloat 4s ease-in-out infinite;',
        '}',
        '@keyframes cloudFloat {',
        '    0%, 100% { transform: translate(-50%, -50%) translateX(0); }',
        '    50% { transform: translate(-50%, -50%) translateX(5px); }',
        '}',
        '',
        '/* ---- RAIN ---- */',
        '.weather-raindrop {',
        '    position: absolute;',
        '    width: 2px;',
        '    height: 8px;',
        '    background: linear-gradient(180deg, transparent, rgba(96, 165, 250, 0.6));',
        '    border-radius: 0 0 2px 2px;',
        '    animation: rainFall 0.8s linear infinite;',
        '}',
        '@keyframes rainFall {',
        '    0% { transform: translateY(-10px); opacity: 0; }',
        '    30% { opacity: 1; }',
        '    100% { transform: translateY(35px); opacity: 0; }',
        '}',
        '',
        '/* ---- SNOW ---- */',
        '.weather-snowflake {',
        '    position: absolute;',
        '    width: 4px;',
        '    height: 4px;',
        '    background: rgba(255, 255, 255, 0.7);',
        '    border-radius: 50%;',
        '    animation: snowFall 2s linear infinite;',
        '}',
        '@keyframes snowFall {',
        '    0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }',
        '    20% { opacity: 1; }',
        '    100% { transform: translateY(40px) rotate(180deg); opacity: 0; }',
        '}',
        '',
        '/* ---- LIGHTNING ---- */',
        '.weather-lightning {',
        '    position: absolute;',
        '    top: 40%;',
        '    left: 50%;',
        '    transform: translateX(-50%);',
        '    font-size: 20px;',
        '    color: #fbbf24;',
        '    text-shadow: 0 0 10px rgba(251,191,36,0.8);',
        '    animation: lightning 3s ease infinite;',
        '    opacity: 0;',
        '}',
        '@keyframes lightning {',
        '    0%, 90%, 100% { opacity: 0; }',
        '    92%, 94% { opacity: 1; }',
        '    93%, 95% { opacity: 0; }',
        '    96% { opacity: 0.8; }',
        '}',
        '',
        '/* ---- FOG ---- */',
        '.weather-fog-line {',
        '    position: absolute;',
        '    left: 5px;',
        '    right: 5px;',
        '    height: 2px;',
        '    background: rgba(255, 255, 255, 0.15);',
        '    border-radius: 1px;',
        '    animation: fogDrift 3s ease-in-out infinite;',
        '}',
        '@keyframes fogDrift {',
        '    0%, 100% { transform: translateX(0); opacity: 0.5; }',
        '    50% { transform: translateX(8px); opacity: 0.8; }',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Weather Icon Builders
    // -------------------------------------------------------------------------
    function buildSunIcon() {
        var html = '<div class="weather-sun"></div>';
        for (var i = 0; i < 8; i++) {
            html += '<div class="weather-sun-ray" style="animation-delay: ' + (-i * 1.25) + 's; transform: rotate(' + (i * 45) + 'deg) translateY(-20px);"></div>';
        }
        return html;
    }

    function buildCloudIcon(withFloat) {
        var cls = withFloat ? ' weather-cloud-float' : '';
        return '<div class="weather-cloud' + cls + '"><div class="weather-cloud-body"></div></div>';
    }

    function buildRainDrops() {
        var html = '';
        for (var i = 0; i < 6; i++) {
            var x = 15 + Math.random() * 40;
            var delay = Math.random() * 0.8;
            html += '<div class="weather-raindrop" style="left: ' + x + 'px; top: 38px; animation-delay: ' + delay + 's;"></div>';
        }
        return html;
    }

    function buildSnowflakes() {
        var html = '';
        for (var i = 0; i < 8; i++) {
            var x = 10 + Math.random() * 50;
            var delay = Math.random() * 2;
            var size = 3 + Math.random() * 3;
            html += '<div class="weather-snowflake" style="left: ' + x + 'px; top: 30px; animation-delay: ' + delay + 's; width: ' + size + 'px; height: ' + size + 'px;"></div>';
        }
        return html;
    }

    function buildFogLines() {
        var html = '';
        for (var i = 0; i < 4; i++) {
            var y = 20 + i * 12;
            var delay = i * 0.5;
            html += '<div class="weather-fog-line" style="top: ' + y + 'px; animation-delay: ' + delay + 's;"></div>';
        }
        return html;
    }

    // -------------------------------------------------------------------------
    // Build Weather Icon by Condition
    // -------------------------------------------------------------------------
    function buildWeatherIcon(condition) {
        switch (condition) {
            case 'sunny':
                return buildSunIcon();
            case 'cloudy':
                return buildCloudIcon(true);
            case 'partly-cloudy':
                return '<div style="position:absolute;top:30%;left:25%;">' + buildSunIcon() + '</div>' +
                       '<div style="position:absolute;top:35%;left:35%;">' + buildCloudIcon(true) + '</div>';
            case 'rain':
                return buildCloudIcon(false) + buildRainDrops();
            case 'storm':
                return buildCloudIcon(false) + buildRainDrops() +
                       '<div class="weather-lightning">&#x26A1;</div>';
            case 'snow':
                return buildCloudIcon(false) + buildSnowflakes();
            case 'fog':
                return buildFogLines();
            case 'windy':
                return buildCloudIcon(true) +
                       '<div style="position:absolute;top:45%;left:10%;right:10%;height:2px;background:rgba(255,255,255,0.15);border-radius:1px;animation:fogDrift 1.5s ease-in-out infinite;"></div>' +
                       '<div style="position:absolute;top:55%;left:15%;right:5%;height:2px;background:rgba(255,255,255,0.1);border-radius:1px;animation:fogDrift 1.8s ease-in-out infinite 0.3s;"></div>';
            default:
                return buildSunIcon();
        }
    }

    // -------------------------------------------------------------------------
    // Initialize Weather Widgets
    // -------------------------------------------------------------------------
    function initWeatherWidgets() {
        $('.weather-widget').each(function() {
            var $el = $(this);
            if ($el.data('weather-initialized')) return;

            var city = $el.attr('data-city') || 'Local';
            var condition = $el.attr('data-condition') || 'sunny';
            var temp = $el.attr('data-temp') || '--';
            var unit = $el.attr('data-unit') || 'F';

            var condLabel = condition.replace('-', ' ');

            var html =
                '<div class="weather-card">' +
                '  <div class="weather-city">' + escapeHtml(city) + '</div>' +
                '  <div class="weather-icon-area">' + buildWeatherIcon(condition) + '</div>' +
                '  <div class="weather-temp">' + escapeHtml(temp) + '<span class="weather-temp-unit">&deg;' + escapeHtml(unit) + '</span></div>' +
                '  <div class="weather-condition-label">' + escapeHtml(condLabel) + '</div>' +
                '</div>';

            $el.html(html);
            $el.data('weather-initialized', true);
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
        if (hasChanges) initWeatherWidgets();
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial
    setTimeout(initWeatherWidgets, 300);

    // Public API
    window.splunkWeather = { init: initWeatherWidgets };
});
