/*
 * ============================================================================
 * VIDEO AMBIENT LOOP BACKGROUND
 * Splunk Innovators Toolkit - Background Effects Library
 * ============================================================================
 *
 * Helper that enables using a subtle looping video background behind
 * dashboard panels. Supports any MP4/WebM URL. Video is muted, looped,
 * and rendered behind all dashboard content with configurable opacity
 * and blur for a soft ambient effect.
 *
 * USAGE (Simple XML):
 *   <dashboard script="splunk-innovators-toolkit:backgrounds/video-ambient-loop.js">
 *
 * CONFIGURATION (data attributes on the dashboard XML root or .dashboard-body):
 *   data-video-src="https://example.com/bg-video.mp4" — REQUIRED: Video URL
 *   data-video-opacity="0.3"      — Video opacity 0-1 (default: 0.3)
 *   data-video-blur="4"           — Blur amount in px (default: 2)
 *   data-video-brightness="0.6"   — Brightness 0-1 (default: 0.6)
 *   data-video-overlay="#000000"   — Overlay color (default: rgba(0,0,0,0.5))
 *   data-video-overlay-opacity="0.5" — Overlay opacity (default: 0.5)
 *   data-video-fit="cover"        — Object-fit: cover|contain|fill (default: cover)
 *   data-video-position="center"  — Object-position (default: center)
 *   data-video-playback-rate="1"  — Playback speed (default: 1)
 *
 * EXAMPLE with all options:
 *   <form script="splunk-innovators-toolkit:backgrounds/video-ambient-loop.js"
 *         data-video-src="/static/app/my_app/video/ambient.mp4"
 *         data-video-opacity="0.35"
 *         data-video-blur="3"
 *         data-video-brightness="0.5">
 *
 * TIPS:
 *   - Use short, seamless loop videos (10-30 seconds)
 *   - Recommend 720p or 1080p for quality without too much bandwidth
 *   - Abstract/nature videos work best (clouds, water, bokeh, etc.)
 *   - Free ambient videos: Pexels, Pixabay, Coverr
 *   - Place videos in your app's appserver/static/ folder for local hosting
 *
 * Compatible with: Splunk 8.x / 9.x Simple XML Dashboards
 * ============================================================================
 */

