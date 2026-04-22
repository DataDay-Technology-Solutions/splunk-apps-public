/**
 * Splunk Innovators Toolkit - Panel Zoom / Focus
 * ================================================
 * Click any panel to zoom it to fill the screen with a smooth animation.
 * Click again or press Escape to return to normal view.
 * Great for drilling into a specific chart or visualization.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/panel-zoom-focus.js">
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var ANIMATION_DURATION = '0.4s';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT Panel Zoom Focus */',
        '',
        '/* Zoom hint on hover */',
        '.sit-zoomable {',
        '    position: relative;',
        '    cursor: pointer;',
        '}',
        '.sit-zoomable::after {',
        '    content: "\\2922";',
        '    position: absolute;',
        '    top: 8px;',
        '    right: 10px;',
        '    width: 28px;',
        '    height: 28px;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    background: rgba(0,0,0,0.5);',
        '    color: #a0a4b0;',
        '    font-size: 16px;',
        '    border-radius: 6px;',
        '    opacity: 0;',
        '    transition: opacity 0.2s ease, background 0.2s ease;',
        '    pointer-events: none;',
        '    z-index: 5;',
        '}',
        '.sit-zoomable:hover::after {',
        '    opacity: 1;',
        '}',
        '.sit-zoomable:hover::after {',
        '    background: rgba(0,0,0,0.65);',
        '    color: #fff;',
        '}',
        '',
        '/* Light mode hint */',
        '.sit-light-mode .sit-zoomable::after {',
        '    background: rgba(255,255,255,0.8);',
        '    color: #555;',
        '}',
        '.sit-light-mode .sit-zoomable:hover::after {',
        '    background: rgba(255,255,255,0.95);',
        '    color: #222;',
        '}',
        '',
        '/* Overlay for zoomed state */',
        '.sit-zoom-overlay {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    background: rgba(0,0,0,0.75);',
        '    z-index: 9998;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: opacity ' + ANIMATION_DURATION + ' ease, visibility ' + ANIMATION_DURATION + ' ease;',
        '}',
        '.sit-zoom-overlay.sit-zoom-overlay-active {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '.sit-light-mode .sit-zoom-overlay {',
        '    background: rgba(240,242,245,0.9);',
        '}',
        '',
        '/* Zoomed panel */',
        '.sit-zoomed {',
        '    position: fixed !important;',
        '    z-index: 9999 !important;',
        '    transition: top ' + ANIMATION_DURATION + ' cubic-bezier(0.25, 0.46, 0.45, 0.94),',
        '               left ' + ANIMATION_DURATION + ' cubic-bezier(0.25, 0.46, 0.45, 0.94),',
        '               width ' + ANIMATION_DURATION + ' cubic-bezier(0.25, 0.46, 0.45, 0.94),',
        '               height ' + ANIMATION_DURATION + ' cubic-bezier(0.25, 0.46, 0.45, 0.94);',
        '    border-radius: 8px;',
        '    overflow: auto;',
        '    box-shadow: 0 12px 48px rgba(0,0,0,0.5) !important;',
        '}',
        '.sit-zoomed .panel-body {',
        '    height: calc(100% - 44px);',
        '    overflow: auto;',
        '}',
        '.sit-zoomed .panel-element-row {',
        '    height: 100%;',
        '}',
        '.sit-zoomed .panel-element-row .dashboard-element {',
        '    height: 100%;',
        '}',
        '',
        '/* Close button on zoomed panel */',
        '.sit-zoom-close {',
        '    position: absolute;',
        '    top: 10px;',
        '    right: 10px;',
        '    width: 32px;',
        '    height: 32px;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    background: rgba(0,0,0,0.6);',
        '    color: #fff;',
        '    font-size: 18px;',
        '    border: none;',
        '    border-radius: 50%;',
        '    cursor: pointer;',
        '    z-index: 10;',
        '    transition: background 0.2s ease, transform 0.2s ease;',
        '}',
        '.sit-zoom-close:hover {',
        '    background: rgba(220,50,50,0.8);',
        '    transform: scale(1.1);',
        '}',
        '.sit-light-mode .sit-zoom-close {',
        '    background: rgba(0,0,0,0.1);',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-zoom-close:hover {',
        '    background: rgba(220,50,50,0.8);',
        '    color: #fff;',
        '}',
        '',
        '/* Hint tooltip */',
        '.sit-zoom-hint {',
        '    position: fixed;',
        '    bottom: 20px;',
        '    left: 50%;',
        '    transform: translateX(-50%) translateY(20px);',
        '    padding: 8px 18px;',
        '    background: rgba(0,0,0,0.8);',
        '    color: #ccc;',
        '    font-size: 12px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    border-radius: 20px;',
        '    z-index: 10001;',
        '    opacity: 0;',
        '    transition: opacity 0.3s ease, transform 0.3s ease;',
        '    pointer-events: none;',
        '}',
        '.sit-zoom-hint.sit-zoom-hint-show {',
        '    opacity: 1;',
        '    transform: translateX(-50%) translateY(0);',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-panel-zoom-styles').text(styles).appendTo('head');

    // =============================================
    // Build overlay and hint
    // =============================================

    var $overlay = $('<div class="sit-zoom-overlay"></div>');
    var $hint = $('<div class="sit-zoom-hint">Press Escape or click to close</div>');
    $('body').append($overlay, $hint);

    // =============================================
    // State
    // =============================================

    var $zoomedPanel = null;
    var originalRect = null;
    var hintTimeout = null;

    function showHint() {
        clearTimeout(hintTimeout);
        $hint.addClass('sit-zoom-hint-show');
        hintTimeout = setTimeout(function() {
            $hint.removeClass('sit-zoom-hint-show');
        }, 3000);
    }

    function hideHint() {
        clearTimeout(hintTimeout);
        $hint.removeClass('sit-zoom-hint-show');
    }

    // =============================================
    // Zoom in / out
    // =============================================

    function zoomIn($panel) {
        if ($zoomedPanel) return;

        var rect = $panel[0].getBoundingClientRect();
        originalRect = {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        };

        // Store original inline styles
        $panel.data('sit-original-style', $panel.attr('style') || '');

        // Add close button
        var $closeBtn = $('<button class="sit-zoom-close">&times;</button>');
        $closeBtn.on('click', function(e) {
            e.stopPropagation();
            zoomOut();
        });
        $panel.append($closeBtn);

        // First position at original location (fixed)
        $panel.css({
            position: 'fixed',
            top: originalRect.top + 'px',
            left: originalRect.left + 'px',
            width: originalRect.width + 'px',
            height: originalRect.height + 'px',
            margin: 0,
            zIndex: 9999
        });

        $panel.addClass('sit-zoomed');
        $overlay.addClass('sit-zoom-overlay-active');

        // Force reflow
        $panel[0].offsetHeight; // jshint ignore:line

        // Animate to fullscreen with margin
        var margin = 30;
        $panel.css({
            top: margin + 'px',
            left: margin + 'px',
            width: 'calc(100vw - ' + (margin * 2) + 'px)',
            height: 'calc(100vh - ' + (margin * 2) + 'px)'
        });

        $zoomedPanel = $panel;

        // Trigger resize so charts fill the space
        setTimeout(function() {
            $(window).trigger('resize');
        }, 450);

        showHint();

        $(document).trigger('sit:preference-changed', {
            key: 'zoomedPanel',
            value: true
        });
    }

    function zoomOut() {
        if (!$zoomedPanel) return;

        hideHint();

        var $panel = $zoomedPanel;

        // Remove close button
        $panel.find('.sit-zoom-close').remove();

        // Animate back to original position
        $panel.css({
            top: originalRect.top + 'px',
            left: originalRect.left + 'px',
            width: originalRect.width + 'px',
            height: originalRect.height + 'px'
        });

        $overlay.removeClass('sit-zoom-overlay-active');

        // After animation, restore original styles
        setTimeout(function() {
            $panel.removeClass('sit-zoomed');
            var origStyle = $panel.data('sit-original-style');
            if (origStyle) {
                $panel.attr('style', origStyle);
            } else {
                $panel.removeAttr('style');
            }
            $panel.removeData('sit-original-style');

            // Trigger resize
            $(window).trigger('resize');
        }, 450);

        $zoomedPanel = null;
        originalRect = null;

        $(document).trigger('sit:preference-changed', {
            key: 'zoomedPanel',
            value: false
        });
    }

    // =============================================
    // Setup panels
    // =============================================

    var $panels = $('.dashboard-panel');
    if (!$panels.length) {
        console.log('[SIT] Panel Zoom: No panels found, skipping.');
        return;
    }

    $panels.each(function() {
        var $panel = $(this);
        $panel.addClass('sit-zoomable');

        $panel.on('click.sitZoom', function(e) {
            // Don't zoom if clicking on interactive elements
            if ($(e.target).closest('a, button, input, select, textarea, .sit-zoom-close, .sit-collapse-arrow, .sit-chip-remove').length) {
                return;
            }

            if ($zoomedPanel && $zoomedPanel[0] === $panel[0]) {
                zoomOut();
            } else if (!$zoomedPanel) {
                zoomIn($panel);
            }
        });
    });

    // Overlay click to close
    $overlay.on('click', zoomOut);

    // Escape to close
    $(document).on('keydown.sitZoom', function(e) {
        if (e.key === 'Escape' && $zoomedPanel) {
            zoomOut();
        }
    });

    // External events
    $(document).on('sit:zoom-panel', function(e, data) {
        if (data && data.$panel) {
            zoomIn(data.$panel);
        }
    });
    $(document).on('sit:unzoom-panel', zoomOut);

    console.log('[SIT] Panel Zoom Focus loaded.', $panels.length, 'panels are zoomable.');
});
