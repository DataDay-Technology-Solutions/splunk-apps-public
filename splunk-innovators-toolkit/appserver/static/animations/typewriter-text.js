/*
 * ============================================================================
 * Animation:    typewriter-text.js
 * Description:  Dashboard title and panel titles get a typewriter effect on
 *               load. Text appears character by character with a blinking
 *               cursor that disappears after typing completes.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:animations/typewriter-text.js">
 *
 * Notes:
 *   - Targets .dashboard-header h2 (dashboard title) and .panel-head h3 (panel titles)
 *   - Original text is preserved; only the visual display is animated
 *   - Blinking cursor auto-removes after typing completes
 *   - Panel titles are staggered so they type sequentially
 *   - Respects prefers-reduced-motion
 * ============================================================================
 */

require(['jquery'], function($) {

    // Inject typewriter styles
    var styleId = 'sit-typewriter-styles';
    if (!document.getElementById(styleId)) {
        var css = [
            '.sit-typewriter-cursor::after {',
            '    content: "|";',
            '    display: inline-block;',
            '    color: #333;',
            '    animation: sitCursorBlink 0.7s step-end infinite;',
            '    margin-left: 1px;',
            '    font-weight: 300;',
            '}',
            '@keyframes sitCursorBlink {',
            '    0%, 100% { opacity: 1; }',
            '    50% { opacity: 0; }',
            '}',
            '.sit-typewriter-done::after {',
            '    content: none;',
            '}',
            '@media (prefers-reduced-motion: reduce) {',
            '    .sit-typewriter-cursor::after {',
            '        animation: none;',
            '        content: none;',
            '    }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    /**
     * Animate a typewriter effect on a single element.
     * @param {HTMLElement} el - The element whose text to animate
     * @param {number} delay - Delay in ms before starting
     * @param {number} speed - Typing speed in ms per character
     */
    function typewriterEffect(el, delay, speed) {
        var $el = $(el);
        var fullText = $el.text().trim();

        if (!fullText || fullText.length === 0) {
            return;
        }

        // Store original text and clear the element
        $el.text('');
        $el.addClass('sit-typewriter-cursor');

        var charIndex = 0;

        setTimeout(function() {
            var interval = setInterval(function() {
                if (charIndex < fullText.length) {
                    $el.text(fullText.substring(0, charIndex + 1));
                    charIndex++;
                } else {
                    clearInterval(interval);
                    // Remove cursor after a brief pause
                    setTimeout(function() {
                        $el.removeClass('sit-typewriter-cursor');
                        $el.addClass('sit-typewriter-done');
                    }, 800);
                }
            }, speed);
        }, delay);
    }

    /**
     * Initialize typewriter effects on dashboard and panel titles.
     */
    function initTypewriter() {
        // Dashboard main title
        var $dashTitle = $('.dashboard-header h2').first();
        if ($dashTitle.length) {
            typewriterEffect($dashTitle[0], 100, 50);
        }

        // Panel titles -- stagger them
        var $panelTitles = $('.panel-head h3');
        var baseDelay = $dashTitle.length ? ($dashTitle.text().length * 50) + 400 : 200;

        $panelTitles.each(function(index) {
            var staggerDelay = baseDelay + (index * 600);
            typewriterEffect(this, staggerDelay, 35);
        });
    }

    // Wait for Splunk to finish rendering
    setTimeout(initTypewriter, 500);

});
