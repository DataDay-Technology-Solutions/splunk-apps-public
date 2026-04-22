/*
 * ============================================================================
 * Animation:    button-ripple-effect.js
 * Description:  Material Design-style ripple effect on button clicks. Creates
 *               an expanding circle from the exact click point that fades out.
 *               Works on all .btn elements in the dashboard.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:animations/button-ripple-effect.js">
 *
 * Notes:
 *   - Uses RequireJS/Splunk module pattern
 *   - Ripple is created dynamically and removed after animation
 *   - GPU-accelerated via transform: scale and opacity
 *   - Non-intrusive: does not interfere with button click handlers
 * ============================================================================
 */

require(['jquery'], function($) {

    // Inject ripple styles once
    var styleId = 'sit-ripple-styles';
    if (!document.getElementById(styleId)) {
        var css = [
            '.sit-ripple-container {',
            '    position: relative;',
            '    overflow: hidden;',
            '}',
            '.sit-ripple {',
            '    position: absolute;',
            '    border-radius: 50%;',
            '    background: rgba(255, 255, 255, 0.4);',
            '    transform: scale(0);',
            '    animation: sitRippleExpand 0.6s ease-out forwards;',
            '    pointer-events: none;',
            '    z-index: 9999;',
            '}',
            '@keyframes sitRippleExpand {',
            '    0% {',
            '        transform: scale(0);',
            '        opacity: 0.6;',
            '    }',
            '    100% {',
            '        transform: scale(4);',
            '        opacity: 0;',
            '    }',
            '}',
            /* Reduced motion: no animation, just a brief flash */
            '@media (prefers-reduced-motion: reduce) {',
            '    .sit-ripple {',
            '        animation: none;',
            '        opacity: 0;',
            '    }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Create a ripple effect at the click position within the button.
     * @param {Event} e - The click event
     */
    function createRipple(e) {
        var $btn = $(this);

        // Ensure button has relative positioning for ripple containment
        if ($btn.css('position') === 'static') {
            $btn.css('position', 'relative');
        }
        $btn.css('overflow', 'hidden');

        // Calculate ripple size (diameter = largest dimension of button)
        var btnRect = this.getBoundingClientRect();
        var diameter = Math.max(btnRect.width, btnRect.height);

        // Calculate click position relative to the button
        var x = e.clientX - btnRect.left - (diameter / 2);
        var y = e.clientY - btnRect.top - (diameter / 2);

        // Create ripple element
        var $ripple = $('<span class="sit-ripple"></span>').css({
            width: diameter + 'px',
            height: diameter + 'px',
            left: x + 'px',
            top: y + 'px'
        });

        // Remove any existing ripple from this button, then add new one
        $btn.find('.sit-ripple').remove();
        $btn.append($ripple);

        // Clean up ripple element after animation completes
        setTimeout(function() {
            $ripple.remove();
        }, 650);
    }

    // Bind ripple effect to all buttons (delegated for dynamic buttons)
    $(document).on('click', '.btn', createRipple);

    // Also handle buttons inside input groups and form controls
    $(document).on('click', '.input-group-btn .btn, .splunk-submit-button .btn', createRipple);

});
