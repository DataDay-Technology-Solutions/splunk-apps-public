/*
 * ============================================================================
 * Animation:    number-morph.js
 * Description:  Single value numbers morph/count up from 0 to their actual
 *               value on load. Smooth easing animation with support for
 *               decimals, percentages, and formatted numbers.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:animations/number-morph.js">
 *
 * Notes:
 *   - Targets .single-value elements within dashboard panels
 *   - Parses numeric values from formatted strings (handles commas, %, $, etc.)
 *   - Uses requestAnimationFrame for smooth 60fps animation
 *   - Easing function provides natural deceleration (ease-out cubic)
 *   - Observes DOM changes to catch dynamically loaded single values
 * ============================================================================
 */

require(['jquery'], function($) {

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Track which elements have already been animated
    var animatedElements = new WeakSet();

    /**
     * Ease-out cubic function for natural deceleration.
     * @param {number} t - Progress from 0 to 1
     * @returns {number} Eased value from 0 to 1
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Extract numeric value and formatting from a display string.
     * @param {string} text - The formatted display text (e.g., "$1,234.56", "89%")
     * @returns {Object} { value: number, prefix: string, suffix: string, decimals: number }
     */
    function parseDisplayValue(text) {
        if (!text || typeof text !== 'string') {
            return null;
        }

        text = text.trim();

        // Extract prefix (non-numeric leading characters like $, etc.)
        var prefixMatch = text.match(/^([^0-9\-]*)/);
        var prefix = prefixMatch ? prefixMatch[1] : '';

        // Extract suffix (non-numeric trailing characters like %, etc.)
        var suffixMatch = text.match(/([^0-9,.\-]*)$/);
        var suffix = suffixMatch ? suffixMatch[1] : '';

        // Extract the numeric portion (strip commas, keep decimals and negatives)
        var numericStr = text.replace(prefix, '').replace(suffix, '').replace(/,/g, '');
        var value = parseFloat(numericStr);

        if (isNaN(value)) {
            return null;
        }

        // Determine decimal places
        var decimalIndex = numericStr.indexOf('.');
        var decimals = decimalIndex >= 0 ? numericStr.length - decimalIndex - 1 : 0;

        // Check if original had comma formatting
        var hasCommas = text.indexOf(',') !== -1;

        return {
            value: value,
            prefix: prefix,
            suffix: suffix,
            decimals: decimals,
            hasCommas: hasCommas
        };
    }

    /**
     * Format a number with commas and decimal places.
     * @param {number} num - The number to format
     * @param {number} decimals - Number of decimal places
     * @param {boolean} useCommas - Whether to add comma separators
     * @returns {string} Formatted number string
     */
    function formatNumber(num, decimals, useCommas) {
        var fixed = num.toFixed(decimals);
        if (useCommas) {
            var parts = fixed.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
        return fixed;
    }

    /**
     * Animate a single value element from 0 to its target value.
     * @param {HTMLElement} el - The element containing the numeric value
     * @param {number} duration - Animation duration in ms
     */
    function animateValue(el, duration) {
        if (animatedElements.has(el)) {
            return;
        }

        var $el = $(el);
        var originalText = $el.text();
        var parsed = parseDisplayValue(originalText);

        if (!parsed || parsed.value === 0) {
            return; // Nothing to animate
        }

        animatedElements.add(el);

        var targetValue = parsed.value;
        var startTime = null;

        // Set initial display to 0
        $el.text(parsed.prefix + formatNumber(0, parsed.decimals, parsed.hasCommas) + parsed.suffix);

        function step(timestamp) {
            if (!startTime) {
                startTime = timestamp;
            }

            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = easeOutCubic(progress);

            var currentValue = easedProgress * targetValue;
            $el.text(parsed.prefix + formatNumber(currentValue, parsed.decimals, parsed.hasCommas) + parsed.suffix);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Ensure we end with the exact original text
                $el.text(originalText);
            }
        }

        requestAnimationFrame(step);
    }

    /**
     * Find and animate all single-value numeric elements.
     */
    function animateSingleValues() {
        // Splunk renders single values in various nested selectors
        var selectors = [
            '.single-value .single-result .single-value-result',
            '.single-value .single-result',
            '.single-value .single-value-number'
        ];

        selectors.forEach(function(selector) {
            $(selector).each(function() {
                var text = $(this).text().trim();
                if (text && parseDisplayValue(text)) {
                    animateValue(this, 1200);
                }
            });
        });
    }

    // Initial run after Splunk renders
    setTimeout(animateSingleValues, 800);

    // MutationObserver to catch dynamically loaded single values
    if ('MutationObserver' in window) {
        var observer = new MutationObserver(function(mutations) {
            var shouldCheck = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
                    shouldCheck = true;
                }
            });
            if (shouldCheck) {
                // Debounce to avoid excessive calls
                clearTimeout(observer._timeout);
                observer._timeout = setTimeout(animateSingleValues, 200);
            }
        });

        // Observe the dashboard body for changes
        var dashboardBody = document.querySelector('.dashboard-body');
        if (dashboardBody) {
            observer.observe(dashboardBody, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    // Re-check periodically for slow-loading searches (stop after 30s)
    var checkCount = 0;
    var maxChecks = 10;
    var recheckInterval = setInterval(function() {
        animateSingleValues();
        checkCount++;
        if (checkCount >= maxChecks) {
            clearInterval(recheckInterval);
        }
    }, 3000);

});