require(['jquery'], function($) {

    // ---- Read Configuration ----
    var $src = $('[data-video-src]').first();
    var $body = $('.dashboard-body');

    // Try to get video source from multiple locations
    var videoSrc = $src.attr('data-video-src') || $body.attr('data-video-src');

    if (!videoSrc) {
        console.warn(
            '[Innovators Toolkit] video-ambient-loop.js: No video source specified. ' +
            'Add data-video-src="URL" to your dashboard element. ' +
            'Example: data-video-src="/static/app/my_app/video/ambient.mp4"'
        );

        // Show a helpful placeholder instead of nothing
        $('<style>').text(
            '.dashboard-body { background: #0a0a1a !important; position: relative; }' +
            '.dashboard-body::before { content: "Video Background: Set data-video-src attribute"; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.15); font-size: 14px; font-family: monospace; z-index: 0; pointer-events: none; }'
        ).appendTo('head');
        return;
    }

    var CONFIG = {
        src            : videoSrc,
        opacity        : parseFloat($src.attr('data-video-opacity'))         || 0.3,
        blur           : parseInt($src.attr('data-video-blur'))              || 2,
        brightness     : parseFloat($src.attr('data-video-brightness'))      || 0.6,
        overlayColor   : $src.attr('data-video-overlay')                     || '#000000',
        overlayOpacity : parseFloat($src.attr('data-video-overlay-opacity')) || 0.5,
        fit            : $src.attr('data-video-fit')                         || 'cover',
        position       : $src.attr('data-video-position')                    || 'center',
        playbackRate   : parseFloat($src.attr('data-video-playback-rate'))   || 1
    };

    // ---- Inject Styles ----
    $('<style>').text(
        '.dashboard-body { background: #0a0a1a !important; position: relative; overflow: hidden; }' +

        '#video-bg-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }' +

        '#video-bg-element { position: absolute; top: 50%; left: 50%; min-width: 100%; min-height: 100%; width: auto; height: auto; transform: translate(-50%, -50%);' +
        ' object-fit: ' + CONFIG.fit + '; object-position: ' + CONFIG.position + ';' +
        ' opacity: ' + CONFIG.opacity + ';' +
        ' filter: blur(' + CONFIG.blur + 'px) brightness(' + CONFIG.brightness + ');' +
        ' -webkit-filter: blur(' + CONFIG.blur + 'px) brightness(' + CONFIG.brightness + ');' +
        ' transition: opacity 1.5s ease; }' +

        '#video-bg-element.loaded { opacity: ' + CONFIG.opacity + '; }' +
        '#video-bg-element.loading { opacity: 0; }' +

        '#video-bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%;' +
        ' background: ' + CONFIG.overlayColor + '; opacity: ' + CONFIG.overlayOpacity + '; }' +

        '.dashboard-header { position: relative; z-index: 2; background: rgba(10,10,26,0.7) !important; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.06); }' +
        '.dashboard-header h2 { color: #dde0f0 !important; }' +
        '.dashboard-header .description { color: rgba(220,224,240,0.6) !important; }' +
        '.dashboard-row { position: relative; z-index: 2; }' +
        '.dashboard-panel { position: relative; z-index: 2; background: rgba(10,10,26,0.92) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06) !important; border-radius: 10px !important; box-shadow: 0 6px 28px rgba(0,0,0,0.4); margin: 8px !important; }' +
        '.dashboard-panel:hover { background: rgba(10,10,26,0.96) !important; }' +
        '.panel-head { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }' +
        '.panel-head h3 { color: #c0c8ff !important; font-size: 12px !important; font-weight: 600 !important; letter-spacing: 0.5px !important; }' +
        '.single-result .result-number { color: #ffffff !important; }' +
        '.single-result .under-label { color: rgba(255,255,255,0.6) !important; }' +
        '.splunk-table th { color: #c0c8ff !important; background: rgba(0,0,0,0.3) !important; }' +
        '.splunk-table td { color: rgba(255,255,255,0.85) !important; }' +
        '.single-value svg text { fill: #ffffff !important; }' +
        '.single-value .single-result { color: #ffffff !important; }' +
        '.splunk-table tr:hover td { background: rgba(255,255,255,0.05) !important; }' +
        '.dashboard-panel .panel-title { color: #c0c8e0 !important; }' +
        '.dashboard-body .input .splunk-textinput input, .dashboard-body .input .splunk-dropdown .select2-choice { background: rgba(10,10,26,0.8) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #dde0f0 !important; border-radius: 6px !important; }'
    ).appendTo('head');

    // ---- Create Video Container ----
    var $container = $('<div id="video-bg-container"></div>');
    var $overlay = $('<div id="video-bg-overlay"></div>');

    var video = document.createElement('video');
    video.id = 'video-bg-element';
    video.className = 'loading';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.preload = 'auto';

    // Set playback rate
    video.playbackRate = CONFIG.playbackRate;

    // Handle video load
    $(video).on('canplay', function() {
        video.className = 'loaded';
        video.play().catch(function(e) {
            console.warn('[Innovators Toolkit] Video autoplay blocked:', e.message);
        });
    });

    // Handle video errors gracefully
    $(video).on('error', function() {
        console.error('[Innovators Toolkit] Failed to load video:', CONFIG.src);
        $container.remove();
    });

    // Set source
    video.src = CONFIG.src;

    // Assemble DOM
    $container.append(video);
    $container.append($overlay);
    $body.prepend($container);

    // ---- Visibility API: Pause when tab hidden ----
    $(document).on('visibilitychange', function() {
        if (document.hidden) {
            video.pause();
        } else {
            video.play().catch(function() {});
        }
    });

    // ---- Cleanup ----
    $(window).on('beforeunload', function() {
        video.pause();
        video.src = '';
        video.load();
    });


    // ---- Fix SVG Inline Styles (Splunk 10) ----
    function fixSVGFills() {
        document.querySelectorAll('.single-value text.single-result').forEach(function(el) { el.style.fill = '#ffffff'; });
        document.querySelectorAll('.single-value text.under-label').forEach(function(el) { el.style.fill = 'rgba(192,200,224,0.7)'; });
    }
    fixSVGFills(); setTimeout(fixSVGFills, 1000); setTimeout(fixSVGFills, 3000);
    var svgObs = new MutationObserver(function() { fixSVGFills(); });
    svgObs.observe(document.body, { childList: true, subtree: true });
});
