/*
 * ============================================================================
 * Alert Toast Notifications Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Slide-in toast notifications triggered by search results or dashboard
 *   events. When a search returns results matching criteria, a toast
 *   notification slides in from a corner of the screen. Auto-dismisses
 *   after a configurable duration.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/alert-toast-notifications.js">
 *
 *   Toast notifications are triggered when:
 *   1. A panel with class "toast-trigger" gets a search result
 *   2. Manually via JavaScript: window.splunkToast.show({...})
 *
 *   Panel classes:
 *     - toast-trigger          : Triggers toast when search has results
 *     - toast-trigger-error    : Red/error styled toast
 *     - toast-trigger-warning  : Yellow/warning styled toast
 *     - toast-trigger-success  : Green/success styled toast
 *     - toast-trigger-info     : Blue/info styled toast
 *
 *   Manual API:
 *     window.splunkToast.show({
 *         title: 'Alert Title',
 *         message: 'Something happened',
 *         type: 'error',        // error, warning, success, info
 *         duration: 5000,       // ms, 0 = sticky
 *         position: 'top-right' // top-right, top-left, bottom-right, bottom-left
 *     });
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        defaultDuration: 6000,
        defaultPosition: 'top-right',
        maxVisible: 5,
        animDuration: 400,
        stackGap: 10,
        pollInterval: 2000,
        types: {
            info:    { icon: '\u2139\uFE0F', bg: '#1e3a5f', border: '#3b82f6', color: '#93c5fd' },
            success: { icon: '\u2705',       bg: '#14532d', border: '#22c55e', color: '#86efac' },
            warning: { icon: '\u26A0\uFE0F', bg: '#422006', border: '#f59e0b', color: '#fcd34d' },
            error:   { icon: '\u274C',       bg: '#450a0a', border: '#ef4444', color: '#fca5a5' }
        }
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.toast-container {',
        '    position: fixed;',
        '    z-index: 99999;',
        '    display: flex;',
        '    flex-direction: column;',
        '    gap: ' + CONFIG.stackGap + 'px;',
        '    pointer-events: none;',
        '    max-width: 380px;',
        '    width: 100%;',
        '}',
        '.toast-container.top-right    { top: 20px; right: 20px; }',
        '.toast-container.top-left     { top: 20px; left: 20px; }',
        '.toast-container.bottom-right { bottom: 20px; right: 20px; }',
        '.toast-container.bottom-left  { bottom: 20px; left: 20px; }',
        '',
        '.toast-notification {',
        '    pointer-events: auto;',
        '    display: flex;',
        '    align-items: flex-start;',
        '    gap: 12px;',
        '    padding: 14px 16px;',
        '    border-radius: 10px;',
        '    border-left: 4px solid;',
        '    backdrop-filter: blur(12px);',
        '    -webkit-backdrop-filter: blur(12px);',
        '    box-shadow:',
        '        0 8px 32px rgba(0, 0, 0, 0.3),',
        '        0 2px 8px rgba(0, 0, 0, 0.15);',
        '    transform: translateX(120%);',
        '    opacity: 0;',
        '    transition: transform ' + CONFIG.animDuration + 'ms cubic-bezier(0.34, 1.56, 0.64, 1),',
        '               opacity ' + CONFIG.animDuration + 'ms ease;',
        '    cursor: pointer;',
        '    max-width: 100%;',
        '}',
        '.toast-container.top-left .toast-notification,',
        '.toast-container.bottom-left .toast-notification {',
        '    transform: translateX(-120%);',
        '}',
        '.toast-notification.visible {',
        '    transform: translateX(0);',
        '    opacity: 1;',
        '}',
        '.toast-notification.dismissing {',
        '    transform: translateX(120%);',
        '    opacity: 0;',
        '}',
        '.toast-container.top-left .toast-notification.dismissing,',
        '.toast-container.bottom-left .toast-notification.dismissing {',
        '    transform: translateX(-120%);',
        '}',
        '',
        '.toast-icon {',
        '    font-size: 1.3em;',
        '    flex-shrink: 0;',
        '    margin-top: 1px;',
        '}',
        '.toast-content {',
        '    flex: 1;',
        '    min-width: 0;',
        '}',
        '.toast-title {',
        '    font-weight: 600;',
        '    font-size: 0.9em;',
        '    margin-bottom: 4px;',
        '    line-height: 1.3;',
        '}',
        '.toast-message {',
        '    font-size: 0.8em;',
        '    opacity: 0.8;',
        '    line-height: 1.4;',
        '    word-wrap: break-word;',
        '}',
        '.toast-close {',
        '    flex-shrink: 0;',
        '    background: none;',
        '    border: none;',
        '    color: rgba(255,255,255,0.4);',
        '    font-size: 1.1em;',
        '    cursor: pointer;',
        '    padding: 0;',
        '    line-height: 1;',
        '    transition: color 0.2s;',
        '}',
        '.toast-close:hover {',
        '    color: rgba(255,255,255,0.8);',
        '}',
        '',
        '/* Progress bar for auto-dismiss */',
        '.toast-progress {',
        '    position: absolute;',
        '    bottom: 0;',
        '    left: 4px;',
        '    right: 0;',
        '    height: 2px;',
        '    border-radius: 0 0 10px 0;',
        '    transform-origin: left;',
        '    transition: transform linear;',
        '}',
        '',
        '.toast-notification {',
        '    position: relative;',
        '    overflow: hidden;',
        '}',
        '',
        '/* Hover pauses progress */',
        '.toast-notification:hover .toast-progress {',
        '    animation-play-state: paused !important;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Toast Container Management
    // -------------------------------------------------------------------------
    var containers = {};

    function getContainer(position) {
        if (containers[position]) return containers[position];

        var $container = $('<div class="toast-container ' + position + '"></div>');
        $('body').append($container);
        containers[position] = $container;
        return $container;
    }

    // -------------------------------------------------------------------------
    // Toast Queue
    // -------------------------------------------------------------------------
    var toastQueue = [];

    // -------------------------------------------------------------------------
    // Show Toast
    // -------------------------------------------------------------------------
    function showToast(options) {
        var opts = $.extend({
            title: 'Notification',
            message: '',
            type: 'info',
            duration: CONFIG.defaultDuration,
            position: CONFIG.defaultPosition
        }, options);

        var typeConfig = CONFIG.types[opts.type] || CONFIG.types.info;
        var $container = getContainer(opts.position);

        // Enforce max visible
        var visible = $container.find('.toast-notification.visible');
        if (visible.length >= CONFIG.maxVisible) {
            dismissToast(visible.first());
        }

        // Build toast
        var $toast = $(
            '<div class="toast-notification" style="background: ' + typeConfig.bg + '; border-color: ' + typeConfig.border + '; color: ' + typeConfig.color + ';">' +
            '  <span class="toast-icon">' + typeConfig.icon + '</span>' +
            '  <div class="toast-content">' +
            '    <div class="toast-title">' + escapeHtml(opts.title) + '</div>' +
            (opts.message ? '    <div class="toast-message">' + escapeHtml(opts.message) + '</div>' : '') +
            '  </div>' +
            '  <button class="toast-close" aria-label="Close">&times;</button>' +
            (opts.duration > 0 ? '  <div class="toast-progress" style="background: ' + typeConfig.border + '; transform: scaleX(1); transition-duration: ' + opts.duration + 'ms;"></div>' : '') +
            '</div>'
        );

        // Click to dismiss
        $toast.find('.toast-close').on('click', function(e) {
            e.stopPropagation();
            dismissToast($toast);
        });

        $toast.on('click', function() {
            dismissToast($toast);
        });

        $container.append($toast);

        // Animate in
        requestAnimationFrame(function() {
            $toast.addClass('visible');

            // Start progress bar
            if (opts.duration > 0) {
                var $progress = $toast.find('.toast-progress');
                requestAnimationFrame(function() {
                    $progress.css('transform', 'scaleX(0)');
                });
            }
        });

        // Auto-dismiss
        if (opts.duration > 0) {
            var timer = setTimeout(function() {
                dismissToast($toast);
            }, opts.duration);

            // Pause on hover
            $toast.on('mouseenter', function() {
                clearTimeout(timer);
                $toast.find('.toast-progress').css('transition-duration', '0ms');
            });

            $toast.on('mouseleave', function() {
                var $progress = $toast.find('.toast-progress');
                var currentScale = $progress.css('transform');
                // Resume with remaining time
                var remaining = opts.duration * 0.3; // Rough estimate
                $progress.css({
                    'transition-duration': remaining + 'ms',
                    'transform': 'scaleX(0)'
                });
                timer = setTimeout(function() {
                    dismissToast($toast);
                }, remaining);
            });
        }

        return $toast;
    }

    // -------------------------------------------------------------------------
    // Dismiss Toast
    // -------------------------------------------------------------------------
    function dismissToast($toast) {
        if ($toast.hasClass('dismissing')) return;
        $toast.removeClass('visible').addClass('dismissing');
        setTimeout(function() {
            $toast.remove();
        }, CONFIG.animDuration);
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
    // Watch Panels for Search Results
    // -------------------------------------------------------------------------
    function watchPanels() {
        var triggerPanels = $('.dashboard-panel').filter(function() {
            var cls = this.className || '';
            return cls.indexOf('toast-trigger') >= 0;
        });

        triggerPanels.each(function() {
            var $panel = $(this);
            if ($panel.data('toast-watching')) return;

            var type = 'info';
            if ($panel.hasClass('toast-trigger-error')) type = 'error';
            if ($panel.hasClass('toast-trigger-warning')) type = 'warning';
            if ($panel.hasClass('toast-trigger-success')) type = 'success';

            // Watch for result changes
            var prevText = '';
            var checkInterval = setInterval(function() {
                var $result = $panel.find('.single-result .result-number, td:first');
                var text = $result.text().trim();

                if (text && text !== prevText) {
                    prevText = text;
                    var title = $panel.find('.panel-head h3').text() || 'Alert';
                    showToast({
                        title: title,
                        message: text,
                        type: type
                    });
                }
            }, CONFIG.pollInterval);

            $panel.data('toast-watching', true);
            $panel.data('toast-interval', checkInterval);
        });
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    window.splunkToast = {
        show: showToast,
        dismiss: dismissToast,
        dismissAll: function() {
            $('.toast-notification').each(function() {
                dismissToast($(this));
            });
        }
    };

    // -------------------------------------------------------------------------
    // Demo: Show a welcome toast on load
    // -------------------------------------------------------------------------
    setTimeout(function() {
        // Only show demo if toast-trigger panels exist
        var hasTriggers = $('.toast-trigger, .toast-trigger-error, .toast-trigger-warning, .toast-trigger-success, .toast-trigger-info').length > 0;
        if (hasTriggers) {
            showToast({
                title: 'Toast Notifications Active',
                message: 'Monitoring panels for alert conditions.',
                type: 'info',
                duration: 4000
            });
        }
    }, 2000);

    // -------------------------------------------------------------------------
    // MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) { return m.addedNodes.length > 0; });
        if (hasChanges) watchPanels();
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial watch
    setTimeout(watchPanels, 1000);
});
