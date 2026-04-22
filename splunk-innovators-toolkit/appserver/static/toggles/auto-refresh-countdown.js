/**
 * Splunk Innovators Toolkit - Auto-Refresh Countdown
 * ====================================================
 * Adds a visual countdown ring/timer to the dashboard header showing
 * when the next auto-refresh will happen. A circular progress indicator
 * counts down, then triggers a dashboard refresh.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/auto-refresh-countdown.js">
 *
 * Configuration via data attributes (optional):
 *   Add to any element: data-sit-refresh-interval="300" (seconds, default 300 = 5 min)
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var STORAGE_KEY = 'sit-auto-refresh-interval';

    // =============================================
    // Configuration
    // =============================================

    // Check for custom interval from data attribute or localStorage
    function getInterval() {
        // Check data attribute
        var dataAttr = $('[data-sit-refresh-interval]').first().data('sit-refresh-interval');
        if (dataAttr) return parseInt(dataAttr, 10);

        // Check localStorage
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return parseInt(saved, 10);
        } catch (e) { /* silent */ }

        return 300; // Default: 5 minutes
    }

    var refreshInterval = getInterval();
    var timeRemaining = refreshInterval;
    var isPaused = false;
    var timerHandle = null;

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Auto-Refresh Countdown */',
        '.sit-refresh-container {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 8px;',
        '    margin-left: 10px;',
        '    position: relative;',
        '    cursor: pointer;',
        '    user-select: none;',
        '}',
        '',
        '/* SVG ring */',
        '.sit-refresh-ring {',
        '    width: 32px;',
        '    height: 32px;',
        '    transform: rotate(-90deg);',
        '}',
        '.sit-refresh-ring-bg {',
        '    fill: none;',
        '    stroke: rgba(255,255,255,0.08);',
        '    stroke-width: 3;',
        '}',
        '.sit-refresh-ring-progress {',
        '    fill: none;',
        '    stroke: #5ba0f5;',
        '    stroke-width: 3;',
        '    stroke-linecap: round;',
        '    transition: stroke-dashoffset 1s linear, stroke 0.3s ease;',
        '}',
        '.sit-refresh-ring-progress.sit-refresh-warning {',
        '    stroke: #f5a623;',
        '}',
        '.sit-refresh-ring-progress.sit-refresh-critical {',
        '    stroke: #f55;',
        '}',
        '',
        '/* Time text */',
        '.sit-refresh-time {',
        '    font-size: 12px;',
        '    font-weight: 600;',
        '    font-family: "SF Mono", "Fira Code", monospace;',
        '    color: #a0a4b0;',
        '    min-width: 36px;',
        '    text-align: center;',
        '    transition: color 0.3s ease;',
        '}',
        '.sit-refresh-time.sit-refresh-warning-text {',
        '    color: #f5a623;',
        '}',
        '.sit-refresh-time.sit-refresh-critical-text {',
        '    color: #f55;',
        '}',
        '',
        '/* Pause indicator */',
        '.sit-refresh-paused .sit-refresh-time {',
        '    color: #6b7080;',
        '}',
        '.sit-refresh-paused .sit-refresh-ring-progress {',
        '    stroke: #6b7080 !important;',
        '}',
        '',
        '/* Label */',
        '.sit-refresh-label {',
        '    font-size: 11px;',
        '    color: #6b7080;',
        '    white-space: nowrap;',
        '}',
        '',
        '/* Tooltip */',
        '.sit-refresh-tooltip {',
        '    position: absolute;',
        '    top: calc(100% + 8px);',
        '    left: 50%;',
        '    transform: translateX(-50%);',
        '    background: #1a1c24;',
        '    border: 1px solid #35384a;',
        '    border-radius: 8px;',
        '    padding: 10px 14px;',
        '    min-width: 180px;',
        '    z-index: 1000;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: opacity 0.2s ease, visibility 0.2s ease;',
        '    box-shadow: 0 6px 20px rgba(0,0,0,0.4);',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '}',
        '.sit-refresh-container:hover .sit-refresh-tooltip {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '.sit-refresh-tooltip-row {',
        '    display: flex;',
        '    justify-content: space-between;',
        '    align-items: center;',
        '    padding: 3px 0;',
        '    font-size: 12px;',
        '    color: #a0a4b0;',
        '}',
        '.sit-refresh-tooltip-row span:last-child {',
        '    color: #c4c8d0;',
        '    font-weight: 600;',
        '}',
        '.sit-refresh-tooltip-actions {',
        '    margin-top: 8px;',
        '    padding-top: 8px;',
        '    border-top: 1px solid #2a2d38;',
        '    display: flex;',
        '    gap: 6px;',
        '}',
        '.sit-refresh-tooltip-btn {',
        '    flex: 1;',
        '    padding: 5px 8px;',
        '    border: 1px solid #35384a;',
        '    border-radius: 4px;',
        '    background: transparent;',
        '    color: #a0a4b0;',
        '    font-size: 11px;',
        '    cursor: pointer;',
        '    transition: all 0.15s ease;',
        '    outline: none;',
        '}',
        '.sit-refresh-tooltip-btn:hover {',
        '    background: rgba(255,255,255,0.08);',
        '    color: #fff;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-refresh-ring-bg {',
        '    stroke: rgba(0,0,0,0.06);',
        '}',
        '.sit-light-mode .sit-refresh-ring-progress {',
        '    stroke: #3c5bdc;',
        '}',
        '.sit-light-mode .sit-refresh-time {',
        '    color: #555;',
        '}',
        '.sit-light-mode .sit-refresh-label {',
        '    color: #999;',
        '}',
        '.sit-light-mode .sit-refresh-tooltip {',
        '    background: #fff;',
        '    border-color: #d9dce3;',
        '    box-shadow: 0 6px 20px rgba(0,0,0,0.1);',
        '}',
        '.sit-light-mode .sit-refresh-tooltip-row {',
        '    color: #666;',
        '}',
        '.sit-light-mode .sit-refresh-tooltip-row span:last-child {',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-refresh-tooltip-btn {',
        '    border-color: #d9dce3;',
        '    color: #666;',
        '}',
        '.sit-light-mode .sit-refresh-tooltip-btn:hover {',
        '    background: rgba(0,0,0,0.04);',
        '    color: #222;',
        '}',
        '',
        '/* Pulse animation on refresh */',
        '@keyframes sit-refresh-pulse {',
        '    0% { transform: scale(1); }',
        '    50% { transform: scale(1.15); }',
        '    100% { transform: scale(1); }',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-auto-refresh-styles').text(styles).appendTo('head');

    // =============================================
    // SVG circle calculations
    // =============================================

    var RADIUS = 13;
    var CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    // =============================================
    // Build UI
    // =============================================

    var $container = $('<div class="sit-refresh-container" title="Auto-refresh countdown"></div>');

    // SVG Ring
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'sit-refresh-ring');
    svg.setAttribute('viewBox', '0 0 32 32');

    var circleBg = document.createElementNS(svgNS, 'circle');
    circleBg.setAttribute('class', 'sit-refresh-ring-bg');
    circleBg.setAttribute('cx', '16');
    circleBg.setAttribute('cy', '16');
    circleBg.setAttribute('r', String(RADIUS));

    var circleProgress = document.createElementNS(svgNS, 'circle');
    circleProgress.setAttribute('class', 'sit-refresh-ring-progress');
    circleProgress.setAttribute('cx', '16');
    circleProgress.setAttribute('cy', '16');
    circleProgress.setAttribute('r', String(RADIUS));
    circleProgress.setAttribute('stroke-dasharray', String(CIRCUMFERENCE));
    circleProgress.setAttribute('stroke-dashoffset', '0');

    svg.appendChild(circleBg);
    svg.appendChild(circleProgress);

    var $timeDisplay = $('<span class="sit-refresh-time"></span>');
    var $label = $('<span class="sit-refresh-label">refresh</span>');

    // Tooltip
    var $tooltip = $(
        '<div class="sit-refresh-tooltip">' +
        '  <div class="sit-refresh-tooltip-row"><span>Interval</span><span class="sit-tooltip-interval"></span></div>' +
        '  <div class="sit-refresh-tooltip-row"><span>Status</span><span class="sit-tooltip-status"></span></div>' +
        '  <div class="sit-refresh-tooltip-actions">' +
        '    <button class="sit-refresh-tooltip-btn sit-refresh-pause-btn">Pause</button>' +
        '    <button class="sit-refresh-tooltip-btn sit-refresh-now-btn">Refresh Now</button>' +
        '  </div>' +
        '</div>'
    );

    $container.append(svg, $timeDisplay, $label, $tooltip);

    // =============================================
    // Timer logic
    // =============================================

    function formatTime(seconds) {
        if (seconds >= 3600) {
            var h = Math.floor(seconds / 3600);
            var m = Math.floor((seconds % 3600) / 60);
            return h + ':' + (m < 10 ? '0' : '') + m;
        }
        var min = Math.floor(seconds / 60);
        var sec = seconds % 60;
        return min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function updateDisplay() {
        var progress = timeRemaining / refreshInterval;
        var offset = CIRCUMFERENCE * progress;
        circleProgress.setAttribute('stroke-dashoffset', String(offset));

        $timeDisplay.text(formatTime(timeRemaining));

        // Color changes
        var $progress = $(circleProgress);
        $progress.removeClass('sit-refresh-warning sit-refresh-critical');
        $timeDisplay.removeClass('sit-refresh-warning-text sit-refresh-critical-text');

        if (timeRemaining <= 10) {
            $progress.addClass('sit-refresh-critical');
            $timeDisplay.addClass('sit-refresh-critical-text');
        } else if (timeRemaining <= 30) {
            $progress.addClass('sit-refresh-warning');
            $timeDisplay.addClass('sit-refresh-warning-text');
        }

        // Tooltip info
        $tooltip.find('.sit-tooltip-interval').text(formatTime(refreshInterval));
        $tooltip.find('.sit-tooltip-status').text(isPaused ? 'Paused' : 'Active');
    }

    function tick() {
        if (isPaused) return;

        timeRemaining--;
        if (timeRemaining <= 0) {
            doRefresh();
            return;
        }
        updateDisplay();
    }

    function doRefresh() {
        // Pulse animation
        $(svg).css('animation', 'sit-refresh-pulse 0.5s ease');
        setTimeout(function() {
            $(svg).css('animation', '');
        }, 500);

        // Reset timer
        timeRemaining = refreshInterval;
        updateDisplay();

        // Trigger dashboard refresh
        // Option 1: Reload the page
        // Option 2: Trigger Splunk token change to re-run searches
        try {
            var mvc = require('splunkjs/mvc');
            var searchManagers = mvc.Components.getInstances();
            var refreshedCount = 0;

            if (searchManagers) {
                Object.keys(searchManagers).forEach(function(key) {
                    var component = searchManagers[key];
                    if (component && typeof component.startSearch === 'function') {
                        component.startSearch();
                        refreshedCount++;
                    }
                });
            }

            if (refreshedCount > 0) {
                console.log('[SIT] Auto-Refresh: Refreshed', refreshedCount, 'searches.');
            } else {
                // Fallback to page reload
                location.reload();
            }
        } catch (e) {
            location.reload();
        }
    }

    function startTimer() {
        stopTimer();
        timerHandle = setInterval(tick, 1000);
    }

    function stopTimer() {
        if (timerHandle) {
            clearInterval(timerHandle);
            timerHandle = null;
        }
    }

    function pauseTimer() {
        isPaused = true;
        $container.addClass('sit-refresh-paused');
        $tooltip.find('.sit-refresh-pause-btn').text('Resume');
        updateDisplay();
    }

    function resumeTimer() {
        isPaused = false;
        $container.removeClass('sit-refresh-paused');
        $tooltip.find('.sit-refresh-pause-btn').text('Pause');
        updateDisplay();
    }

    // =============================================
    // Event handlers
    // =============================================

    // Click container to pause/resume
    $container.on('click', function(e) {
        if ($(e.target).closest('.sit-refresh-tooltip-btn').length) return;
        if (isPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
    });

    // Tooltip buttons
    $tooltip.find('.sit-refresh-pause-btn').on('click', function(e) {
        e.stopPropagation();
        if (isPaused) {
            resumeTimer();
        } else {
            pauseTimer();
        }
    });

    $tooltip.find('.sit-refresh-now-btn').on('click', function(e) {
        e.stopPropagation();
        doRefresh();
    });

    // External events
    $(document).on('sit:pause-refresh', pauseTimer);
    $(document).on('sit:resume-refresh', resumeTimer);
    $(document).on('sit:set-refresh-interval', function(e, data) {
        if (data && data.seconds) {
            refreshInterval = parseInt(data.seconds, 10);
            timeRemaining = refreshInterval;
            try {
                localStorage.setItem(STORAGE_KEY, refreshInterval);
            } catch (ex) { /* silent */ }
            updateDisplay();

            $(document).trigger('sit:preference-changed', {
                key: 'refreshInterval',
                value: refreshInterval
            });
        }
    });

    // =============================================
    // Insert into DOM
    // =============================================

    var $header = $('.dashboard-header');
    if ($header.length) {
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $container.css({ float: 'right', marginTop: '6px' });
            $titleArea.append($container);
        } else {
            $header.append($container);
        }
    } else {
        $('body').prepend($container);
    }

    // Initialize
    updateDisplay();
    startTimer();

    console.log('[SIT] Auto-Refresh Countdown loaded. Interval:', refreshInterval, 'seconds.');
});
