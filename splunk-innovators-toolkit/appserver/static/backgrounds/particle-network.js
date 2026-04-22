/*
 * ============================================================================
 * PARTICLE NETWORK BACKGROUND
 * Splunk Innovators Toolkit - Background Effects Library
 * ============================================================================
 *
 * Interactive particle constellation with dots connected by lines that react
 * to mouse movement. Canvas-based overlay renders behind dashboard panels.
 *
 * USAGE (Simple XML):
 *   <dashboard script="splunk-innovators-toolkit:backgrounds/particle-network.js">
 *
 * CONFIGURATION (optional data attributes on <dashboard>):
 *   data-particle-count="120"       — Number of particles (default: 100)
 *   data-particle-color="#00d4ff"    — Particle color (default: #00d4ff)
 *   data-particle-line-color="rgba(0,212,255,0.15)" — Line color
 *   data-particle-max-dist="150"    — Max connection distance (default: 140)
 *   data-particle-speed="0.4"       — Particle drift speed (default: 0.3)
 *   data-particle-mouse-radius="200" — Mouse interaction radius (default: 180)
 *
 * Compatible with: Splunk 8.x / 9.x Simple XML Dashboards
 * ============================================================================
 */

require(['jquery'], function($) {

    // ---- Configuration ----
    var $dashboard = $('.dashboard-body');
    var $xml = $('[data-particle-count], [data-particle-color], .dashboard-body').first();

    var CONFIG = {
        particleCount : parseInt($xml.attr('data-particle-count'))     || 100,
        color         : $xml.attr('data-particle-color')               || '#00d4ff',
        lineColor     : $xml.attr('data-particle-line-color')          || 'rgba(0,212,255,0.15)',
        maxDist       : parseInt($xml.attr('data-particle-max-dist'))  || 140,
        speed         : parseFloat($xml.attr('data-particle-speed'))   || 0.3,
        mouseRadius   : parseInt($xml.attr('data-particle-mouse-radius')) || 180,
        bgColor       : '#0a0e1a'
    };

    // ---- Inject Styles ----
    $('<style>').text(
        '.dashboard-body { background: ' + CONFIG.bgColor + ' !important; position: relative; overflow: hidden; }' +
        '#particle-network-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }' +
        '.dashboard-header { position: relative; z-index: 2; background: rgba(10,14,26,0.7) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0,212,255,0.1); }' +
        '.dashboard-header h2 { color: #dce4f0 !important; text-shadow: 0 0 15px rgba(0,212,255,0.25); }' +
        '.dashboard-header .description { color: rgba(220,228,240,0.65) !important; }' +
        '.dashboard-row { position: relative; z-index: 2; }' +
        '.dashboard-panel { position: relative; z-index: 2; background: rgba(10,14,26,0.92) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0,212,255,0.1) !important; border-radius: 10px !important; box-shadow: 0 6px 30px rgba(0,0,0,0.4); margin: 8px !important; }' +
        '.dashboard-panel:hover { background: rgba(10,14,26,0.96) !important; box-shadow: 0 8px 36px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.05); }' +
        '.panel-head { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }' +
        '.panel-head h3 { color: #00d4ff !important; font-size: 12px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; }' +
        '.single-result .result-number { color: #ffffff !important; }' +
        '.single-result .under-label { color: rgba(255,255,255,0.6) !important; }' +
        '.splunk-table th { color: #00d4ff !important; background: rgba(0,0,0,0.3) !important; }' +
        '.splunk-table td { color: rgba(255,255,255,0.85) !important; }' +
        '.single-value svg text { fill: #ffffff !important; }' +
        '.single-value .single-result { color: #ffffff !important; }' +
        '.splunk-table tr:hover td { background: rgba(255,255,255,0.05) !important; }' +
        '.dashboard-panel .panel-title { color: #b8c8e0 !important; }' +
        '.dashboard-body .input .splunk-textinput input, .dashboard-body .input .splunk-dropdown .select2-choice { background: rgba(10,14,26,0.75) !important; border: 1px solid rgba(0,212,255,0.15) !important; color: #dce4f0 !important; border-radius: 6px !important; }'
    ).appendTo('head');

    // ---- Create Canvas ----
    var canvas = document.createElement('canvas');
    canvas.id = 'particle-network-canvas';
    $dashboard.prepend(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: -9999, y: -9999 };
    var animId;

    // ---- Resize Handler ----
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    $(window).on('resize', resize);

    // ---- Mouse Tracking (enable pointer events briefly) ----
    $(document).on('mousemove', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // ---- Particle Class ----
    function Particle() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * CONFIG.speed * 2;
        this.vy = (Math.random() - 0.5) * CONFIG.speed * 2;
        this.radius = Math.random() * 2.2 + 0.8;
        this.opacity = Math.random() * 0.5 + 0.5;
    }

    Particle.prototype.update = function() {
        // Drift
        this.x += this.vx;
        this.y += this.vy;

        // Boundary wrap
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;

        // Mouse repulsion
        var dx = this.x - mouse.x;
        var dy = this.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
            var force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius;
            var angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * force * 2.5;
            this.y += Math.sin(angle) * force * 2.5;
        }
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
    };

    // ---- Initialize Particles ----
    for (var i = 0; i < CONFIG.particleCount; i++) {
        particles.push(new Particle());
    }

    // ---- Draw Connections ----
    function drawConnections() {
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.maxDist) {
                    var opacity = 1 - (dist / CONFIG.maxDist);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = CONFIG.lineColor;
                    ctx.globalAlpha = opacity * 0.6;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }

            // Mouse connection lines
            var mdx = particles[i].x - mouse.x;
            var mdy = particles[i].y - mouse.y;
            var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < CONFIG.mouseRadius) {
                var mopacity = 1 - (mdist / CONFIG.mouseRadius);
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = CONFIG.color;
                ctx.globalAlpha = mopacity * 0.4;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

    // ---- Animation Loop ----
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        drawConnections();
        animId = requestAnimationFrame(animate);
    }

    animate();

    // ---- Cleanup on page unload ----
    $(window).on('beforeunload', function() {
        cancelAnimationFrame(animId);
    });


    // ---- Fix SVG Inline Styles (Splunk 10) ----
    function fixSVGFills() {
        document.querySelectorAll('.single-value text.single-result').forEach(function(el) { el.style.fill = '#ffffff'; });
        document.querySelectorAll('.single-value text.under-label').forEach(function(el) { el.style.fill = 'rgba(180,200,230,0.7)'; });
    }
    fixSVGFills(); setTimeout(fixSVGFills, 1000); setTimeout(fixSVGFills, 3000);
    var svgObs = new MutationObserver(function() { fixSVGFills(); });
    svgObs.observe(document.body, { childList: true, subtree: true });
});
