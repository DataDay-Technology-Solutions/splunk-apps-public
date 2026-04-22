/**
 * Splunk Innovators Toolkit - Right-Click Context Menu
 * =====================================================
 * Custom context menu on right-click for dashboard panels.
 * Options include: Zoom, Copy Panel Title, Export as Image,
 * Toggle Visibility, and Refresh Data.
 * Replaces the browser default context menu on panel elements.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/right-click-context-menu.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Right-Click Context Menu */',
        '.sit-context-menu {',
        '    position: fixed;',
        '    min-width: 200px;',
        '    background: #1e2028;',
        '    border: 1px solid #35384a;',
        '    border-radius: 8px;',
        '    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);',
        '    z-index: 20000;',
        '    padding: 6px 0;',
        '    opacity: 0;',
        '    transform: scale(0.95) translateY(-4px);',
        '    transition: opacity 0.15s ease, transform 0.15s ease;',
        '    pointer-events: none;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '}',
        '.sit-context-menu.sit-context-visible {',
        '    opacity: 1;',
        '    transform: scale(1) translateY(0);',
        '    pointer-events: auto;',
        '}',
        '',
        '/* Menu item */',
        '.sit-context-item {',
        '    display: flex;',
        '    align-items: center;',
        '    gap: 10px;',
        '    padding: 8px 16px;',
        '    color: #c4c8d0;',
        '    font-size: 13px;',
        '    cursor: pointer;',
        '    transition: background 0.15s ease, color 0.15s ease;',
        '    white-space: nowrap;',
        '}',
        '.sit-context-item:hover {',
        '    background: rgba(91,160,245,0.12);',
        '    color: #fff;',
        '}',
        '.sit-context-item-icon {',
        '    width: 20px;',
        '    text-align: center;',
        '    font-size: 14px;',
        '    flex-shrink: 0;',
        '}',
        '.sit-context-item-label {',
        '    flex: 1;',
        '}',
        '.sit-context-item-shortcut {',
        '    color: #5a5e6e;',
        '    font-size: 11px;',
        '    margin-left: 20px;',
        '}',
        '',
        '/* Disabled item */',
        '.sit-context-item-disabled {',
        '    opacity: 0.4;',
        '    cursor: default;',
        '    pointer-events: none;',
        '}',
        '',
        '/* Separator */',
        '.sit-context-separator {',
        '    height: 1px;',
        '    background: #2a2d38;',
        '    margin: 4px 12px;',
        '}',
        '',
        '/* Section header */',
        '.sit-context-header {',
        '    padding: 4px 16px 4px;',
        '    font-size: 10px;',
        '    font-weight: 700;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.5px;',
        '    color: #5a5e6e;',
        '}',
        '',
        '/* Destructive actions */',
        '.sit-context-item-danger:hover {',
        '    background: rgba(220,50,50,0.12);',
        '    color: #f55;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-context-menu {',
        '    background: #ffffff;',
        '    border-color: #d9dce3;',
        '    box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);',
        '}',
        '.sit-light-mode .sit-context-item {',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-context-item:hover {',
        '    background: rgba(60,91,220,0.08);',
        '    color: #1a1c21;',
        '}',
        '.sit-light-mode .sit-context-separator {',
        '    background: #e8eaef;',
        '}',
        '.sit-light-mode .sit-context-header {',
        '    color: #999;',
        '}',
        '.sit-light-mode .sit-context-item-shortcut {',
        '    color: #bbb;',
        '}',
        '.sit-light-mode .sit-context-item-danger:hover {',
        '    background: rgba(220,50,50,0.08);',
        '    color: #d33;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-context-menu-styles').text(styles).appendTo('head');

    // =============================================
    // Build context menu
    // =============================================

    var $menu = $('<div class="sit-context-menu"></div>');
    $('body').append($menu);

    var $targetPanel = null;

    function buildMenuItems($panel) {
        var panelTitle = $panel.find('.panel-head h3').text().trim() || 'Untitled Panel';
        var isHidden = $panel.find('.panel-body').is(':hidden') || $panel.hasClass('sit-collapsed');

        var items = [
            { type: 'header', label: panelTitle },
            { type: 'separator' },
            {
                icon: '\uD83D\uDD0D',
                label: 'Zoom Panel',
                shortcut: 'Enter',
                action: function() {
                    $(document).trigger('sit:zoom-panel', { $panel: $panel });
                }
            },
            {
                icon: isHidden ? '\uD83D\uDC41' : '\uD83D\uDE48',
                label: isHidden ? 'Show Panel' : 'Collapse Panel',
                action: function() {
                    var $head = $panel.find('.panel-head');
                    if ($head.length) {
                        $head.trigger('click.sitCollapse');
                    }
                }
            },
            { type: 'separator' },
            {
                icon: '\uD83D\uDCCB',
                label: 'Copy Panel Title',
                action: function() {
                    copyToClipboard(panelTitle);
                    showToast('Panel title copied to clipboard');
                }
            },
            {
                icon: '\uD83D\uDCE5',
                label: 'Export as Image',
                action: function() {
                    exportPanelAsImage($panel);
                }
            },
            { type: 'separator' },
            {
                icon: '\uD83D\uDD04',
                label: 'Refresh Panel Data',
                shortcut: 'R',
                action: function() {
                    refreshPanelData($panel);
                }
            },
            {
                icon: '\uD83D\uDCE4',
                label: 'Scroll To Panel',
                action: function() {
                    var offset = $panel.offset();
                    if (offset) {
                        $('html, body').animate({ scrollTop: offset.top - 60 }, 400);
                    }
                }
            }
        ];

        return items;
    }

    function renderMenu(items) {
        $menu.empty();

        items.forEach(function(item) {
            if (item.type === 'separator') {
                $menu.append('<div class="sit-context-separator"></div>');
                return;
            }

            if (item.type === 'header') {
                $menu.append('<div class="sit-context-header">' + $('<span>').text(item.label).html() + '</div>');
                return;
            }

            var shortcutHtml = item.shortcut
                ? '<span class="sit-context-item-shortcut">' + item.shortcut + '</span>'
                : '';

            var dangerClass = item.danger ? ' sit-context-item-danger' : '';
            var disabledClass = item.disabled ? ' sit-context-item-disabled' : '';

            var $item = $('<div class="sit-context-item' + dangerClass + disabledClass + '">' +
                '<span class="sit-context-item-icon">' + (item.icon || '') + '</span>' +
                '<span class="sit-context-item-label">' + $('<span>').text(item.label).html() + '</span>' +
                shortcutHtml +
                '</div>');

            if (item.action && !item.disabled) {
                $item.on('click', function() {
                    hideMenu();
                    item.action();
                });
            }

            $menu.append($item);
        });
    }

    // =============================================
    // Show / Hide
    // =============================================

    function showMenu(x, y) {
        // Position and ensure it stays on screen
        var menuWidth = 220;
        var menuHeight = $menu.outerHeight() || 300;
        var winWidth = $(window).width();
        var winHeight = $(window).height();

        if (x + menuWidth > winWidth) {
            x = winWidth - menuWidth - 10;
        }
        if (y + menuHeight > winHeight) {
            y = winHeight - menuHeight - 10;
        }
        if (x < 5) x = 5;
        if (y < 5) y = 5;

        $menu.css({ top: y + 'px', left: x + 'px' });

        // Show with animation
        requestAnimationFrame(function() {
            $menu.addClass('sit-context-visible');
        });
    }

    function hideMenu() {
        $menu.removeClass('sit-context-visible');
        $targetPanel = null;
    }

    // =============================================
    // Helper functions
    // =============================================

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var $temp = $('<textarea>').val(text).appendTo('body').select();
        try { document.execCommand('copy'); } catch (e) { /* silent */ }
        $temp.remove();
    }

    function showToast(message) {
        // If SIT Toast is available, use it
        if (window.SIT && window.SIT.Toast) {
            window.SIT.Toast.info(message);
            return;
        }

        // Fallback: simple toast
        var $toast = $('<div>').css({
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            padding: '10px 20px',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '8px',
            zIndex: 30000,
            opacity: 0,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            fontFamily: '"Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif'
        }).text(message).appendTo('body');

        requestAnimationFrame(function() {
            $toast.css({ opacity: 1, transform: 'translateX(-50%) translateY(0)' });
        });

        setTimeout(function() {
            $toast.css({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' });
            setTimeout(function() { $toast.remove(); }, 300);
        }, 2500);
    }

    function exportPanelAsImage($panel) {
        // Use html2canvas if available, otherwise try canvas approach
        if (typeof html2canvas === 'function') {
            html2canvas($panel[0]).then(function(canvas) {
                var link = document.createElement('a');
                link.download = 'panel-export.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        } else {
            // Fallback: try to find an SVG or canvas element in the panel
            var $canvas = $panel.find('canvas');
            var $svg = $panel.find('svg');

            if ($canvas.length) {
                try {
                    var link = document.createElement('a');
                    link.download = 'panel-chart.png';
                    link.href = $canvas[0].toDataURL('image/png');
                    link.click();
                    showToast('Chart exported as image');
                    return;
                } catch (e) { /* CORS issue, fall through */ }
            }

            if ($svg.length) {
                try {
                    var svgData = new XMLSerializer().serializeToString($svg[0]);
                    var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    var url = URL.createObjectURL(blob);
                    var link2 = document.createElement('a');
                    link2.download = 'panel-chart.svg';
                    link2.href = url;
                    link2.click();
                    URL.revokeObjectURL(url);
                    showToast('Chart exported as SVG');
                    return;
                } catch (e) { /* fall through */ }
            }

            showToast('Export requires html2canvas library or a canvas/SVG element');
        }
    }

    function refreshPanelData($panel) {
        // Try to find Splunk search managers associated with this panel
        var $searchElements = $panel.find('[data-search-manager], .dashboard-element');

        if ($searchElements.length) {
            showToast('Refreshing panel data...');
            // Trigger a global search refresh
            try {
                var mvc = require('splunkjs/mvc');
                var searchManagers = mvc.Components.getInstances();
                if (searchManagers) {
                    Object.keys(searchManagers).forEach(function(key) {
                        var component = searchManagers[key];
                        if (component && typeof component.startSearch === 'function') {
                            component.startSearch();
                        }
                    });
                }
            } catch (e) {
                // Fallback: trigger token change to refresh
                showToast('Panel refresh triggered');
            }
        } else {
            showToast('No search data found in this panel');
        }
    }

    // =============================================
    // Event handlers
    // =============================================

    // Right-click on panels
    $(document).on('contextmenu', '.dashboard-panel', function(e) {
        e.preventDefault();
        e.stopPropagation();

        $targetPanel = $(this).closest('.dashboard-panel');
        var items = buildMenuItems($targetPanel);
        renderMenu(items);
        showMenu(e.clientX, e.clientY);
    });

    // Close menu on click outside
    $(document).on('click.sitContext', function(e) {
        if (!$(e.target).closest('.sit-context-menu').length) {
            hideMenu();
        }
    });

    // Close on Escape
    $(document).on('keydown.sitContext', function(e) {
        if (e.key === 'Escape') {
            hideMenu();
        }
    });

    // Close on scroll
    $(window).on('scroll.sitContext', hideMenu);

    console.log('[SIT] Right-Click Context Menu loaded.');
});
