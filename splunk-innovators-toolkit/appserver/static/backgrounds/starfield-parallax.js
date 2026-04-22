/*
 * ============================================================================
 * STARFIELD PARALLAX BACKGROUND
 * Splunk Innovators Toolkit - Background Effects Library
 * ============================================================================
 *
 * Depth-scrolling star field with multiple layers of stars at different
 * speeds creating a stunning parallax warp effect. Stars drift and
 * twinkle with varying brightness, size, and velocity.
 *
 * USAGE (Simple XML):
 *   <dashboard script="splunk-innovators-toolkit:backgrounds/starfield-parallax.js">
 *
 * CONFIGURATION (optional data attributes on <dashboard>):
 *   data-star-count="400"        — Total star count (default: 350)
 *   data-star-speed="0.5"        — Base speed multiplier (default: 0.4)
 *   data-star-warp="false"       — Enable warp speed streaks (default: false)
 *   data-star-color="#ffffff"     — Star color (default: #ffffff)
 *
 * Compatible with: Splunk 8.x / 9.x Simple XML Dashboards
 * ============================================================================
 */

require(['jquery'], function($) {

    // ---- Configuration ----
    var $xml = $('[data-star-count], [data-star-speed], .dashboard-body').first();

    var CONFIG = {
        starCount : parseInt($xml.attr('data-star-count'))   || 350,
        speed     : parseFloat($xml.attr('data-star-speed')) || 0.4,
        warp      : $xml.attr('data-star-warp') === 'true',
        color     : $xml.attr('data-star-color') || '#ffffff',
        bgColor   : '#000008',
        layers    : 4
    };

    // ---- Inject Styles ----
    $('<style>').text(
        '.dashboard-body { background: ' + CONFIG.bgColor + ' !important; position: relative; overflow: hidden; }' +
        '#starfield-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }' +
        '.dashboard-header { position: relative; z-index: 2; background: rgba(0,0,8,0.65) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.06); }' +
        '.dashboard-header h2 { color: #d8dce8 !important; text-shadow: 0 0 12px rgba(150,180,255,0.3); }' +
        '.dashboard-header .description { color: rgba(200,210,230,0.6) !important; }' +
        '.dashboard-row { position: relative; z-index: 2; }' +
        '.dashboard-panel { position: relative; z-index: 2; background: rgba(0,0,12,0.92) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 10px !important; box-shadow: 0 6px 28px rgba(0,0,0,0.5); margin: 8px !important; }' +
        '.dashboard-panel:hover { background: rgba(0,0,12,0.96) !important; box-shadow: 0 8px 36px rgba(0,0,0,0.6); }' +
        '.panel-head { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }' +
        '.panel-head h3 { color: #a0b0ff !important; font-size: 12px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; }' +
        '.single-result .result-number { color: #ffffff !important; }' +
        '.single-result .under-label { color: rgba(255,255,255,0.6) !important; }' +
        '.splunk-table th { color: #a0b0ff !important; background: rgba(0,0,0,0.3) !important; }' +
        '.splunk-table td { color: rgba(255,255,255,0.85) !important; }' +
        '.single-value svg text { fill: #ffffff !important; }' +
        '.single-value .single-result { color: #ffffff !important; }' +
        '.splunk-table tr:hover td { background: rgba(255,255,255,0.05) !important; }' +
        '.dashboard-panel .panel-title { color: #b0b8d0 !important; }' +
        '.dashboard-panel .panel-body { color: #8890a8 !important; }' +
        '.dashboard-body .input .splunk-textinput input, .dashboard-body .input .splunk-dropdown .select2-choice { background: rgba(0,0,12,0.75) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #d8dce8 !important; border-radius: 6px !important; }'
    ).appendTo('head');

    // ---- Create Canvas ----
    var canvas = document.createElement('canvas');
    canvas.id = 'starfield-canvas';
    $('.dashboard-body').prepend(canvas);

    var ctx = canvas.getContext('2d');
    var stars = [];
    var centerX, centerY;
    var animId;

    // ---- Resize ----
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
    }
    resize();
    $(window).on('resize', resize);

    // ---- Star Class ----
    function Star() {
        this.reset();
    }

    Star.prototype.reset = function() {
        // Place star randomly in 3D space
        this.x = (Math.random() - 0.5) * canvas.width * 2;
        this.y = (Math.random() - 0.5) * canvas.height * 2;
        this.z = Math.random() * 1500 + 100;
        this.pz = this.z; // Previous z for streak trails

        // Layer determines speed multiplier
        this.layer = Math.floor(Math.random() * CONFIG.layers);
        this.speedMult = 0.3 + (this.layer / CONFIG.layers) * 1.5;

        // Visual properties
        this.brightness = 0.3 + Math.random() * 0.7;
        this.twinkleSpeed = 0.01 + Math.random() * 0.03;
        this.twinklePhase = Math.random() * Math.PI * 2;

        // Subtle color variation
        var hueShift = Math.random() * 30 - 15; // -15 to +15
        if (Math.random() > 0.85) {
            // Some stars get a blue/yellow tint
            this.colorR = Math.min(255, 230 + hueShift);
            this.colorG = Math.min(255, 235 + hueShift * 0.5);
            this.colorB = 255;
        } else {
            this.colorR = 255;
            this.colorG = 255;
            this.colorB = 255;
        }
    };

    Star.prototype.update = function(time) {
        this.pz = this.z;
        this.z -= CONFIG.speed * this.speedMult * 2;

        // Twinkle
        this.currentBrightness = this.brightness *
            (0.7 + 0.3 * Math.sin(time * this.twinkleSpeed + this.twinklePhase));

        // Reset when too close
        if (this.z <= 1) {
            this.reset();
            this.z = 1500;
            this.pz = this.z;
        }
    };

    Star.prototype.draw = function() {
        // Project 3D to 2D
        var sx = (this.x / this.z) * 400 + centerX;
        var sy = (this.y / this.z) * 400 + centerY;

        // Check bounds
        if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) {
            this.reset();
            return;
        }

        // Size based on depth
        var size = Math.max(0.3, (1 - this.z / 1600) * 3.5);
        var alpha = this.currentBrightness * (1 - this.z / 1600);

        if (CONFIG.warp && size > 0.8) {
            // Warp streaks
            var px = (this.x / this.pz) * 400 + centerX;
            var py = (this.y / this.pz) * 400 + centerY;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = 'rgba(' + this.colorR + ',' + this.colorG + ',' + this.colorB + ',' + (alpha * 0.6) + ')';
            ctx.lineWidth = size * 0.5;
            ctx.stroke();
        }

        // Draw star point
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + this.colorR + ',' + this.colorG + ',' + this.colorB + ',' + alpha + ')';
        ctx.fill();

        // Glow for brighter stars
        if (size > 1.5 && alpha > 0.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.colorR + ',' + this.colorG + ',' + this.colorB + ',' + (alpha * 0.08) + ')';
            ctx.fill();
        }
    };

    // ---- Initialize Stars ----
    for (var i = 0; i < CONFIG.starCount; i++) {
        stars.push(new Star());
    }

    // ---- Nebula Background Layer ----
    function drawNebula() {
        // Subtle nebula glow
        var grad1 = ctx.createRadialGradient(
            canvas.width * 0.3, canvas.height * 0.4, 0,
            canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4
        );
        grad1.addColorStop(0, 'rgba(30, 20, 80, 0.04)');
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var grad2 = ctx.createRadialGradient(
            canvas.width * 0.7, canvas.height * 0.6, 0,
            canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.35
        );
        grad2.addColorStop(0, 'rgba(20, 50, 80, 0.03)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ---- Animation Loop ----
    function animate(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawNebula();

        for (var i = 0; i < stars.length; i++) {
            stars[i].update(time);
            stars[i].draw();
        }

        animId = requestAnimationFrame(animate);
    }

    animate(0);

    // ---- Cleanup ----
    $(window).on('beforeunload', function() {
        cancelAnimationFrame(animId);
    });


    // ---- Fix SVG Inline Styles (Splunk 10) ----
    function fixSVGFills() {
        document.querySelectorAll('.single-value text.single-result').forEach(function(el) { el.style.fill = '#ffffff'; });
        document.querySelectorAll('.single-value text.under-label').forEach(function(el) { el.style.fill = 'rgba(176,184,208,0.7)'; });
    }
    fixSVGFills(); setTimeout(fixSVGFills, 1000); setTimeout(fixSVGFills, 3000);
    var svgObs = new MutationObserver(function() { fixSVGFills(); });
    svgObs.observe(document.body, { childList: true, subtree: true });
});
