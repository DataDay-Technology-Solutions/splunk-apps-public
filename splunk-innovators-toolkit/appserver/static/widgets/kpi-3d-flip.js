/*
 * ============================================================================
 * KPI 3D Flip Card Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Transforms single-value panels into 3D flip cards. The front shows the
 *   KPI number; the back shows the panel description or trend info on hover.
 *   Uses CSS 3D transforms with perspective for a realistic flip effect.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/kpi-3d-flip.js">
 *
 *   The widget automatically enhances all single-value panels.
 *   The back of the card displays the panel's title and description.
 *
 *   To customize the back-card content, add a data attribute to the panel:
 *     <panel classNames="flip-card" data-flip-text="Custom back text">
 *
 *   Optional panel classes:
 *     - flip-card         : Explicit opt-in (if you only want some panels)
 *     - flip-vertical     : Flip vertically instead of horizontally
 *     - flip-on-click     : Flip on click instead of hover
 *     - no-flip           : Disable flip for specific panels
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        flipDuration: '0.7s',
        perspective: '1000px',
        backBgColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        backTextColor: 'rgba(255, 255, 255, 0.9)',
        frontBgColor: 'inherit',
        pollInterval: 500,
        maxPollAttempts: 60
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.flip-card-wrapper {',
        '    perspective: ' + CONFIG.perspective + ';',
        '    position: relative;',
        '    width: 100%;',
        '    min-height: 120px;',
        '}',
        '',
        '.flip-card-inner {',
        '    position: relative;',
        '    width: 100%;',
        '    height: 100%;',
        '    min-height: 120px;',
        '    transition: transform ' + CONFIG.flipDuration + ' cubic-bezier(0.4, 0.0, 0.2, 1);',
        '    transform-style: preserve-3d;',
        '}',
        '',
        '/* Horizontal flip on hover */',
        '.flip-card-wrapper:hover .flip-card-inner,',
        '.flip-card-wrapper.flipped .flip-card-inner {',
        '    transform: rotateY(180deg);',
        '}',
        '',
        '/* Vertical flip variant */',
        '.flip-vertical .flip-card-wrapper:hover .flip-card-inner,',
        '.flip-vertical .flip-card-wrapper.flipped .flip-card-inner {',
        '    transform: rotateX(180deg);',
        '}',
        '',
        '/* Click-to-flip: disable hover flip */',
        '.flip-on-click .flip-card-wrapper:hover .flip-card-inner {',
        '    transform: none;',
        '}',
        '.flip-on-click .flip-card-wrapper.flipped .flip-card-inner {',
        '    transform: rotateY(180deg);',
        '}',
        '',
        '.flip-card-front,',
        '.flip-card-back {',
        '    position: absolute;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    -webkit-backface-visibility: hidden;',
        '    backface-visibility: hidden;',
        '    border-radius: 12px;',
        '    overflow: hidden;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '}',
        '',
        '.flip-card-front {',
        '    z-index: 2;',
        '}',
        '',
        '.flip-card-back {',
        '    transform: rotateY(180deg);',
        '    background: ' + CONFIG.backBgColor + ';',
        '    color: ' + CONFIG.backTextColor + ';',
        '    padding: 20px;',
        '    flex-direction: column;',
        '    text-align: center;',
        '    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.2);',
        '}',
        '',
        '.flip-vertical .flip-card-back {',
        '    transform: rotateX(180deg);',
        '}',
        '',
        '.flip-card-back-title {',
        '    font-size: 0.85em;',
        '    font-weight: 700;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.1em;',
        '    color: rgba(255, 255, 255, 0.5);',
        '    margin-bottom: 12px;',
        '}',
        '',
        '.flip-card-back-value {',
        '    font-size: 1.4em;',
        '    font-weight: 600;',
        '    color: rgba(255, 255, 255, 0.95);',
        '    margin-bottom: 8px;',
        '}',
        '',
        '.flip-card-back-description {',
        '    font-size: 0.85em;',
        '    line-height: 1.5;',
        '    color: rgba(255, 255, 255, 0.7);',
        '    max-width: 90%;',
        '}',
        '',
        '.flip-card-back-icon {',
        '    font-size: 2em;',
        '    margin-bottom: 10px;',
        '    opacity: 0.4;',
        '}',
        '',
        '/* Subtle shadow for depth */',
        '.flip-card-wrapper {',
        '    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));',
        '    transition: filter 0.3s ease;',
        '}',
        '.flip-card-wrapper:hover {',
        '    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.25));',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Transform Single-Value Panels into Flip Cards
    // -------------------------------------------------------------------------
    function createFlipCards() {
        var panels = $('.dashboard-panel').has('.single-value');

        panels.each(function() {
            var $panel = $(this);

            // Skip if already processed or explicitly disabled
            if ($panel.data('flip-initialized') || $panel.hasClass('no-flip')) {
                return;
            }

            var $singleValue = $panel.find('.single-value').first();
            if (!$singleValue.length) return;

            // Get panel info for the back of the card
            var panelTitle = $panel.find('.panel-head h3').text() || 'Details';
            var customText = $panel.attr('data-flip-text') || '';
            var currentValue = $singleValue.find('.result-number').text() || '';
            var currentLabel = $singleValue.find('.under-label').text() || '';

            // Create flip card structure
            var $wrapper = $('<div class="flip-card-wrapper"></div>');
            var $inner = $('<div class="flip-card-inner"></div>');
            var $front = $('<div class="flip-card-front"></div>');
            var $back = $('<div class="flip-card-back"></div>');

            // Build back content
            var backHTML = '<div class="flip-card-back-icon">&#x1f4ca;</div>';
            backHTML += '<div class="flip-card-back-title">' + escapeHtml(panelTitle) + '</div>';

            if (customText) {
                backHTML += '<div class="flip-card-back-description">' + escapeHtml(customText) + '</div>';
            } else {
                if (currentValue) {
                    backHTML += '<div class="flip-card-back-value">' + escapeHtml(currentValue) + '</div>';
                }
                if (currentLabel) {
                    backHTML += '<div class="flip-card-back-description">' + escapeHtml(currentLabel) + '</div>';
                }
                if (!currentValue && !currentLabel) {
                    backHTML += '<div class="flip-card-back-description">Hover to flip back</div>';
                }
            }

            $back.html(backHTML);

            // Move original content to front
            var $origContent = $singleValue.children().detach();
            $front.append($origContent);

            // Assemble and insert
            $inner.append($front).append($back);
            $wrapper.append($inner);
            $singleValue.empty().append($wrapper);

            // Set height to match
            var frontHeight = $front.outerHeight();
            var minH = Math.max(frontHeight || 120, 120);
            $wrapper.css('min-height', minH + 'px');
            $inner.css('min-height', minH + 'px');

            // Handle click-to-flip
            if ($panel.hasClass('flip-on-click')) {
                $wrapper.on('click', function() {
                    $(this).toggleClass('flipped');
                });
            }

            $panel.data('flip-initialized', true);
        });
    }

    // -------------------------------------------------------------------------
    // Update back content when values change
    // -------------------------------------------------------------------------
    function updateFlipCardBacks() {
        $('.flip-card-wrapper').each(function() {
            var $wrapper = $(this);
            var $panel = $wrapper.closest('.dashboard-panel');
            var $front = $wrapper.find('.flip-card-front');

            // Only update if no custom text
            if ($panel.attr('data-flip-text')) return;

            var value = $front.find('.result-number').text();
            var label = $front.find('.under-label').text();
            var $backValue = $wrapper.find('.flip-card-back-value');
            var $backDesc = $wrapper.find('.flip-card-back-description');

            if (value && $backValue.length) {
                $backValue.text(value);
            }
            if (label && $backDesc.length) {
                $backDesc.text(label);
            }
        });
    }

    // -------------------------------------------------------------------------
    // HTML Escape Utility
    // -------------------------------------------------------------------------
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // -------------------------------------------------------------------------
    // Initialize with MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasNewContent = mutations.some(function(m) {
            return m.addedNodes.length > 0 || m.type === 'characterData';
        });
        if (hasNewContent) {
            createFlipCards();
            updateFlipCardBacks();
        }
    });

    // Observe the dashboard body for changes
    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Initial run with polling for async Splunk rendering
    var attempts = 0;
    var pollTimer = setInterval(function() {
        attempts++;
        var panels = $('.dashboard-panel .single-value .single-result .result-number');
        if (panels.length > 0 || attempts >= CONFIG.maxPollAttempts) {
            clearInterval(pollTimer);
            createFlipCards();
        }
    }, CONFIG.pollInterval);
});
