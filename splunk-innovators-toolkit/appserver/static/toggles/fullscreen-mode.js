/**
 * Splunk Innovators Toolkit - Fullscreen Mode
 * ==============================================
 * Adds a fullscreen toggle button to the dashboard header.
 * Hides Splunk navigation chrome and uses the browser Fullscreen API.
 * Ideal for NOC wall displays and presentations.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/fullscreen-mode.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Fullscreen Mode */',
        '.sit-fullscreen-btn {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 6px;',
        '    padding: 6px 14px;',
        '    border: 1px solid rgba(255,255,255,0.25);',
        '    border-radius: 20px;',
        '    background: rgba(255,255,255,0.08);',
        '    color: #c4c8d0;',
        '    font-size: 13px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all 0.25s ease;',
        '    outline: none;',
        '    user-select: none;',
        '    margin-left: 8px;',
        '}',
        '.sit-fullscreen-btn:hover {',
        '    background: rgba(255,255,255,0.15);',
        '    border-color: rgba(255,255,255,0.4);',
        '    color: #fff;',
        '}',
        '.sit-fullscreen-btn .sit-fs-icon {',
        '    font-size: 14px;',
        '    transition: transform 0.3s ease;',
        '}',
        '.sit-fullscreen-btn:hover .sit-fs-icon {',
        '    transform: scale(1.15);',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-fullscreen-btn {',
        '    border-color: rgba(0,0,0,0.2);',
        '    background: rgba(0,0,0,0.05);',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-fullscreen-btn:hover {',
        '    background: rgba(0,0,0,0.1);',
        '    color: #111;',
        '}',
        '',
        '/* Fullscreen active state - hide Splunk chrome */',
        '.sit-fullscreen-active .splunk-bar,',
        '.sit-fullscreen-active .app-bar,',
        '.sit-fullscreen-active .splunk-header,',
        '.sit-fullscreen-active header,',
        '.sit-fullscreen-active .navbar,',
        '.sit-fullscreen-active .nav-bar,',
        '.sit-fullscreen-active [data-view="views/shared/appbar/Master"] {',
        '    display: none !important;',
        '}',
        '.sit-fullscreen-active .main-section-body {',
        '    padding-top: 0 !important;',
        '    margin-top: 0 !important;',
        '}',
        '.sit-fullscreen-active .dashboard-body {',
        '    padding-top: 10px;',
        '}',
        '',
        '/* Fullscreen indicator */',
        '.sit-fs-indicator {',
        '    position: fixed;',
        '    top: 10px;',
        '    right: 10px;',
        '    padding: 6px 14px;',
        '    background: rgba(0,0,0,0.7);',
        '    color: #5ba0f5;',
        '    font-size: 11px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    border-radius: 16px;',
        '    z-index: 10000;',
        '    opacity: 0;',
        '    transform: translateY(-10px);',
        '    transition: opacity 0.3s ease, transform 0.3s ease;',
        '    pointer-events: none;',
        '}',
        '.sit-fs-indicator.sit-fs-indicator-show {',
        '    opacity: 1;',
        '    transform: translateY(0);',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-fullscreen-styles').text(styles).appendTo('head');

    // =============================================
    // Fullscreen API helpers
    // =============================================

    function requestFullscreen(element) {
        if (element.requestFullscreen) {
            return element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            return element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            return element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            return element.msRequestFullscreen();
        }
        return null;
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            return document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            return document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            return document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            return document.msExitFullscreen();
        }
        return null;
    }

    function isFullscreen() {
        return !!(document.fullscreenElement ||
                  document.webkitFullscreenElement ||
                  document.mozFullScreenElement ||
                  document.msFullscreenElement);
    }

    function supportsFullscreen() {
        return !!(document.fullscreenEnabled ||
                  document.webkitFullscreenEnabled ||
                  document.mozFullScreenEnabled ||
                  document.msFullscreenEnabled);
    }

    // =============================================
    // Build button
    // =============================================

    var $btn = $('<button class="sit-fullscreen-btn" title="Toggle fullscreen mode (F)">')
        .html('<span class="sit-fs-icon">\u26F6</span><span class="sit-fs-label">Fullscreen</span>');

    // Indicator that shows briefly when entering/exiting
    var $indicator = $('<div class="sit-fs-indicator"></div>');
    $('body').append($indicator);

    var indicatorTimeout;

    function showIndicator(message) {
        clearTimeout(indicatorTimeout);
        $indicator.text(message).addClass('sit-fs-indicator-show');
        indicatorTimeout = setTimeout(function() {
            $indicator.removeClass('sit-fs-indicator-show');
        }, 2000);
    }

    // =============================================
    // State management
    // =============================================

    var isActive = false;

    function enterFullscreen() {
        isActive = true;
        $('body').addClass('sit-fullscreen-active');
        $btn.find('.sit-fs-icon').text('\u2716');
        $btn.find('.sit-fs-label').text('Exit');

        if (supportsFullscreen()) {
            requestFullscreen(document.documentElement);
        }

        showIndicator('Fullscreen mode -- press Escape or F to exit');

        // Re-trigger resize for charts
        setTimeout(function() { $(window).trigger('resize'); }, 300);

        $(document).trigger('sit:preference-changed', {
            key: 'fullscreenMode',
            value: true
        });
    }

    function exitFullscreenMode() {
        isActive = false;
        $('body').removeClass('sit-fullscreen-active');
        $btn.find('.sit-fs-icon').text('\u26F6');
        $btn.find('.sit-fs-label').text('Fullscreen');

        if (isFullscreen()) {
            exitFullscreen();
        }

        showIndicator('Exited fullscreen mode');

        setTimeout(function() { $(window).trigger('resize'); }, 300);

        $(document).trigger('sit:preference-changed', {
            key: 'fullscreenMode',
            value: false
        });
    }

    function toggleFullscreen() {
        if (isActive) {
            exitFullscreenMode();
        } else {
            enterFullscreen();
        }
    }

    // =============================================
    // Event handlers
    // =============================================

    $btn.on('click', toggleFullscreen);

    // Listen for browser fullscreen change (e.g. user pressed Escape)
    var fullscreenChangeEvents = 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange';
    $(document).on(fullscreenChangeEvents, function() {
        if (!isFullscreen() && isActive) {
            isActive = false;
            $('body').removeClass('sit-fullscreen-active');
            $btn.find('.sit-fs-icon').text('\u26F6');
            $btn.find('.sit-fs-label').text('Fullscreen');
        }
    });

    // External event triggers
    $(document).on('sit:toggle-fullscreen', toggleFullscreen);
    $(document).on('sit:enter-fullscreen', function() { if (!isActive) enterFullscreen(); });
    $(document).on('sit:exit-fullscreen', function() { if (isActive) exitFullscreenMode(); });

    // =============================================
    // Insert button
    // =============================================

    if (!supportsFullscreen()) {
        console.log('[SIT] Fullscreen: Browser does not support Fullscreen API, hiding chrome only.');
    }

    var $header = $('.dashboard-header');
    if ($header.length) {
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $btn.css({ float: 'right', marginTop: '8px' });
            $titleArea.append($btn);
        } else {
            $header.append($btn);
        }
    } else {
        $('body').prepend($btn);
    }

    console.log('[SIT] Fullscreen Mode loaded.');
});
