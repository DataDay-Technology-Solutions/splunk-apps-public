/*
 * ============================================================================
 * KPI Animated Counter Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Animates single-value KPI numbers with a smooth counting-up effect.
 *   Numbers roll from 0 to their actual value on dashboard load with
 *   easing and proper number formatting (commas, decimals, percentages).
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/kpi-animated-counter.js">
 *
 *   The widget automatically enhances all single-value panels.
 *
 *   Optional panel classes (via <panel classNames="...">):
 *     - counter-fast       : Fast animation (0.8s)
 *     - counter-slow       : Slow animation (4s)
 *     - counter-bounce     : Overshoot/bounce easing
 *     - counter-spring     : Spring-like elastic easing
 *     - no-counter         : Disable for specific panels
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        defaultDuration: 2000,      // ms
        fastDuration: 800,
        slowDuration: 4000,
        fps: 60,
        pollInterval: 300,
        maxPollAttempts: 100,
        decimalPlaces: null         // null = auto-detect
    };

    // -------------------------------------------------------------------------
    // Easing Functions
    // -------------------------------------------------------------------------
    var EASINGS = {
        // Default: ease-out cubic
        easeOutCubic: function(t) {
            return 1 - Math.pow(1 - t, 3);
        },
        // Bounce: slight overshoot then settle
        easeOutBounce: function(t) {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                t -= 1.5 / 2.75;
                return 7.5625 * t * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                t -= 2.25 / 2.75;
                return 7.5625 * t * t + 0.9375;
            } else {
                t -= 2.625 / 2.75;
                return 7.5625 * t * t + 0.984375;
            }
        },
        // Spring: elastic feel
        easeOutElastic: function(t) {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
        }
    };

    // -------------------------------------------------------------------------
    // Number Parsing and Formatting
    // -------------------------------------------------------------------------

    /**
     * Parse a formatted number string into its numeric components
     */
    function parseFormattedNumber(text) {
        if (!text || typeof text !== 'string') return null;

        text = text.trim();

        // Detect prefix/suffix (%, $, etc.)
        var prefix = '';
        var suffix = '';
        var numStr = text;

        // Extract leading non-numeric chars (except minus/dot)
        var prefixMatch = numStr.match(/^([^0-9\-\.]+)/);
        if (prefixMatch) {
            prefix = prefixMatch[1];
            numStr = numStr.substring(prefix.length);
        }

        // Extract trailing non-numeric chars
        var suffixMatch = numStr.match(/([^0-9\.\,]+)$/);
        if (suffixMatch) {
            suffix = suffixMatch[1];
            numStr = numStr.substring(0, numStr.length - suffix.length);
        }

        // Check for percentage as suffix
        if (suffix.indexOf('%') >= 0 || text.indexOf('%') >= 0) {
            suffix = suffix || '%';
            numStr = numStr.replace(/%/g, '');
        }

        // Detect if number uses commas
        var hasCommas = numStr.indexOf(',') >= 0;

        // Detect decimal places
        var decimalMatch = numStr.match(/\.(\d+)$/);
        var decimals = decimalMatch ? decimalMatch[1].length : 0;

        // Parse to float
        var cleanStr = numStr.replace(/,/g, '');
        var value = parseFloat(cleanStr);

        if (isNaN(value)) return null;

        return {
            value: value,
            decimals: decimals,
            hasCommas: hasCommas,
            prefix: prefix,
            suffix: suffix,
            originalText: text
        };
    }

    /**
     * Format a number to match the original formatting
     */
    function formatNumber(value, parsed) {
        var str = value.toFixed(parsed.decimals);

        // Add commas if original had them
        if (parsed.hasCommas) {
            var parts = str.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            str = parts.join('.');
        }

        return parsed.prefix + str + parsed.suffix;
    }

    // -------------------------------------------------------------------------
    // Animation Engine
    // -------------------------------------------------------------------------
    function animateCounter($element, parsed, duration, easingFn) {
        var startValue = 0;
        var endValue = parsed.value;
        var startTime = null;

        // Set initial display to 0
        $element.text(formatNumber(0, parsed));

        function step(timestamp) {
            if (!startTime) startTime = timestamp;

            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = easingFn(progress);
            var currentValue = startValue + (endValue - startValue) * easedProgress;

            $element.text(formatNumber(currentValue, parsed));

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Ensure final value is exact
                $element.text(parsed.originalText);
            }
        }

        requestAnimationFrame(step);
    }

    // -------------------------------------------------------------------------
    // Process Single-Value Elements
    // -------------------------------------------------------------------------
    function processPanels() {
        var $resultNumbers = $('.single-value .single-result .result-number');

        $resultNumbers.each(function() {
            var $el = $(this);

            // Skip if already animated
            if ($el.data('counter-animated')) return;

            var text = $el.text();
            if (!text || text.trim() === '') return;

            var parsed = parseFormattedNumber(text);
            if (!parsed) return;

            // Determine panel options
            var $panel = $el.closest('.dashboard-panel');

            // Skip if disabled
            if ($panel.hasClass('no-counter')) return;

            // Duration
            var duration = CONFIG.defaultDuration;
            if ($panel.hasClass('counter-fast')) duration = CONFIG.fastDuration;
            if ($panel.hasClass('counter-slow')) duration = CONFIG.slowDuration;

            // Easing
            var easingFn = EASINGS.easeOutCubic;
            if ($panel.hasClass('counter-bounce')) easingFn = EASINGS.easeOutBounce;
            if ($panel.hasClass('counter-spring')) easingFn = EASINGS.easeOutElastic;

            // Mark as animated and run
            $el.data('counter-animated', true);
            animateCounter($el, parsed, duration, easingFn);
        });
    }

    // -------------------------------------------------------------------------
    // Intersection Observer for Viewport Triggering
    // -------------------------------------------------------------------------
    function setupViewportTrigger() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: animate immediately
            processPanels();
            return;
        }

        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var $el = $(entry.target);
                    var $resultNumber = $el.find('.result-number');

                    if ($resultNumber.length && !$resultNumber.data('counter-animated')) {
                        var text = $resultNumber.text();
                        var parsed = parseFormattedNumber(text);
                        if (!parsed) return;

                        var $panel = $el.closest('.dashboard-panel');
                        if ($panel.hasClass('no-counter')) return;

                        var duration = CONFIG.defaultDuration;
                        if ($panel.hasClass('counter-fast')) duration = CONFIG.fastDuration;
                        if ($panel.hasClass('counter-slow')) duration = CONFIG.slowDuration;

                        var easingFn = EASINGS.easeOutCubic;
                        if ($panel.hasClass('counter-bounce')) easingFn = EASINGS.easeOutBounce;
                        if ($panel.hasClass('counter-spring')) easingFn = EASINGS.easeOutElastic;

                        $resultNumber.data('counter-animated', true);
                        animateCounter($resultNumber, parsed, duration, easingFn);
                    }

                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        // Observe all single-value containers
        document.querySelectorAll('.single-value').forEach(function(el) {
            io.observe(el);
        });
    }

    // -------------------------------------------------------------------------
    // MutationObserver for Dynamically Loaded Values
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var shouldProcess = false;

        mutations.forEach(function(mutation) {
            if (mutation.type === 'characterData') {
                shouldProcess = true;
            }
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (node.nodeType === 1 && (
                        node.classList.contains('result-number') ||
                        node.querySelector && node.querySelector('.result-number')
                    )) {
                        shouldProcess = true;
                        break;
                    }
                }
            }
        });

        if (shouldProcess) {
            // Small delay to let Splunk finish rendering
            setTimeout(processPanels, 100);
        }
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // -------------------------------------------------------------------------
    // Initial Load with Polling
    // -------------------------------------------------------------------------
    var attempts = 0;
    var pollTimer = setInterval(function() {
        attempts++;
        var $results = $('.single-value .single-result .result-number');
        var hasContent = false;

        $results.each(function() {
            if ($(this).text().trim()) {
                hasContent = true;
                return false;
            }
        });

        if (hasContent || attempts >= CONFIG.maxPollAttempts) {
            clearInterval(pollTimer);
            processPanels();
            setupViewportTrigger();
        }
    }, CONFIG.pollInterval);
});
