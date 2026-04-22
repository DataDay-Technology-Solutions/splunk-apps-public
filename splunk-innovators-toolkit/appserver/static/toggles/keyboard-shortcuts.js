/**
 * Splunk Innovators Toolkit - Keyboard Shortcuts
 * ================================================
 * Adds keyboard navigation to Splunk dashboards.
 * Arrow keys to navigate between panels, Enter to zoom,
 * R to refresh, F for fullscreen, D for dark mode,
 * ? for help overlay showing all shortcuts.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/keyboard-shortcuts.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Keyboard Shortcuts */',
        '',
        '/* Panel focus ring */',
        '.sit-kbd-focused {',
        '    outline: 2px solid #5ba0f5 !important;',
        '    outline-offset: 2px;',
        '    box-shadow: 0 0 0 4px rgba(91,160,245,0.2) !important;',
        '    transition: outline 0.15s ease, box-shadow 0.15s ease;',
        '}',
        '.sit-light-mode .sit-kbd-focused {',
        '    outline-color: #3c5bdc !important;',
        '    box-shadow: 0 0 0 4px rgba(60,91,220,0.15) !important;',
        '}',
        '',
        '/* Help overlay */',
        '.sit-kbd-overlay {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    background: rgba(0,0,0,0.8);',
        '    z-index: 50000;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: opacity 0.25s ease, visibility 0.25s ease;',
        '}',
        '.sit-kbd-overlay.sit-kbd-overlay-visible {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '',
        '/* Help card */',
        '.sit-kbd-help {',
        '    background: #1e2028;',
        '    border: 1px solid #35384a;',
        '    border-radius: 12px;',
        '    padding: 32px 36px;',
        '    max-width: 560px;',
        '    width: 90%;',
        '    max-height: 80vh;',
        '    overflow-y: auto;',
        '    box-shadow: 0 20px 60px rgba(0,0,0,0.5);',
        '    transform: scale(0.95);',
        '    transition: transform 0.25s ease;',
        '}',
        '.sit-kbd-overlay-visible .sit-kbd-help {',
        '    transform: scale(1);',
        '}',
        '.sit-kbd-help::-webkit-scrollbar { width: 6px; }',
        '.sit-kbd-help::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }',
        '',
        '.sit-kbd-help-title {',
        '    font-size: 20px;',
        '    font-weight: 700;',
        '    color: #e0e3ea;',
        '    margin-bottom: 4px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '}',
        '.sit-kbd-help-subtitle {',
        '    font-size: 13px;',
        '    color: #6b7080;',
        '    margin-bottom: 24px;',
        '}',
        '',
        '/* Shortcut sections */',
        '.sit-kbd-section {',
        '    margin-bottom: 20px;',
        '}',
        '.sit-kbd-section-title {',
        '    font-size: 11px;',
        '    font-weight: 700;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.8px;',
        '    color: #5ba0f5;',
        '    margin-bottom: 10px;',
        '    padding-bottom: 4px;',
        '    border-bottom: 1px solid #2a2d38;',
        '}',
        '',
        '/* Shortcut row */',
        '.sit-kbd-row {',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: space-between;',
        '    padding: 6px 0;',
        '}',
        '.sit-kbd-desc {',
        '    color: #c4c8d0;',
        '    font-size: 13px;',
        '}',
        '',
        '/* Key badges */',
        '.sit-kbd-keys {',
        '    display: flex;',
        '    gap: 4px;',
        '    flex-shrink: 0;',
        '}',
        '.sit-kbd-key {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    min-width: 28px;',
        '    height: 26px;',
        '    padding: 0 8px;',
        '    background: #2a2d38;',
        '    border: 1px solid #3a3d4a;',
        '    border-bottom-width: 2px;',
        '    border-radius: 5px;',
        '    color: #c4c8d0;',
        '    font-size: 11px;',
        '    font-weight: 600;',
        '    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;',
        '}',
        '.sit-kbd-plus {',
        '    color: #555;',
        '    font-size: 12px;',
        '    align-self: center;',
        '}',
        '',
        '/* Close help */',
        '.sit-kbd-close {',
        '    margin-top: 20px;',
        '    text-align: center;',
        '    color: #6b7080;',
        '    font-size: 12px;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-kbd-overlay {',
        '    background: rgba(240,242,245,0.9);',
        '}',
        '.sit-light-mode .sit-kbd-help {',
        '    background: #ffffff;',
        '    border-color: #d9dce3;',
        '    box-shadow: 0 20px 60px rgba(0,0,0,0.15);',
        '}',
        '.sit-light-mode .sit-kbd-help-title {',
        '    color: #1a1c21;',
        '}',
        '.sit-light-mode .sit-kbd-section-title {',
        '    color: #3c5bdc;',
        '    border-bottom-color: #e0e3e8;',
        '}',
        '.sit-light-mode .sit-kbd-desc {',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-kbd-key {',
        '    background: #f0f2f5;',
        '    border-color: #ccc;',
        '    color: #333;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-keyboard-shortcuts-styles').text(styles).appendTo('head');

    // =============================================
    // Shortcuts definition
    // =============================================

    var shortcuts = {
        navigation: [
            { keys: ['\u2190', '\u2191', '\u2192', '\u2193'], desc: 'Navigate between panels' },
            { keys: ['Enter'], desc: 'Zoom focused panel' },
            { keys: ['Esc'], desc: 'Close zoom / Close overlay' }
        ],
        actions: [
            { keys: ['R'], desc: 'Refresh dashboard' },
            { keys: ['F'], desc: 'Toggle fullscreen mode' },
            { keys: ['D'], desc: 'Toggle dark/light mode' },
            { keys: ['S'], desc: 'Toggle sidebar' },
            { keys: ['C'], desc: 'Collapse/expand all panels' }
        ],
        general: [
            { keys: ['?'], desc: 'Show/hide this help overlay' },
            { keys: ['1'], desc: 'Go to tab 1' },
            { keys: ['2'], desc: 'Go to tab 2' },
            { keys: ['3'], desc: 'Go to tab 3' },
            { keys: ['Home'], desc: 'Focus first panel' },
            { keys: ['End'], desc: 'Focus last panel' }
        ]
    };

    // =============================================
    // Build help overlay
    // =============================================

    function buildHelpOverlay() {
        var $overlay = $('<div class="sit-kbd-overlay"></div>');
        var $help = $('<div class="sit-kbd-help"></div>');

        $help.append('<div class="sit-kbd-help-title">Keyboard Shortcuts</div>');
        $help.append('<div class="sit-kbd-help-subtitle">Innovators Toolkit</div>');

        var sections = {
            navigation: 'Navigation',
            actions: 'Quick Actions',
            general: 'General'
        };

        Object.keys(sections).forEach(function(key) {
            var $section = $('<div class="sit-kbd-section"></div>');
            $section.append('<div class="sit-kbd-section-title">' + sections[key] + '</div>');

            shortcuts[key].forEach(function(shortcut) {
                var $row = $('<div class="sit-kbd-row"></div>');
                $row.append('<span class="sit-kbd-desc">' + shortcut.desc + '</span>');

                var $keys = $('<span class="sit-kbd-keys"></span>');
                shortcut.keys.forEach(function(k, i) {
                    if (i > 0 && shortcut.keys.length <= 2) {
                        $keys.append('<span class="sit-kbd-plus">+</span>');
                    } else if (i > 0) {
                        $keys.append('<span class="sit-kbd-plus">/</span>');
                    }
                    $keys.append('<span class="sit-kbd-key">' + k + '</span>');
                });

                $row.append($keys);
                $section.append($row);
            });

            $help.append($section);
        });

        $help.append('<div class="sit-kbd-close">Press <strong>?</strong> or <strong>Esc</strong> to close</div>');
        $overlay.append($help);

        return $overlay;
    }

    var $helpOverlay = buildHelpOverlay();
    $('body').append($helpOverlay);

    var helpVisible = false;

    function toggleHelp() {
        helpVisible = !helpVisible;
        if (helpVisible) {
            $helpOverlay.addClass('sit-kbd-overlay-visible');
        } else {
            $helpOverlay.removeClass('sit-kbd-overlay-visible');
        }
    }

    function hideHelp() {
        helpVisible = false;
        $helpOverlay.removeClass('sit-kbd-overlay-visible');
    }

    $helpOverlay.on('click', function(e) {
        if (!$(e.target).closest('.sit-kbd-help').length) {
            hideHelp();
        }
    });

    // =============================================
    // Panel focus / navigation
    // =============================================

    var $panels = $('.dashboard-panel');
    var focusedIndex = -1;

    function focusPanel(index) {
        if (index < 0 || index >= $panels.length) return;

        // Remove previous focus
        $panels.removeClass('sit-kbd-focused');

        focusedIndex = index;
        var $panel = $panels.eq(index);
        $panel.addClass('sit-kbd-focused');

        // Scroll into view if needed
        var panelOffset = $panel.offset();
        var scrollTop = $(window).scrollTop();
        var windowHeight = $(window).height();

        if (panelOffset && (panelOffset.top < scrollTop || panelOffset.top > scrollTop + windowHeight - 100)) {
            $('html, body').animate({ scrollTop: panelOffset.top - 80 }, 200);
        }
    }

    function unfocusPanels() {
        $panels.removeClass('sit-kbd-focused');
        focusedIndex = -1;
    }

    function getVisiblePanels() {
        return $panels.filter(':visible');
    }

    function navigatePanel(direction) {
        var $visible = getVisiblePanels();
        if (!$visible.length) return;

        if (focusedIndex === -1) {
            // Start from the first visible panel
            focusPanel($panels.index($visible.eq(0)));
            return;
        }

        var $current = $panels.eq(focusedIndex);
        var currentOffset = $current.offset();
        if (!currentOffset) return;

        var best = null;
        var bestDist = Infinity;

        $visible.each(function() {
            var $p = $(this);
            var idx = $panels.index($p);
            if (idx === focusedIndex) return;

            var offset = $p.offset();
            if (!offset) return;

            var dx = offset.left - currentOffset.left;
            var dy = offset.top - currentOffset.top;
            var dist;

            switch (direction) {
                case 'right':
                    if (dx > 20) { dist = Math.abs(dx) + Math.abs(dy) * 2; }
                    break;
                case 'left':
                    if (dx < -20) { dist = Math.abs(dx) + Math.abs(dy) * 2; }
                    break;
                case 'down':
                    if (dy > 20) { dist = Math.abs(dy) + Math.abs(dx) * 2; }
                    break;
                case 'up':
                    if (dy < -20) { dist = Math.abs(dy) + Math.abs(dx) * 2; }
                    break;
            }

            if (dist !== undefined && dist < bestDist) {
                bestDist = dist;
                best = idx;
            }
        });

        if (best !== null) {
            focusPanel(best);
        }
    }

    // =============================================
    // Key handler
    // =============================================

    $(document).on('keydown.sitKeyboard', function(e) {
        // Ignore if typing in an input/textarea/select
        var tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || $(e.target).attr('contenteditable') === 'true') {
            return;
        }

        // Ignore if a modifier key is held (Ctrl, Alt, Meta) for most shortcuts
        var hasModifier = e.ctrlKey || e.altKey || e.metaKey;

        switch (e.key) {
            case '?':
                e.preventDefault();
                toggleHelp();
                break;

            case 'Escape':
                if (helpVisible) {
                    e.preventDefault();
                    hideHelp();
                } else {
                    unfocusPanels();
                }
                break;

            case 'ArrowRight':
                if (!hasModifier) { e.preventDefault(); navigatePanel('right'); }
                break;
            case 'ArrowLeft':
                if (!hasModifier) { e.preventDefault(); navigatePanel('left'); }
                break;
            case 'ArrowDown':
                if (!hasModifier) { e.preventDefault(); navigatePanel('down'); }
                break;
            case 'ArrowUp':
                if (!hasModifier) { e.preventDefault(); navigatePanel('up'); }
                break;

            case 'Enter':
                if (focusedIndex >= 0 && !hasModifier) {
                    e.preventDefault();
                    $(document).trigger('sit:zoom-panel', { $panel: $panels.eq(focusedIndex) });
                }
                break;

            case 'Home':
                if (!hasModifier) {
                    e.preventDefault();
                    var $firstVisible = getVisiblePanels().first();
                    if ($firstVisible.length) focusPanel($panels.index($firstVisible));
                }
                break;

            case 'End':
                if (!hasModifier) {
                    e.preventDefault();
                    var $lastVisible = getVisiblePanels().last();
                    if ($lastVisible.length) focusPanel($panels.index($lastVisible));
                }
                break;

            case 'r':
            case 'R':
                if (!hasModifier) {
                    e.preventDefault();
                    location.reload();
                }
                break;

            case 'f':
            case 'F':
                if (!hasModifier) {
                    e.preventDefault();
                    $(document).trigger('sit:toggle-fullscreen');
                }
                break;

            case 'd':
            case 'D':
                if (!hasModifier) {
                    e.preventDefault();
                    $(document).trigger('sit:toggle-dark-light');
                }
                break;

            case 's':
            case 'S':
                if (!hasModifier) {
                    e.preventDefault();
                    $(document).trigger('sit:toggle-sidebar');
                }
                break;

            case 'c':
            case 'C':
                if (!hasModifier) {
                    e.preventDefault();
                    $(document).trigger('sit:collapse-all-panels');
                }
                break;

            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                if (!hasModifier) {
                    var tabIdx = parseInt(e.key, 10) - 1;
                    $(document).trigger('sit:set-tab', { index: tabIdx });
                }
                break;

            default:
                break;
        }
    });

    // Click outside panels to unfocus
    $(document).on('click.sitKeyboard', function(e) {
        if (!$(e.target).closest('.dashboard-panel').length) {
            unfocusPanels();
        }
    });

    console.log('[SIT] Keyboard Shortcuts loaded. Press ? for help.');
});
