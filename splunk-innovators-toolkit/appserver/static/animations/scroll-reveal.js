/*
 * ============================================================================
 * Animation:    scroll-reveal.js
 * Description:  Elements animate in as the user scrolls down the dashboard.
 *               Uses IntersectionObserver to trigger fade-in and slide-up
 *               when panels enter the viewport. Panels above the fold
 *               animate immediately on load.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:animations/scroll-reveal.js">
 *
 * Notes:
 *   - Uses IntersectionObserver API for efficient scroll detection
 *   - Falls back to showing all elements if IntersectionObserver is unavailable
 *   - GPU-accelerated via transform and opacity
 *   - Each element animates only once (observer disconnects after reveal)
 * ============================================================================
 */

require(['jquery'], function($) {

    // Inject scroll-reveal styles
    var styleId = 'sit-scroll-reveal-styles';
    if (!document.getElementById(styleId)) {
        var css = [
            /* Hidden state before reveal */
            '.sit-scroll-hidden {',
            '    opacity: 0;',
            '    transform: translateY(25px);',
            '    transition: opacity 0.6s ease-out, transform 0.6s ease-out;',
            '}',
            /* Revealed state */
            '.sit-scroll-visible {',
            '    opacity: 1;',
            '    transform: translateY(0);',
            '}',
            /* Stagger delays for panels in the same row */
            '.dashboard-row .sit-scroll-visible:nth-child(1) { transition-delay: 0s; }',
            '.dashboard-row .sit-scroll-visible:nth-child(2) { transition-delay: 0.1s; }',
            '.dashboard-row .sit-scroll-visible:nth-child(3) { transition-delay: 0.2s; }',
            '.dashboard-row .sit-scroll-visible:nth-child(4) { transition-delay: 0.3s; }',
            /* Reduced motion */
            '@media (prefers-reduced-motion: reduce) {',
            '    .sit-scroll-hidden {',
            '        opacity: 1;',
            '        transform: none;',
            '        transition: none;',
            '    }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Initialize scroll-reveal on all dashboard panels.
     */
    function initScrollReveal() {
        var panels = document.querySelectorAll('.dashboard-panel');

        if (!panels.length) {
            return;
        }

        // Check for reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return; // Don't apply hidden state; panels stay visible
        }

        // Check for IntersectionObserver support
        if (!('IntersectionObserver' in window)) {
            // Fallback: just show everything
            return;
        }

        // Set all panels to hidden state
        panels.forEach(function(panel) {
            panel.classList.add('sit-scroll-hidden');
        });

        // Create observer
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    // Reveal the panel
                    entry.target.classList.add('sit-scroll-visible');
                    // Stop observing once revealed (animate only once)
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,               // Use viewport as root
            rootMargin: '0px 0px -60px 0px',  // Trigger slightly before fully in view
            threshold: 0.1            // 10% visible triggers the animation
        });

        // Observe each panel
        panels.forEach(function(panel) {
            observer.observe(panel);
        });

        // Also observe dashboard rows for row-level reveal
        var rows = document.querySelectorAll('.dashboard-row');
        rows.forEach(function(row) {
            row.classList.add('sit-scroll-hidden');
            observer.observe(row);
        });
    }

    // Small delay to ensure Splunk has finished rendering panels
    setTimeout(initScrollReveal, 300);

});
