/*
 * ============================================================================
 * MATRIX DATA RAIN BACKGROUND
 * Splunk Innovators Toolkit - Background Effects Library
 * ============================================================================
 *
 * Falling Matrix-style green data rain. Canvas overlay with columns of
 * falling random characters including katakana, latin, and numeric glyphs.
 *
 * USAGE (Simple XML):
 *   <dashboard script="splunk-innovators-toolkit:backgrounds/matrix-data-rain.js">
 *
 * CONFIGURATION (optional data attributes on <dashboard>):
 *   data-matrix-font-size="14"          — Character size in px (default: 15)
 *   data-matrix-color="#00ff41"          — Rain color (default: #00ff41)
 *   data-matrix-speed="50"              — Frame interval ms (default: 45)
 *   data-matrix-opacity="0.7"           — Canvas opacity (default: 0.65)
 *   data-matrix-fade="0.04"             — Trail fade rate (default: 0.05)
 *
 * Compatible with: Splunk 8.x / 9.x Simple XML Dashboards
 * ============================================================================
 */

require(['jquery'], function($) {

    // ---- Configuration ----
    var $xml = $('[data-matrix-font-size], [data-matrix-color], .dashboard-body').first();

    var CONFIG = {
        fontSize  : parseInt($xml.attr('data-matrix-font-size'))  || 15,
        color     : $xml.attr('data-matrix-color')                || '#00ff41',
        speed     : parseInt($xml.attr('data-matrix-speed'))      || 45,
        opacity   : parseFloat($xml.attr('data-matrix-opacity'))  || 0.65,
        fadeRate  : parseFloat($xml.attr('data-matrix-fade'))     || 0.05,
        bgColor   : '#000000'
    };

    // Character set: Katakana + Latin + Numbers + Symbols
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
                '\u30A0\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9' +
                '\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF\u30B0\u30B1\u30B2\u30B3' +
                '\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD' +
                '\u30BE\u30BF\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7' +
                '\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D0\u30D1' +
                '@#$%^&*<>{}[]|;:+=~';

    // ---- Inject Styles ----
    $('<style>').text(
        '.dashboard-body { background: ' + CONFIG.bgColor + ' !important; position: relative; overflow: hidden; }' +
        '#matrix-rain-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; opacity: ' + CONFIG.opacity + '; }' +
        '.dashboard-header { position: relative; z-index: 2; background: rgba(0,0,0,0.75) !important; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,255,65,0.15); }' +
        '.dashboard-header h2 { color: #00ff41 !important; text-shadow: 0 0 10px rgba(0,255,65,0.5), 0 0 30px rgba(0,255,65,0.2); font-family: "Courier New", monospace !important; }' +
        '.dashboard-header .description { color: rgba(0,255,65,0.6) !important; font-family: "Courier New", monospace !important; }' +
        '.dashboard-row { position: relative; z-index: 2; }' +
        '.dashboard-panel { position: relative; z-index: 2; background: rgba(5,10,5,0.93) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0,255,65,0.15) !important; border-radius: 6px !important; box-shadow: 0 0 20px rgba(0,255,65,0.05), 0 6px 24px rgba(0,0,0,0.6); margin: 8px !important; }' +
        '.dashboard-panel:hover { border-color: rgba(0,255,65,0.3) !important; box-shadow: 0 0 30px rgba(0,255,65,0.12), 0 8px 30px rgba(0,0,0,0.7); }' +
        '.panel-head { border-bottom: 1px solid rgba(0,255,65,0.1) !important; }' +
        '.panel-head h3 { color: #00ff41 !important; font-family: "Courier New", monospace !important; text-transform: uppercase; letter-spacing: 1px; font-size: 12px !important; }' +
        '.dashboard-panel .panel-body { color: #d0ecd0 !important; }' +
        '.single-result .result-number { color: #ffffff !important; }' +
        '.single-result .under-label { color: rgba(0,255,65,0.7) !important; }' +
        '.single-value svg text { fill: #ffffff !important; }' +
        '.single-value svg text[fill] { fill: #ffffff !important; }' +
        '.single-value .under-label { color: rgba(0,255,65,0.7) !important; }' +
        '.single-value .single-result { color: #ffffff !important; }' +
        '.splunk-table th { color: #00ff41 !important; background: rgba(0,15,0,0.8) !important; }' +
        '.splunk-table td { color: #d0ecd0 !important; }' +
        '.splunk-table tr:hover td { background: rgba(0,255,65,0.05) !important; }' +
        '.dashboard-body .input .splunk-textinput input, .dashboard-body .input .splunk-dropdown .select2-choice { background: rgba(0,8,0,0.85) !important; border: 1px solid rgba(0,255,65,0.2) !important; color: #00ff41 !important; border-radius: 3px !important; font-family: "Courier New", monospace !important; }'
    ).appendTo('head');

    // ---- Create Canvas ----
    var canvas = document.createElement('canvas');
    canvas.id = 'matrix-rain-canvas';
    $('.dashboard-body').prepend(canvas);

    var ctx = canvas.getContext('2d');
    var columns, drops;
    var intervalId;

    // ---- Setup ----
    function setup() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / CONFIG.fontSize);
        drops = [];
        for (var i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100; // Stagger start positions
        }
    }
    setup();
    $(window).on('resize', setup);

    // ---- Draw Frame ----
    function draw() {
        // Fade previous frame
        ctx.fillStyle = 'rgba(0, 0, 0, ' + CONFIG.fadeRate + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = CONFIG.fontSize + 'px "Courier New", monospace';

        for (var i = 0; i < columns; i++) {
            // Random character
            var char = CHARS[Math.floor(Math.random() * CHARS.length)];
            var x = i * CONFIG.fontSize;
            var y = drops[i] * CONFIG.fontSize;

            // Head character (bright white-green)
            ctx.fillStyle = '#aaffaa';
            ctx.fillText(char, x, y);

            // Trail character just above (standard green)
            if (drops[i] > 1) {
                var trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillStyle = CONFIG.color;
                ctx.globalAlpha = 0.8;
                ctx.fillText(trailChar, x, y - CONFIG.fontSize);
                ctx.globalAlpha = 1;
            }

            // Dimmer trail
            if (drops[i] > 2) {
                var dimChar = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillStyle = CONFIG.color;
                ctx.globalAlpha = 0.4;
                ctx.fillText(dimChar, x, y - CONFIG.fontSize * 2);
                ctx.globalAlpha = 1;
            }

            // Reset drop with randomness
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    // ---- Start Animation ----
    intervalId = setInterval(draw, CONFIG.speed);

    // ---- Fix SVG Inline Styles (Splunk 10 uses inline fill on <text>) ----
    function fixSVGFills() {
        document.querySelectorAll('.single-value text.single-result').forEach(function(el) {
            el.style.fill = '#ffffff';
        });
        document.querySelectorAll('.single-value text.under-label').forEach(function(el) {
            el.style.fill = 'rgba(0,255,65,0.7)';
        });
    }

    // Run on load and watch for new elements
    fixSVGFills();
    setTimeout(fixSVGFills, 1000);
    setTimeout(fixSVGFills, 3000);
    setTimeout(fixSVGFills, 5000);

    var svgObserver = new MutationObserver(function() { fixSVGFills(); });
    svgObserver.observe(document.body, { childList: true, subtree: true });

    // ---- Cleanup ----
    $(window).on('beforeunload', function() {
        clearInterval(intervalId);
        svgObserver.disconnect();
    });

});
