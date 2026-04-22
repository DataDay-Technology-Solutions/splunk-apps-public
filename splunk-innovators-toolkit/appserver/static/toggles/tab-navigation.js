/**
 * Splunk Innovators Toolkit - Tab Navigation
 * =============================================
 * Converts dashboard rows into tabbed sections.
 * The first panel's title in each row becomes the tab label.
 * Only one row is visible at a time with animated transitions.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/tab-navigation.js">
 *
 * Tip: Give each row's first panel a descriptive title -- it becomes the tab name.
 *      Rows without panel titles will use "Tab 1", "Tab 2", etc.
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var STORAGE_KEY = 'sit-active-tab';
    var ANIMATION_DURATION = 300;

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Tab Navigation */',
        '.sit-tab-bar {',
        '    display: flex;',
        '    gap: 0;',
        '    padding: 0 20px;',
        '    background: linear-gradient(180deg, #1a1c24, #171920);',
        '    border-bottom: 2px solid #2a2d38;',
        '    overflow-x: auto;',
        '    scrollbar-width: none;',
        '    -ms-overflow-style: none;',
        '}',
        '.sit-tab-bar::-webkit-scrollbar { display: none; }',
        '',
        '.sit-tab-btn {',
        '    padding: 12px 24px;',
        '    background: transparent;',
        '    border: none;',
        '    border-bottom: 3px solid transparent;',
        '    color: #8a8fa0;',
        '    font-size: 13px;',
        '    font-weight: 600;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all 0.25s ease;',
        '    white-space: nowrap;',
        '    outline: none;',
        '    position: relative;',
        '}',
        '.sit-tab-btn:hover {',
        '    color: #c4c8d0;',
        '    background: rgba(255,255,255,0.04);',
        '}',
        '.sit-tab-btn.sit-tab-active {',
        '    color: #5ba0f5;',
        '    border-bottom-color: #5ba0f5;',
        '}',
        '',
        '/* Tab badge for count */',
        '.sit-tab-badge {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    min-width: 20px;',
        '    height: 18px;',
        '    padding: 0 5px;',
        '    margin-left: 8px;',
        '    border-radius: 9px;',
        '    background: rgba(255,255,255,0.1);',
        '    color: #8a8fa0;',
        '    font-size: 10px;',
        '    font-weight: 600;',
        '}',
        '.sit-tab-active .sit-tab-badge {',
        '    background: rgba(91,160,245,0.15);',
        '    color: #5ba0f5;',
        '}',
        '',
        '/* Row transitions */',
        '.sit-tab-row {',
        '    transition: opacity ' + ANIMATION_DURATION + 'ms ease, transform ' + ANIMATION_DURATION + 'ms ease;',
        '}',
        '.sit-tab-row.sit-tab-hidden {',
        '    display: none !important;',
        '    opacity: 0;',
        '    transform: translateY(8px);',
        '}',
        '.sit-tab-row.sit-tab-visible {',
        '    display: flex !important;',
        '    opacity: 1;',
        '    transform: translateY(0);',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-tab-bar {',
        '    background: linear-gradient(180deg, #ffffff, #f7f8fa);',
        '    border-bottom-color: #d9dce3;',
        '}',
        '.sit-light-mode .sit-tab-btn {',
        '    color: #6b7080;',
        '}',
        '.sit-light-mode .sit-tab-btn:hover {',
        '    color: #333;',
        '    background: rgba(0,0,0,0.03);',
        '}',
        '.sit-light-mode .sit-tab-btn.sit-tab-active {',
        '    color: #3c5bdc;',
        '    border-bottom-color: #3c5bdc;',
        '}',
        '.sit-light-mode .sit-tab-badge {',
        '    background: rgba(0,0,0,0.06);',
        '    color: #666;',
        '}',
        '.sit-light-mode .sit-tab-active .sit-tab-badge {',
        '    background: rgba(60,91,220,0.1);',
        '    color: #3c5bdc;',
        '}',
        '',
        '/* Keyboard focus */',
        '.sit-tab-btn:focus-visible {',
        '    outline: 2px solid #5ba0f5;',
        '    outline-offset: -2px;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-tab-navigation-styles').text(styles).appendTo('head');

    // =============================================
    // Build tabs
    // =============================================

    var $rows = $('.dashboard-body .dashboard-row');
    if ($rows.length < 2) {
        console.log('[SIT] Tab Navigation: Fewer than 2 rows, skipping tab creation.');
        return;
    }

    // Check for page-group markers (Design Studio multi-page output)
    var hasPageGroups = $rows.find('[data-sit-page]').length > 0;
    var tabs = [];

    if (hasPageGroups) {
        // Group consecutive rows by their data-sit-page marker
        var currentGroup = null;
        $rows.each(function() {
            var $row = $(this);
            var $marker = $row.find('[data-sit-page]').first();
            if ($marker.length) {
                // New page group starts
                currentGroup = {
                    label: $marker.attr('data-sit-page'),
                    panelCount: 0,
                    $rows: []
                };
                tabs.push(currentGroup);
                // Hide the marker panel
                $marker.closest('.dashboard-panel').hide();
            }
            if (currentGroup) {
                currentGroup.$rows.push($row);
                currentGroup.panelCount += $row.find('.dashboard-panel:visible').length;
                $row.addClass('sit-tab-row');
            }
        });
    } else {
        // Legacy: each row = one tab
        $rows.each(function(i) {
            var $row = $(this);
            var $firstPanelTitle = $row.find('.panel-head h3').first();
            var title = $firstPanelTitle.text().trim() || ('Tab ' + (i + 1));
            var panelCount = $row.find('.dashboard-panel').length;

            tabs.push({
                label: title,
                panelCount: panelCount,
                $rows: [$row]
            });

            $row.addClass('sit-tab-row');
        });
    }

    // Build tab bar
    var $tabBar = $('<div class="sit-tab-bar" role="tablist"></div>');

    tabs.forEach(function(tab, i) {
        var badge = tab.panelCount > 1
            ? '<span class="sit-tab-badge">' + tab.panelCount + '</span>'
            : '';

        var $btn = $('<button class="sit-tab-btn" role="tab">')
            .attr('data-tab-index', i)
            .attr('aria-selected', 'false')
            .html(tab.label + badge);

        $tabBar.append($btn);
    });

    // Insert tab bar before the first row
    var $dashBody = $('.dashboard-body');
    var $firstRow = $dashBody.find('.dashboard-row').first();
    $firstRow.before($tabBar);

    // =============================================
    // Tab switching
    // =============================================

    function getSavedTab() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            var idx = saved !== null ? parseInt(saved, 10) : 0;
            return (idx >= 0 && idx < tabs.length) ? idx : 0;
        } catch (e) {
            return 0;
        }
    }

    function saveTab(index) {
        try {
            localStorage.setItem(STORAGE_KEY, index);
        } catch (e) { /* silent */ }

        $(document).trigger('sit:preference-changed', {
            key: 'activeTab',
            value: index
        });
    }

    function activateTab(index, animate) {
        if (index < 0 || index >= tabs.length) return;

        // Update buttons
        $tabBar.find('.sit-tab-btn').removeClass('sit-tab-active').attr('aria-selected', 'false');
        $tabBar.find('.sit-tab-btn[data-tab-index="' + index + '"]')
            .addClass('sit-tab-active')
            .attr('aria-selected', 'true');

        // Update rows (supports multiple rows per tab)
        tabs.forEach(function(tab, i) {
            var $tabRows = tab.$rows ? $(tab.$rows.map(function(r) { return r[0]; })) : tab.$row;
            if (i === index) {
                $tabRows.removeClass('sit-tab-hidden');
                if (animate) {
                    $tabRows.css({ opacity: 0, transform: 'translateY(8px)' });
                    setTimeout(function() {
                        $tabRows.addClass('sit-tab-visible');
                        $tabRows.css({ opacity: '', transform: '' });
                    }, 20);
                } else {
                    $tabRows.addClass('sit-tab-visible');
                }
            } else {
                $tabRows.removeClass('sit-tab-visible').addClass('sit-tab-hidden');
            }
        });

        // Trigger resize event so charts re-render at correct dimensions
        setTimeout(function() {
            $(window).trigger('resize');
        }, ANIMATION_DURATION + 50);
    }

    // Click handler
    $tabBar.on('click', '.sit-tab-btn', function() {
        var idx = parseInt($(this).data('tab-index'), 10);
        activateTab(idx, true);
        saveTab(idx);
    });

    // Keyboard navigation
    $tabBar.on('keydown', '.sit-tab-btn', function(e) {
        var currentIdx = parseInt($(this).data('tab-index'), 10);
        var newIdx = currentIdx;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            newIdx = (currentIdx + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            newIdx = (currentIdx - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            newIdx = 0;
        } else if (e.key === 'End') {
            newIdx = tabs.length - 1;
        } else {
            return;
        }

        e.preventDefault();
        $tabBar.find('.sit-tab-btn[data-tab-index="' + newIdx + '"]').focus().trigger('click');
    });

    // Listen for external tab change
    $(document).on('sit:set-tab', function(e, data) {
        if (data && typeof data.index === 'number') {
            activateTab(data.index, true);
            saveTab(data.index);
        }
    });

    // Initialize
    var initialTab = getSavedTab();
    activateTab(initialTab, false);

    console.log('[SIT] Tab Navigation loaded.', tabs.length, 'tabs created.');
});
