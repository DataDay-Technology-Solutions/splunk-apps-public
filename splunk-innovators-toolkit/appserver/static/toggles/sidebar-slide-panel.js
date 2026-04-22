/**
 * Splunk Innovators Toolkit - Sidebar Slide Panel
 * ==================================================
 * Adds a slide-out sidebar panel triggered by a hamburger menu icon.
 * The sidebar can contain navigation links, filters, or additional content.
 * Slides in from the left with a dark overlay backdrop.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/sidebar-slide-panel.js">
 *
 * To add custom sidebar content, dispatch a custom event:
 *   $(document).trigger('sit:sidebar-add-item', { label: 'My Link', href: '#', icon: 'U+1F4CA' });
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var SIDEBAR_WIDTH = 280;
    var ANIMATION_DURATION = '0.3s';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Sidebar Slide Panel */',
        '',
        '/* Hamburger button */',
        '.sit-hamburger-btn {',
        '    display: inline-flex;',
        '    flex-direction: column;',
        '    justify-content: center;',
        '    align-items: center;',
        '    width: 36px;',
        '    height: 36px;',
        '    padding: 0;',
        '    border: 1px solid rgba(255,255,255,0.2);',
        '    border-radius: 6px;',
        '    background: rgba(255,255,255,0.06);',
        '    cursor: pointer;',
        '    transition: all 0.25s ease;',
        '    outline: none;',
        '    position: relative;',
        '    z-index: 1001;',
        '    margin-right: 12px;',
        '    flex-shrink: 0;',
        '}',
        '.sit-hamburger-btn:hover {',
        '    background: rgba(255,255,255,0.12);',
        '    border-color: rgba(255,255,255,0.35);',
        '}',
        '.sit-hamburger-bar {',
        '    display: block;',
        '    width: 18px;',
        '    height: 2px;',
        '    background: #c4c8d0;',
        '    border-radius: 1px;',
        '    transition: all 0.3s ease;',
        '}',
        '.sit-hamburger-bar + .sit-hamburger-bar {',
        '    margin-top: 4px;',
        '}',
        '',
        '/* Hamburger animation to X */',
        '.sit-hamburger-open .sit-hamburger-bar:nth-child(1) {',
        '    transform: translateY(6px) rotate(45deg);',
        '}',
        '.sit-hamburger-open .sit-hamburger-bar:nth-child(2) {',
        '    opacity: 0;',
        '    transform: scaleX(0);',
        '}',
        '.sit-hamburger-open .sit-hamburger-bar:nth-child(3) {',
        '    transform: translateY(-6px) rotate(-45deg);',
        '}',
        '',
        '/* Overlay */',
        '.sit-sidebar-overlay {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    background: rgba(0,0,0,0.5);',
        '    z-index: 999;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: opacity ' + ANIMATION_DURATION + ' ease, visibility ' + ANIMATION_DURATION + ' ease;',
        '}',
        '.sit-sidebar-overlay.sit-sidebar-overlay-visible {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '',
        '/* Sidebar */',
        '.sit-sidebar {',
        '    position: fixed;',
        '    top: 0;',
        '    left: -' + SIDEBAR_WIDTH + 'px;',
        '    width: ' + SIDEBAR_WIDTH + 'px;',
        '    height: 100%;',
        '    background: linear-gradient(180deg, #1e2028, #171920);',
        '    z-index: 1000;',
        '    transition: left ' + ANIMATION_DURATION + ' cubic-bezier(0.25, 0.46, 0.45, 0.94);',
        '    display: flex;',
        '    flex-direction: column;',
        '    box-shadow: 4px 0 20px rgba(0,0,0,0.4);',
        '    overflow: hidden;',
        '}',
        '.sit-sidebar.sit-sidebar-open {',
        '    left: 0;',
        '}',
        '',
        '/* Sidebar header */',
        '.sit-sidebar-header {',
        '    padding: 20px;',
        '    border-bottom: 1px solid #2a2d38;',
        '    display: flex;',
        '    align-items: center;',
        '    gap: 10px;',
        '}',
        '.sit-sidebar-title {',
        '    font-size: 16px;',
        '    font-weight: 700;',
        '    color: #e0e3ea;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '}',
        '.sit-sidebar-logo {',
        '    font-size: 22px;',
        '}',
        '',
        '/* Sidebar content */',
        '.sit-sidebar-content {',
        '    flex: 1;',
        '    overflow-y: auto;',
        '    padding: 12px 0;',
        '}',
        '.sit-sidebar-content::-webkit-scrollbar {',
        '    width: 4px;',
        '}',
        '.sit-sidebar-content::-webkit-scrollbar-thumb {',
        '    background: rgba(255,255,255,0.15);',
        '    border-radius: 2px;',
        '}',
        '',
        '/* Sidebar section */',
        '.sit-sidebar-section {',
        '    padding: 8px 20px 4px;',
        '}',
        '.sit-sidebar-section-title {',
        '    font-size: 10px;',
        '    font-weight: 700;',
        '    text-transform: uppercase;',
        '    letter-spacing: 1px;',
        '    color: #6b7080;',
        '    margin-bottom: 6px;',
        '}',
        '',
        '/* Sidebar nav item */',
        '.sit-sidebar-item {',
        '    display: flex;',
        '    align-items: center;',
        '    gap: 10px;',
        '    padding: 10px 20px;',
        '    color: #a0a4b0;',
        '    font-size: 13px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    text-decoration: none;',
        '    cursor: pointer;',
        '    transition: all 0.2s ease;',
        '    border-left: 3px solid transparent;',
        '}',
        '.sit-sidebar-item:hover {',
        '    color: #e0e3ea;',
        '    background: rgba(255,255,255,0.05);',
        '    border-left-color: rgba(91,160,245,0.4);',
        '}',
        '.sit-sidebar-item.sit-sidebar-item-active {',
        '    color: #5ba0f5;',
        '    background: rgba(91,160,245,0.08);',
        '    border-left-color: #5ba0f5;',
        '}',
        '.sit-sidebar-item-icon {',
        '    font-size: 16px;',
        '    width: 20px;',
        '    text-align: center;',
        '}',
        '',
        '/* Sidebar divider */',
        '.sit-sidebar-divider {',
        '    height: 1px;',
        '    background: #2a2d38;',
        '    margin: 8px 20px;',
        '}',
        '',
        '/* Sidebar footer */',
        '.sit-sidebar-footer {',
        '    padding: 16px 20px;',
        '    border-top: 1px solid #2a2d38;',
        '    font-size: 11px;',
        '    color: #555;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-hamburger-btn {',
        '    border-color: rgba(0,0,0,0.15);',
        '    background: rgba(0,0,0,0.04);',
        '}',
        '.sit-light-mode .sit-hamburger-btn:hover {',
        '    background: rgba(0,0,0,0.08);',
        '}',
        '.sit-light-mode .sit-hamburger-bar {',
        '    background: #555;',
        '}',
        '.sit-light-mode .sit-sidebar {',
        '    background: linear-gradient(180deg, #ffffff, #f7f8fa);',
        '    box-shadow: 4px 0 20px rgba(0,0,0,0.15);',
        '}',
        '.sit-light-mode .sit-sidebar-header {',
        '    border-bottom-color: #e0e3e8;',
        '}',
        '.sit-light-mode .sit-sidebar-title {',
        '    color: #1a1c21;',
        '}',
        '.sit-light-mode .sit-sidebar-section-title {',
        '    color: #999;',
        '}',
        '.sit-light-mode .sit-sidebar-item {',
        '    color: #555;',
        '}',
        '.sit-light-mode .sit-sidebar-item:hover {',
        '    color: #1a1c21;',
        '    background: rgba(0,0,0,0.03);',
        '}',
        '.sit-light-mode .sit-sidebar-item.sit-sidebar-item-active {',
        '    color: #3c5bdc;',
        '    background: rgba(60,91,220,0.06);',
        '    border-left-color: #3c5bdc;',
        '}',
        '.sit-light-mode .sit-sidebar-divider {',
        '    background: #e0e3e8;',
        '}',
        '.sit-light-mode .sit-sidebar-footer {',
        '    border-top-color: #e0e3e8;',
        '    color: #aaa;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-sidebar-styles').text(styles).appendTo('head');

    // =============================================
    // Build sidebar structure
    // =============================================

    // Overlay
    var $overlay = $('<div class="sit-sidebar-overlay"></div>');

    // Sidebar
    var $sidebar = $('<div class="sit-sidebar"></div>');

    var $sidebarHeader = $(
        '<div class="sit-sidebar-header">' +
        '  <span class="sit-sidebar-logo">\u26A1</span>' +
        '  <span class="sit-sidebar-title">Dashboard Navigation</span>' +
        '</div>'
    );

    var $sidebarContent = $('<div class="sit-sidebar-content"></div>');

    var $sidebarFooter = $(
        '<div class="sit-sidebar-footer">' +
        '  Innovators Toolkit' +
        '</div>'
    );

    $sidebar.append($sidebarHeader, $sidebarContent, $sidebarFooter);

    // Hamburger button
    var $hamburger = $(
        '<button class="sit-hamburger-btn" title="Toggle sidebar navigation">' +
        '  <span class="sit-hamburger-bar"></span>' +
        '  <span class="sit-hamburger-bar"></span>' +
        '  <span class="sit-hamburger-bar"></span>' +
        '</button>'
    );

    // =============================================
    // Populate sidebar with panel links
    // =============================================

    function buildNavItems() {
        $sidebarContent.empty();

        // Dashboard panels section
        var $panels = $('.dashboard-panel');
        if ($panels.length) {
            var $section = $(
                '<div class="sit-sidebar-section">' +
                '  <div class="sit-sidebar-section-title">Dashboard Panels</div>' +
                '</div>'
            );
            $sidebarContent.append($section);

            $panels.each(function(i) {
                var $panel = $(this);
                var title = $panel.find('.panel-head h3').text().trim();
                if (!title) title = 'Panel ' + (i + 1);

                var $item = $('<a class="sit-sidebar-item">' +
                    '<span class="sit-sidebar-item-icon">\uD83D\uDCCA</span>' +
                    '<span>' + $('<span>').text(title).html() + '</span>' +
                    '</a>');

                $item.on('click', function() {
                    closeSidebar();
                    // Scroll to panel
                    var offset = $panel.offset();
                    if (offset) {
                        $('html, body').animate({ scrollTop: offset.top - 60 }, 400);
                    }
                });

                $sidebarContent.append($item);
            });
        }

        // Dashboard rows section (if tabs are active)
        var $rows = $('.dashboard-row');
        if ($rows.length > 1) {
            $sidebarContent.append('<div class="sit-sidebar-divider"></div>');
            var $rowSection = $(
                '<div class="sit-sidebar-section">' +
                '  <div class="sit-sidebar-section-title">Sections</div>' +
                '</div>'
            );
            $sidebarContent.append($rowSection);

            $rows.each(function(i) {
                var $row = $(this);
                var firstTitle = $row.find('.panel-head h3').first().text().trim();
                if (!firstTitle) firstTitle = 'Section ' + (i + 1);

                var $item = $('<a class="sit-sidebar-item">' +
                    '<span class="sit-sidebar-item-icon">\uD83D\uDCC1</span>' +
                    '<span>' + $('<span>').text(firstTitle).html() + '</span>' +
                    '</a>');

                $item.on('click', function() {
                    closeSidebar();
                    // If tab navigation is active, switch tab
                    $(document).trigger('sit:set-tab', { index: i });
                    // Otherwise scroll
                    var offset = $row.offset();
                    if (offset) {
                        $('html, body').animate({ scrollTop: offset.top - 60 }, 400);
                    }
                });

                $sidebarContent.append($item);
            });
        }

        // Quick actions section
        $sidebarContent.append('<div class="sit-sidebar-divider"></div>');
        var $actionsSection = $(
            '<div class="sit-sidebar-section">' +
            '  <div class="sit-sidebar-section-title">Quick Actions</div>' +
            '</div>'
        );
        $sidebarContent.append($actionsSection);

        var quickActions = [
            { icon: '\uD83D\uDD04', label: 'Refresh Dashboard', action: function() { location.reload(); } },
            { icon: '\u26A1', label: 'Toggle Fullscreen', action: function() { $(document).trigger('sit:toggle-fullscreen'); } },
            { icon: '\uD83C\uDF19', label: 'Toggle Dark/Light', action: function() { $(document).trigger('sit:toggle-dark-light'); } }
        ];

        quickActions.forEach(function(qa) {
            var $item = $('<a class="sit-sidebar-item">' +
                '<span class="sit-sidebar-item-icon">' + qa.icon + '</span>' +
                '<span>' + qa.label + '</span>' +
                '</a>');
            $item.on('click', function() {
                closeSidebar();
                qa.action();
            });
            $sidebarContent.append($item);
        });
    }

    // =============================================
    // Open / Close
    // =============================================

    var isOpen = false;

    function openSidebar() {
        isOpen = true;
        $sidebar.addClass('sit-sidebar-open');
        $overlay.addClass('sit-sidebar-overlay-visible');
        $hamburger.addClass('sit-hamburger-open');
    }

    function closeSidebar() {
        isOpen = false;
        $sidebar.removeClass('sit-sidebar-open');
        $overlay.removeClass('sit-sidebar-overlay-visible');
        $hamburger.removeClass('sit-hamburger-open');
    }

    function toggleSidebar() {
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // =============================================
    // Event handlers
    // =============================================

    $hamburger.on('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
    });

    $overlay.on('click', closeSidebar);

    // Close on Escape
    $(document).on('keydown.sitSidebar', function(e) {
        if (e.key === 'Escape' && isOpen) {
            closeSidebar();
        }
    });

    // Listen for external toggle
    $(document).on('sit:toggle-sidebar', toggleSidebar);
    $(document).on('sit:open-sidebar', openSidebar);
    $(document).on('sit:close-sidebar', closeSidebar);

    // Allow adding custom items
    $(document).on('sit:sidebar-add-item', function(e, data) {
        if (!data || !data.label) return;
        var $item = $('<a class="sit-sidebar-item">' +
            '<span class="sit-sidebar-item-icon">' + (data.icon || '\u2022') + '</span>' +
            '<span>' + $('<span>').text(data.label).html() + '</span>' +
            '</a>');
        if (data.href) {
            $item.attr('href', data.href);
        }
        if (data.onClick) {
            $item.on('click', data.onClick);
        }
        $sidebarContent.append($item);
    });

    // =============================================
    // Insert into DOM
    // =============================================

    $('body').append($overlay, $sidebar);

    // Insert hamburger into header
    var $header = $('.dashboard-header');
    if ($header.length) {
        var $titleArea = $header.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $titleArea.prepend($hamburger);
        } else {
            $header.prepend($hamburger);
        }
    } else {
        $('body').prepend($hamburger);
    }

    buildNavItems();

    console.log('[SIT] Sidebar Slide Panel loaded.');
});
