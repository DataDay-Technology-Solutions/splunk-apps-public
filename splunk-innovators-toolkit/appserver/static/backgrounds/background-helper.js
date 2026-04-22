/**
 * Splunk Innovators Toolkit - Background Helper
 * ================================================
 * Fixes SVG inline fill colors for readability when using CSS-only backgrounds.
 * Splunk 10 renders single-value panels as SVG with inline styles that can't
 * be overridden by CSS alone. This script fixes those inline fills.
 *
 * Usage (include alongside any CSS background):
 *   <dashboard version="1.1"
 *     stylesheet="splunk-innovators-toolkit:backgrounds/aurora-borealis.css"
 *     script="splunk-innovators-toolkit:backgrounds/background-helper.js">
 */

require(['jquery'], function($) {
    'use strict';

    function fixSVGFills() {
        // Fix single-value number text to white
        document.querySelectorAll('.single-value text.single-result').forEach(function(el) {
            el.style.fill = '#ffffff';
        });
        // Fix under-label text to light gray
        document.querySelectorAll('.single-value text.under-label').forEach(function(el) {
            el.style.fill = 'rgba(255,255,255,0.6)';
        });
    }

    // Run immediately and on intervals to catch async renders
    fixSVGFills();
    setTimeout(fixSVGFills, 1000);
    setTimeout(fixSVGFills, 3000);
    setTimeout(fixSVGFills, 5000);

    // Watch for DOM changes (new panels loading)
    var observer = new MutationObserver(function() { fixSVGFills(); });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('%c SIT Background Helper loaded ', 'background: #333; color: #0f0; border-radius: 3px;');
});
