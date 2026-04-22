/*
 * ============================================================================
 * Confetti Celebration Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Confetti burst animation triggered when a KPI crosses a threshold.
 *   Colorful confetti particles explode from the KPI panel for a
 *   celebratory effect. Configurable thresholds and colors.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/confetti-celebration.js">
 *
 *   Panel-based trigger:
 *     <panel classNames="confetti-trigger"
 *            data-confetti-threshold="100"
 *            data-confetti-operator="gte">
 *
 *   Operators: gt, gte, lt, lte, eq, neq
 *
 *   Manual API:
 *     window.splunkConfetti.burst(element)   // Burst from specific element
 *     window.splunkConfetti.celebrate()       // Full-screen celebration
 *
 *   Optional panel attributes:
 *     - data-confetti-threshold : Numeric threshold
 *     - data-confetti-operator  : Comparison operator
 *     - data-confetti-count     : Number of particles (default: 80)
 *     - data-confetti-colors    : Comma-separated hex colors
 *     - data-confetti-once      : "true" to only fire once
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var CONFIG = {
        particleCount: 80,
        gravity: 0.65,
        friction: 0.98,
        explosionForce: 12,
        particleLife: 120,  // frames
        colors: [
            '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
            '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3',
            '#1dd1a1', '#c44569', '#f8b500', '#6c5ce7'
        ],
        pollInterval: 2000,
        shapes: ['square', 'circle', 'strip']
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.confetti-canvas {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100vw;',
        '    height: 100vh;',
        '    pointer-events: none;',
        '    z-index: 999999;',
        '}',
        '',
        '/* Panel glow when confetti triggers */',
        '.confetti-triggered {',
        '    animation: confettiGlow 1s ease !important;',
        '}',
        '@keyframes confettiGlow {',
        '    0% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); }',
        '    50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.15); }',
        '    100% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); }',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Canvas Management
    // -------------------------------------------------------------------------
    var canvas = null;
    var ctx = null;
    var particles = [];
    var animFrameId = null;

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
        canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
            canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        });
    }

    // -------------------------------------------------------------------------
    // Particle Class
    // -------------------------------------------------------------------------
    function Particle(x, y, colors) {
        this.x = x;
        this.y = y;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = CONFIG.shapes[Math.floor(Math.random() * CONFIG.shapes.length)];

        var angle = Math.random() * Math.PI * 2;
        var force = CONFIG.explosionForce * (0.5 + Math.random() * 0.5);
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force - Math.random() * 4;

        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 12;
        this.size = 4 + Math.random() * 6;
        this.life = CONFIG.particleLife;
        this.maxLife = CONFIG.particleLife;
        this.opacity = 1;

        // Strip dimensions
        if (this.shape === 'strip') {
            this.width = 3 + Math.random() * 4;
            this.height = 8 + Math.random() * 12;
        }
    }

    Particle.prototype.update = function() {
        this.vy += CONFIG.gravity;
        this.vx *= CONFIG.friction;
        this.vy *= CONFIG.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.life--;
        this.opacity = Math.max(0, this.life / this.maxLife);
    };

    Particle.prototype.draw = function(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'strip':
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                break;
            default: // square
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
        }

        ctx.restore();
    };

    // -------------------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------------------
    function startAnimation() {
        if (animFrameId) return;

        function loop() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            particles = particles.filter(function(p) {
                p.update();
                p.draw(ctx);
                return p.life > 0;
            });

            if (particles.length > 0) {
                animFrameId = requestAnimationFrame(loop);
            } else {
                animFrameId = null;
                // Remove canvas after animation
                if (canvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                    canvas = null;
                    ctx = null;
                }
            }
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------------------
    // Burst from Element
    // -------------------------------------------------------------------------
    function burstFromElement(element, customColors, count) {
        ensureCanvas();

        var rect = element.getBoundingClientRect();
        var originX = rect.left + rect.width / 2;
        var originY = rect.top + rect.height / 2;

        var colors = customColors || CONFIG.colors;
        var numParticles = count || CONFIG.particleCount;

        for (var i = 0; i < numParticles; i++) {
            particles.push(new Particle(originX, originY, colors));
        }

        // Add glow effect to element
        $(element).addClass('confetti-triggered');
        setTimeout(function() {
            $(element).removeClass('confetti-triggered');
        }, 1000);

        startAnimation();
    }

    // -------------------------------------------------------------------------
    // Full Screen Celebration
    // -------------------------------------------------------------------------
    function celebrate(customColors, count) {
        ensureCanvas();

        var colors = customColors || CONFIG.colors;
        var numParticles = count || CONFIG.particleCount * 3;
        var w = window.innerWidth;
        var h = window.innerHeight;

        // Multiple burst points
        var points = [
            { x: w * 0.2, y: h * 0.3 },
            { x: w * 0.5, y: h * 0.2 },
            { x: w * 0.8, y: h * 0.3 },
            { x: w * 0.35, y: h * 0.5 },
            { x: w * 0.65, y: h * 0.5 }
        ];

        var particlesPerPoint = Math.floor(numParticles / points.length);

        points.forEach(function(pt, idx) {
            setTimeout(function() {
                for (var i = 0; i < particlesPerPoint; i++) {
                    particles.push(new Particle(pt.x, pt.y, colors));
                }
            }, idx * 100);
        });

        startAnimation();
    }

    // -------------------------------------------------------------------------
    // Threshold Evaluation
    // -------------------------------------------------------------------------
    function evaluateThreshold(value, threshold, operator) {
        switch (operator) {
            case 'gt':   return value > threshold;
            case 'gte':  return value >= threshold;
            case 'lt':   return value < threshold;
            case 'lte':  return value <= threshold;
            case 'eq':   return value === threshold;
            case 'neq':  return value !== threshold;
            default:     return value >= threshold;
        }
    }

    // -------------------------------------------------------------------------
    // Watch Panels for Threshold Crossings
    // -------------------------------------------------------------------------
    function watchPanels() {
        var $triggerPanels = $('.confetti-trigger, .dashboard-panel.confetti-trigger');

        $triggerPanels.each(function() {
            var $panel = $(this);
            if ($panel.data('confetti-watching')) return;

            var threshold = parseFloat($panel.attr('data-confetti-threshold'));
            if (isNaN(threshold)) return;

            var operator = $panel.attr('data-confetti-operator') || 'gte';
            var count = parseInt($panel.attr('data-confetti-count'), 10) || CONFIG.particleCount;
            var onlyOnce = $panel.attr('data-confetti-once') === 'true';
            var customColorStr = $panel.attr('data-confetti-colors');
            var customColors = customColorStr ? customColorStr.split(',').map(function(c) { return c.trim(); }) : null;

            var prevValue = null;
            var hasFired = false;

            var checkInterval = setInterval(function() {
                if (onlyOnce && hasFired) {
                    clearInterval(checkInterval);
                    return;
                }

                var $resultNumber = $panel.find('.single-value .single-result .result-number');
                if (!$resultNumber.length) return;

                var text = $resultNumber.text().trim();
                var numVal = parseFloat(text.replace(/[^0-9.\-]/g, ''));
                if (isNaN(numVal)) return;

                // Only trigger on value change that crosses threshold
                if (numVal !== prevValue) {
                    var wasTriggered = prevValue !== null ? evaluateThreshold(prevValue, threshold, operator) : false;
                    var isTriggered = evaluateThreshold(numVal, threshold, operator);

                    if (isTriggered && (!wasTriggered || prevValue === null)) {
                        var el = $panel.find('.single-value')[0] || $panel[0];
                        burstFromElement(el, customColors, count);
                        hasFired = true;
                    }

                    prevValue = numVal;
                }
            }, CONFIG.pollInterval);

            $panel.data('confetti-watching', true);
        });
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    window.splunkConfetti = {
        burst: function(element, colors, count) {
            burstFromElement(element, colors, count);
        },
        celebrate: function(colors, count) {
            celebrate(colors, count);
        }
    };

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

    // Initial
    setTimeout(watchPanels, 1000);
});
