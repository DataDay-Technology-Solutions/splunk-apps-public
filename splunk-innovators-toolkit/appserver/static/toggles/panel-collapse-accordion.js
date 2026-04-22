/**
 * Splunk Innovators Toolkit - Panel Collapse / Accordion
 * =======================================================
 * Makes panel headers clickable to collapse/expand the panel body.
 * Smooth slide animation with rotating arrow indicator.
 * All panels start expanded by default.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/panel-collapse-accordion.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    // Clear legacy global key that leaked state across dashboards
    try { localStorage.removeItem('sit-collapsed-panels'); } catch(e) {}

    // Scope storage key to current dashboard URL
    var dashPath = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    var STORAGE_KEY = 'sit-collapsed-panels-' + dashPath;
    var ANIMATION_DURATION = 300;

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Panel Collapse Accordion */',
        '.sit-collapsible .panel-head {',
        '    cursor: pointer;',
        '    user-select: none;',
        '    position: relative;',
        '    padding-right: 36px !important;',
        '    transition: background-color 0.2s ease;',
        '}',
        '.sit-collapsible .panel-head:hover {',
        '    background-color: rgba(255,255,255,0.05);',
        '}',
        '.sit-light-mode .sit-collapsible .panel-head:hover {',
        '    background-color: rgba(0,0,0,0.03);',
        '}',
        '',
        '/* Arrow indicator */',
        '.sit-collapse-arrow {',
        '    position: absolute;',
        '    right: 12px;',
        '    top: 50%;',
        '    transform: translateY(-50%) rotate(0deg);',
        '    transition: transform 0.3s ease;',
        '    width: 0;',
        '    height: 0;',
        '    border-left: 5px solid transparent;',
        '    border-right: 5px solid transparent;',
        '    border-top: 6px solid #a0a4b0;',
        '}',
        '.sit-light-mode .sit-collapse-arrow {',
        '    border-top-color: #6b7080;',
        '}',
        '.sit-collapsible.sit-collapsed .sit-collapse-arrow {',
        '    transform: translateY(-50%) rotate(-90deg);',
        '}',
        '',
        '/* Smooth collapse */',
        '.sit-collapsible .panel-body {',
        '    overflow: hidden;',
        '    transition: max-height ' + ANIMATION_DURATION + 'ms ease, opacity ' + ANIMATION_DURATION + 'ms ease;',
        '}',
        '.sit-collapsible.sit-collapsed .panel-body {',
        '    max-height: 0 !important;',
        '    opacity: 0;',
        '    padding-top: 0 !important;',
        '    padding-bottom: 0 !important;',
        '}',
        '',
        '/* Collapse all / Expand all button */',
        '.sit-collapse-all-btn {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 6px;',
        '    padding: 5px 12px;',
        '    border: 1px solid rgba(255,255,255,0.2);',
        '    border-radius: 16px;',
        '    background: rgba(255,255,255,0.06);',
        '    color: #a0a4b0;',
        '    font-size: 12px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all 0.25s ease;',
        '    outline: none;',
        '    user-select: none;',
        '    margin-left: 8px;',
        '}',
        '.sit-collapse-all-btn:hover {',
        '    background: rgba(255,255,255,0.12);',
        '    color: #fff;',
        '}',
        '.sit-light-mode .sit-collapse-all-btn {',
        '    border-color: rgba(0,0,0,0.15);',
        '    background: rgba(0,0,0,0.04);',
        '    color: #555;',
        '}',
        '.sit-light-mode .sit-collapse-all-btn:hover {',
        '    background: rgba(0,0,0,0.08);',
        '    color: #222;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-panel-collapse-styles').text(styles).appendTo('head');

    // =============================================
    // State management
    // =============================================

    function getSavedState() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function saveState(panelStates) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(panelStates));
        } catch (e) { /* silent */ }

        $(document).trigger('sit:preference-changed', {
            key: 'collapsedPanels',
            value: panelStates
        });
    }

    function getPanelId($panel, index) {
        var title = $panel.find('.panel-head h3').text().trim();
        return title ? title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : 'panel-' + index;
    }

    // =============================================
    // Setup panels
    // =============================================

    var $panels = $('.dashboard-panel');
    if (!$panels.length) {
        console.log('[SIT] Panel Collapse: No panels found, skipping.');
        return;
    }

    var savedState = getSavedState();
    var allCollapsed = false;

    $panels.each(function(index) {
        var $panel = $(this);
        var $head = $panel.find('.panel-head');
        var $body = $panel.find('.panel-body');

        if (!$head.length || !$body.length) return;

        var panelId = getPanelId($panel, index);
        $panel.addClass('sit-collapsible');
        $panel.attr('data-sit-panel-id', panelId);

        // Add arrow indicator
        $head.append('<span class="sit-collapse-arrow"></span>');

        // Set initial body max-height for animation
        var bodyHeight = $body.outerHeight(true);
        $body.css('max-height', bodyHeight + 'px');

        // Restore saved state
        if (savedState[panelId] === true) {
            $panel.addClass('sit-collapsed');
            $body.css('max-height', '0px');
        }

        // Click handler
        $head.on('click.sitCollapse', function(e) {
            // Don't collapse if clicking a link or button inside the header
            if ($(e.target).closest('a, button, input').length) return;

            var isCollapsed = $panel.hasClass('sit-collapsed');

            if (isCollapsed) {
                // Expand
                $panel.removeClass('sit-collapsed');
                // Recalculate height in case content changed
                $body.css('max-height', '0px');
                var newHeight = $body.prop('scrollHeight');
                $body.css('max-height', newHeight + 'px');

                // After transition, remove max-height constraint
                setTimeout(function() {
                    if (!$panel.hasClass('sit-collapsed')) {
                        $body.css('max-height', 'none');
                    }
                }, ANIMATION_DURATION + 50);
            } else {
                // Collapse: first set explicit height, then collapse
                $body.css('max-height', $body.outerHeight(true) + 'px');
                // Force reflow
                $body[0].offsetHeight; // jshint ignore:line
                $panel.addClass('sit-collapsed');
                $body.css('max-height', '0px');
            }

            // Save state
            savedState[panelId] = !isCollapsed;
            saveState(savedState);
        });
    });

    // =============================================
    // Collapse All / Expand All button
    // =============================================

    var $toggleAllBtn = $('<button>')
        .addClass('sit-collapse-all-btn')
        .html('\u2195 Collapse All')
        .attr('title', 'Toggle all panels');

    $toggleAllBtn.on('click', function() {
        allCollapsed = !allCollapsed;

        $panels.each(function(index) {
            var $panel = $(this);
            var $body = $panel.find('.panel-body');
            var panelId = $panel.attr('data-sit-panel-id');

            if (!$panel.hasClass('sit-collapsible')) return;

            if (allCollapsed) {
                if (!$panel.hasClass('sit-collapsed')) {
                    $body.css('max-height', $body.outerHeight(true) + 'px');
                    $body[0].offsetHeight; // jshint ignore:line
                    $panel.addClass('sit-collapsed');
                    $body.css('max-height', '0px');
                }
            } else {
                if ($panel.hasClass('sit-collapsed')) {
                    $panel.removeClass('sit-collapsed');
                    $body.css('max-height', '0px');
                    var newHeight = $body.prop('scrollHeight');
                    $body.css('max-height', newHeight + 'px');
                    setTimeout(function() {
                        if (!$panel.hasClass('sit-collapsed')) {
                            $body.css('max-height', 'none');
                        }
                    }, ANIMATION_DURATION + 50);
                }
            }

            if (panelId) {
                savedState[panelId] = allCollapsed;
            }
        });

        saveState(savedState);
        $(this).html(allCollapsed ? '\u2195 Expand All' : '\u2195 Collapse All');
    });

    // Insert button
    var $header = $('.dashboard-header');
    if ($header.length) {
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $toggleAllBtn.css({ float: 'right', marginTop: '8px' });
            $titleArea.append($toggleAllBtn);
        } else {
            $header.append($toggleAllBtn);
        }
    }

    // Listen for external commands
    $(document).on('sit:collapse-all-panels', function() {
        if (!allCollapsed) $toggleAllBtn.trigger('click');
    });

    $(document).on('sit:expand-all-panels', function() {
        if (allCollapsed) $toggleAllBtn.trigger('click');
    });

    console.log('[SIT] Panel Collapse Accordion loaded.', $panels.length, 'panels found.');
});
