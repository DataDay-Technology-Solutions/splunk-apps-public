/**
 * Splunk Innovators Toolkit - Dark/Light Mode Toggle
 * ===================================================
 * Adds a dark/light mode toggle button to the dashboard header.
 * Smoothly transitions all dashboard colors between dark and light palettes.
 * Saves user preference to localStorage so it persists across sessions.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/dark-light-mode.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var STORAGE_KEY = 'sit-dark-light-mode';
    var TRANSITION_DURATION = '0.35s';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Dark/Light Mode Toggle */',
        '.sit-theme-toggle-btn {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 8px;',
        '    padding: 6px 14px;',
        '    border: 1px solid rgba(255,255,255,0.25);',
        '    border-radius: 20px;',
        '    background: rgba(255,255,255,0.08);',
        '    color: #c4c8d0;',
        '    font-size: 13px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all ' + TRANSITION_DURATION + ' ease;',
        '    outline: none;',
        '    user-select: none;',
        '    margin-left: 12px;',
        '    position: relative;',
        '    top: 0;',
        '    z-index: 100;',
        '}',
        '.sit-theme-toggle-btn:hover {',
        '    background: rgba(255,255,255,0.15);',
        '    border-color: rgba(255,255,255,0.4);',
        '    color: #fff;',
        '}',
        '.sit-theme-toggle-btn .sit-theme-icon {',
        '    font-size: 16px;',
        '    line-height: 1;',
        '    transition: transform 0.4s ease;',
        '}',
        '.sit-theme-toggle-btn:hover .sit-theme-icon {',
        '    transform: rotate(30deg);',
        '}',
        '',
        '/* Light mode overrides */',
        '.sit-light-mode .sit-theme-toggle-btn {',
        '    border-color: rgba(0,0,0,0.2);',
        '    background: rgba(0,0,0,0.05);',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-theme-toggle-btn:hover {',
        '    background: rgba(0,0,0,0.1);',
        '    border-color: rgba(0,0,0,0.3);',
        '    color: #111;',
        '}',
        '',
        '/* Transition wrapper for all dashboard elements */',
        '.sit-theme-transition,',
        '.sit-theme-transition .dashboard-body,',
        '.sit-theme-transition .dashboard-header,',
        '.sit-theme-transition .dashboard-row,',
        '.sit-theme-transition .dashboard-panel,',
        '.sit-theme-transition .panel-head,',
        '.sit-theme-transition .panel-body,',
        '.sit-theme-transition .panel-element-row,',
        '.sit-theme-transition .fieldset,',
        '.sit-theme-transition .splunk-textinput,',
        '.sit-theme-transition .splunk-dropdown,',
        '.sit-theme-transition .splunk-choice-input,',
        '.sit-theme-transition h2, .sit-theme-transition h3,',
        '.sit-theme-transition p, .sit-theme-transition span,',
        '.sit-theme-transition label {',
        '    transition: background-color ' + TRANSITION_DURATION + ' ease,',
        '               color ' + TRANSITION_DURATION + ' ease,',
        '               border-color ' + TRANSITION_DURATION + ' ease,',
        '               box-shadow ' + TRANSITION_DURATION + ' ease;',
        '}',
        '',
        '/* Light mode palette */',
        '.sit-light-mode .dashboard-body {',
        '    background-color: #f0f2f5 !important;',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode .dashboard-header {',
        '    background-color: #ffffff !important;',
        '    border-bottom: 1px solid #d9dce3 !important;',
        '}',
        '.sit-light-mode .dashboard-header h2 {',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode .dashboard-header p.description {',
        '    color: #5a5e6e !important;',
        '}',
        '.sit-light-mode .dashboard-panel {',
        '    background-color: #ffffff !important;',
        '    border: 1px solid #d9dce3 !important;',
        '    border-radius: 6px;',
        '    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;',
        '}',
        '.sit-light-mode .panel-head h3 {',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode .panel-body {',
        '    background-color: #ffffff !important;',
        '    color: #333 !important;',
        '}',
        '.sit-light-mode .fieldset {',
        '    background-color: #ffffff !important;',
        '    border-bottom: 1px solid #d9dce3 !important;',
        '}',
        '.sit-light-mode .fieldset label {',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode .splunk-textinput input,',
        '.sit-light-mode .splunk-dropdown .select2-choice {',
        '    background-color: #f7f8fa !important;',
        '    border-color: #c3c7d0 !important;',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode table.table-chrome > thead > tr > th {',
        '    background-color: #f0f2f5 !important;',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode table.table-chrome > tbody > tr > td {',
        '    color: #333 !important;',
        '    border-color: #e0e3e8 !important;',
        '}',
        '.sit-light-mode table.table-chrome > tbody > tr:nth-child(even) {',
        '    background-color: #f7f8fa !important;',
        '}',
        '.sit-light-mode .single-result .single-value {',
        '    color: #1a1c21 !important;',
        '}',
        '.sit-light-mode .single-result .under-label {',
        '    color: #5a5e6e !important;',
        '}',
        '.sit-light-mode .highcharts-background {',
        '    fill: #ffffff !important;',
        '}',
        '.sit-light-mode text.highcharts-title,',
        '.sit-light-mode text.highcharts-axis-title,',
        '.sit-light-mode .highcharts-axis-labels text {',
        '    fill: #333 !important;',
        '}',
        '.sit-light-mode .highcharts-legend-item text {',
        '    fill: #555 !important;',
        '}'
    ].join('\n');

    // =============================================
    // Inject styles
    // =============================================

    $('<style>').attr('id', 'sit-dark-light-mode-styles').text(styles).appendTo('head');

    // =============================================
    // Build toggle button
    // =============================================

    var $btn = $('<button>')
        .addClass('sit-theme-toggle-btn')
        .attr('title', 'Toggle dark/light mode')
        .html('<span class="sit-theme-icon"></span><span class="sit-theme-label"></span>');

    // =============================================
    // State management
    // =============================================

    function getSavedMode() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return saved;
            // Auto-detect: if theme has a light background, default to light mode
            var bgColor = window.getComputedStyle(document.querySelector('.dashboard-body') || document.body).backgroundColor;
            if (bgColor) {
                var match = bgColor.match(/\d+/g);
                if (match && match.length >= 3) {
                    var brightness = (parseInt(match[0]) * 299 + parseInt(match[1]) * 587 + parseInt(match[2]) * 114) / 1000;
                    if (brightness > 128) return 'light'; // Light theme detected
                }
            }
            return 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) { /* silent fail */ }

        // Notify user-preferences-persist if available
        $(document).trigger('sit:preference-changed', {
            key: 'darkLightMode',
            value: mode
        });
    }

    function applyMode(mode, animate) {
        var $body = $('body');

        if (animate) {
            $body.addClass('sit-theme-transition');
        }

        if (mode === 'light') {
            $body.addClass('sit-light-mode');
            $btn.find('.sit-theme-icon').text('\u2600\uFE0F');
            $btn.find('.sit-theme-label').text('Light');
        } else {
            $body.removeClass('sit-light-mode');
            $btn.find('.sit-theme-icon').text('\uD83C\uDF19');
            $btn.find('.sit-theme-label').text('Dark');
        }

        if (animate) {
            setTimeout(function() {
                $body.removeClass('sit-theme-transition');
            }, 500);
        }
    }

    // =============================================
    // Initialization
    // =============================================

    // Delay initialization so theme CSS has time to load and apply.
    // Without this delay, auto-detection reads Splunk's default light bg
    // and incorrectly classifies dark themes as "light".
    setTimeout(function() {
        var currentMode = getSavedMode();
        applyMode(currentMode, false);
    }, 500);
    var currentMode = 'dark'; // default until detection runs

    $btn.on('click', function() {
        currentMode = (currentMode === 'dark') ? 'light' : 'dark';
        saveMode(currentMode);
        applyMode(currentMode, true);
    });

    // Listen for external mode changes (e.g. keyboard shortcuts)
    $(document).on('sit:set-dark-mode', function() {
        currentMode = 'dark';
        saveMode(currentMode);
        applyMode(currentMode, true);
    });

    $(document).on('sit:set-light-mode', function() {
        currentMode = 'light';
        saveMode(currentMode);
        applyMode(currentMode, true);
    });

    $(document).on('sit:toggle-dark-light', function() {
        $btn.trigger('click');
    });

    // Insert button into header
    var $header = $('.dashboard-header');
    if ($header.length) {
        // Try to append after the title/description area
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $btn.css({ float: 'right', marginTop: '8px' });
            $titleArea.append($btn);
        } else {
            $header.append($btn);
        }
    } else {
        // Fallback: prepend to body
        $('body').prepend($btn);
    }

    console.log('[SIT] Dark/Light Mode Toggle loaded. Current mode:', currentMode);
});
