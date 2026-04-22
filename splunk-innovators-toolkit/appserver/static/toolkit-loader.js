/**
 * Innovators Toolkit - Master Loader
 * ==========================================
 * This is the master initialization script for the Innovators Toolkit.
 * It provides the global SIT API and handles component initialization.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toolkit-loader.js"
 *              stylesheet="splunk-innovators-toolkit:themes/soc-command-center.css">
 *
 * The loader automatically:
 *   1. Initializes the SIT global namespace
 *   2. Detects which CSS/JS components are loaded
 *   3. Provides utility functions for component interaction
 *   4. Adds the SIT watermark (optional, can be disabled)
 */

require([
    'jquery',
    'underscore',
    
], function($, _) {
    'use strict';

    // ========================================
    // Global Namespace
    // ========================================

    window.SIT = window.SIT || {};

    var TOOLKIT_VERSION = '2.0.0';
    var TOOLKIT_APP = 'splunk-innovators-toolkit';

    // ========================================
    // Component Registry
    // ========================================

    var registry = {
        backgrounds: [],
        themes: [],
        widgets: [],
        toggles: [],
        animations: [],
        visualizations: []
    };

    /**
     * Detect loaded stylesheets from this toolkit
     */
    function detectLoadedCSS() {
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            try {
                var href = sheets[i].href || '';
                if (href.indexOf(TOOLKIT_APP) > -1) {
                    var match = href.match(/static\/(\w+)\/([\w-]+)\.(css|js)/);
                    if (match && registry[match[1]]) {
                        registry[match[1]].push(match[2]);
                    }
                }
            } catch (e) {
                // Cross-origin stylesheet, skip
            }
        }
    }

    /**
     * Detect loaded scripts from this toolkit
     */
    function detectLoadedJS() {
        $('script[src*="' + TOOLKIT_APP + '"]').each(function() {
            var src = $(this).attr('src') || '';
            var match = src.match(/static\/(\w+)\/([\w-]+)\.(css|js)/);
            if (match && registry[match[1]]) {
                registry[match[1]].push(match[2]);
            }
        });
    }

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Wait for a DOM element to appear (handles Splunk's async rendering)
     * @param {string} selector - CSS selector
     * @param {function} callback - Called with the jQuery element when found
     * @param {number} timeout - Max wait time in ms (default: 10000)
     */
    function waitForElement(selector, callback, timeout) {
        timeout = timeout || 10000;
        var startTime = Date.now();

        var check = function() {
            var $el = $(selector);
            if ($el.length > 0) {
                callback($el);
                return;
            }
            if (Date.now() - startTime < timeout) {
                requestAnimationFrame(check);
            }
        };
        check();
    }

    /**
     * Observe DOM changes and call back when matching elements appear
     * @param {string} selector - CSS selector to watch for
     * @param {function} callback - Called with each matching element
     */
    function observeDOM(selector, callback) {
        // Check existing elements first
        $(selector).each(function() {
            callback($(this));
        });

        // Watch for new elements
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    $(mutation.addedNodes).find(selector).addBack(selector).each(function() {
                        callback($(this));
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    /**
     * Get a dashboard token value
     * @param {string} tokenName - Name of the token
     * @returns {*} Token value or undefined
     */
    function getToken(tokenName) {
        var defaultTokens = mvc.Components.get('default');
        if (defaultTokens) {
            return defaultTokens.get(tokenName);
        }
        return undefined;
    }

    /**
     * Set a dashboard token value
     * @param {string} tokenName - Name of the token
     * @param {*} value - Value to set
     */
    function setToken(tokenName, value) {
        var defaultTokens = mvc.Components.get('default');
        var submittedTokens = mvc.Components.get('submitted');
        if (defaultTokens) {
            defaultTokens.set(tokenName, value);
        }
        if (submittedTokens) {
            submittedTokens.set(tokenName, value);
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise}
     */
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (e) {
            console.error('SIT: Copy to clipboard failed', e);
        }
        document.body.removeChild(textarea);
        return Promise.resolve();
    }

    /**
     * Generate a stylesheet reference string for the given components
     * @param {Array} components - Array of {category, name} objects
     * @returns {string} Comma-separated stylesheet references
     */
    function generateStylesheetRef(components) {
        return components
            .filter(function(c) { return c.name.match(/\.css$/) || !c.name.match(/\.js$/); })
            .map(function(c) {
                var name = c.name.replace(/\.css$/, '');
                return TOOLKIT_APP + ':' + c.category + '/' + name + '.css';
            })
            .join(',\n                       ');
    }

    /**
     * Generate a script reference string for the given components
     * @param {Array} components - Array of {category, name} objects
     * @returns {string} Comma-separated script references
     */
    function generateScriptRef(components) {
        return components
            .filter(function(c) { return c.name.match(/\.js$/); })
            .map(function(c) {
                var name = c.name.replace(/\.js$/, '');
                return TOOLKIT_APP + ':' + c.category + '/' + name + '.js';
            })
            .join(',\n              ');
    }

    /**
     * Generate the complete dashboard tag with selected components
     * @param {Array} components - Array of {category, name} objects
     * @returns {string} Complete <dashboard> tag
     */
    function generateDashboardTag(components) {
        var cssRefs = [];
        var jsRefs = [TOOLKIT_APP + ':toolkit-loader.js'];

        components.forEach(function(c) {
            var ext = c.name.match(/\.js$/) ? '.js' : '.css';
            var name = c.name.replace(/\.(css|js)$/, '');
            var ref = TOOLKIT_APP + ':' + c.category + '/' + name + ext;

            if (ext === '.js') {
                jsRefs.push(ref);
            } else {
                cssRefs.push(ref);
            }
        });

        var tag = '<dashboard';
        if (cssRefs.length > 0) {
            tag += '\n  stylesheet="' + cssRefs.join(',\n             ') + '"';
        }
        if (jsRefs.length > 0) {
            tag += '\n  script="' + jsRefs.join(',\n          ') + '"';
        }
        tag += '>';

        return tag;
    }

    // ========================================
    // Toast Notification (lightweight)
    // ========================================

    function showToast(message, type) {
        type = type || 'info';
        var colors = {
            success: '#5CC05C',
            error: '#DC3545',
            warning: '#F7B500',
            info: '#17A2B8'
        };

        var $toast = $('<div>')
            .css({
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                background: '#1a1e21',
                color: '#fff',
                borderRadius: '8px',
                borderLeft: '4px solid ' + (colors[type] || colors.info),
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                zIndex: 10000,
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                opacity: 0,
                transform: 'translateY(-10px)',
                transition: 'all 0.3s ease'
            })
            .text(message)
            .appendTo('body');

        // Animate in
        requestAnimationFrame(function() {
            $toast.css({ opacity: 1, transform: 'translateY(0)' });
        });

        // Animate out after 3s
        setTimeout(function() {
            $toast.css({ opacity: 0, transform: 'translateY(-10px)' });
            setTimeout(function() { $toast.remove(); }, 300);
        }, 3000);
    }

    // ========================================
    // Watermark (optional)
    // ========================================

    function addWatermark() {
        // Only add on non-toolkit dashboards
        if (window.location.pathname.indexOf(TOOLKIT_APP) > -1) {
            return;
        }

        var $watermark = $('<div>')
            .css({
                position: 'fixed',
                bottom: '8px',
                right: '12px',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                zIndex: 1,
                pointerEvents: 'none',
                letterSpacing: '0.5px'
            })
            .html('&#x26A1; Powered by Innovators Toolkit');

        $('body').append($watermark);
    }

    // ========================================
    // Initialize
    // ========================================

    function init() {
        detectLoadedCSS();
        detectLoadedJS();
        addWatermark();

        console.log(
            '%c Innovators Toolkit v' + TOOLKIT_VERSION + ' ',
            'background: #FD1875; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
        );
        console.log('SIT: Loaded components:', registry);
    }

    // ========================================
    // Public API
    // ========================================

    window.SIT = $.extend(window.SIT, {
        version: TOOLKIT_VERSION,
        app: TOOLKIT_APP,
        registry: registry,

        // Utilities
        waitForElement: waitForElement,
        observeDOM: observeDOM,
        getToken: getToken,
        setToken: setToken,
        copyToClipboard: copyToClipboard,
        showToast: showToast,

        // Code generation
        generateDashboardTag: generateDashboardTag,
        generateStylesheetRef: generateStylesheetRef,
        generateScriptRef: generateScriptRef
    });

    init();
});
