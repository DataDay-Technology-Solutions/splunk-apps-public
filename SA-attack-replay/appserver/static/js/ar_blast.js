// ============================================================================
// BLAST RADIUS - Animated SVG topology with DVR-style playback
// SA-attack-replay - Splunk Community Dashboard Contest 2026
//
// Phase 5 (T5.1 .. T5.4):
//   T5.1 - Playback speed cycler: 0.5x -> 1x -> 2x -> 4x (loops). The label on
//          #br-speed reflects the current speed and a brief animation fires
//          on each click. The playback interval / per-frame increment
//          recomputes immediately so the same scenario plays through faster
//          / slower as set.
//
//   T5.2 - Scenario + phase label rendered in #br-time-display. While playback
//          is active the time display shows TWO LINES:
//                9:14:22 AM
//                Operation Midnight Eclipse - Phase 3: Lateral Movement
//          The active phase is computed each frame from the playhead's
//          _time_offset against scenario.phases[i].events[*]._time_offset.
//          The currently-active phase id is cached so the transition banner
//          (T5.3) can fire exactly once at each boundary.
//
//   T5.3 - Phase-transition banner: when the playhead crosses a phase
//          boundary we fade in #br-phase-annotation with the new phase's
//          transition_text (e.g. "LATERAL MOVEMENT"). 300ms fade-in, 2500ms
//          hold, 500ms fade-out. Banner is visual-only - does NOT pause or
//          interrupt playback. Cyberpunk styling injected via CSS below.
//
//   T5.4 - Auto-tune playback duration per scenario. Each scenario specifies
//          a target_playback_seconds (default 90). We compute
//                maxOffset = max(event._time_offset for all events)
//                simulatedSecPerRealSec = maxOffset / target_playback_seconds
//                simSecPerFrame = (simulatedSecPerRealSec / 60) * playSpeed
//          and advance the playhead by simSecPerFrame each animation frame.
//          So all three scenarios play through in ~90s at 1x, scaled by the
//          speed cycler (0.5x/1x/2x/4x).
//
// Scenario selection precedence:
//   (b) The scenario the user just streamed (cached on window or via
//       DemoControls.getLastStreamedScenario)
//   (a) The `scenario` URL token (read via Splunk mvc default tokens)
//   default fallback: op_midnight_eclipse
// ============================================================================

var _appStaticPrefix = ((typeof $C !== 'undefined' && $C['MRSPARKLE_ROOT_PATH']) || '') + '/static/app/SA-attack-replay/js/';
// Cache-bust for the require()'d modules. Splunk serves these via a non-hashed
// /static/app/ URL with far-future expiry that an app upgrade / container
// restart does NOT invalidate, so without a version query a browser keeps
// running the old ar_streamer/ar_controls. Bump _arv on every release. Must
// match the value in ar_controls.js so both resolve ar_streamer to one module.
var _arv = '?v=1.9.14';

require([
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    _appStaticPrefix + 'ar_controls.js' + _arv,
    _appStaticPrefix + 'ar_streamer.js' + _arv,
    _appStaticPrefix + 'ar_lanes.js' + _arv,
    'splunkjs/mvc/simplexml/ready!'
], function($, mvc, SearchManager, DemoControls, DemoStreamer, LaneView) {
    'use strict';

    // v1.9.1 — inject the sequenced attack-chain step-badge styles from JS.
    // (These live here rather than in attack-replay.css because that file is
    // not always writable in the build env; keeping them inline guarantees the
    // numbered/pulsing chain markers ship with the JS that draws them.)
    (function injectChainStyles() {
        if (document.getElementById('ar-chain-styles')) return;
        var st = document.createElement('style');
        st.id = 'ar-chain-styles';
        st.textContent =
            '.ar-step-badge{pointer-events:none;}' +
            '.ar-step-num{paint-order:stroke;stroke:#08081a;stroke-width:2.5px;}' +
            '.ar-step-dot{transition:stroke-width .2s ease;}' +
            '.ar-step-current .ar-step-dot{stroke:#ff4d4d;animation:ar-step-pulse 1.15s ease-in-out infinite;}' +
            '@keyframes ar-step-pulse{0%,100%{stroke-width:2;filter:drop-shadow(0 0 2px rgba(255,77,77,.6));}' +
            '50%{stroke-width:4;filter:drop-shadow(0 0 10px rgba(255,77,77,.95));}}' +
            // lane event tooltip (what it is + what it did)
            '#ar-lane-tip{position:fixed;z-index:99999;width:300px;max-width:90vw;pointer-events:auto;' +
            'background:rgba(10,12,26,.97);border:1px solid #2a2f4a;border-radius:8px;padding:10px 12px;' +
            'box-shadow:0 8px 28px rgba(0,0,0,.55);opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s;' +
            'font-family:var(--ar-sans,-apple-system);color:#e7ebf7;}' +
            '#ar-lane-tip:not(.visible){pointer-events:none;}' +
            '#ar-lane-tip.visible{opacity:1;transform:translateY(0);}' +
            '#ar-lane-tip .lt-close{position:absolute;top:6px;right:8px;width:20px;height:20px;line-height:18px;' +
            'text-align:center;border:none;border-radius:4px;background:rgba(255,255,255,.06);color:#9aa7c8;' +
            'font-size:15px;cursor:pointer;padding:0;}' +
            '#ar-lane-tip .lt-close:hover{background:rgba(255,90,90,.25);color:#fff;}' +
            '#ar-lane-tip .lt-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;' +
            'border-left:3px solid #888;padding-left:8px;margin-bottom:6px;}' +
            '#ar-lane-tip .lt-tech{font-family:"SF Mono","Fira Code",monospace;font-weight:700;font-size:13px;}' +
            '#ar-lane-tip .lt-tac{font-size:11px;text-transform:uppercase;letter-spacing:.4px;}' +
            '#ar-lane-tip .lt-who{font-size:13px;font-weight:600;margin:2px 0;}' +
            '#ar-lane-tip .lt-arrow{color:#ff9a3c;font-weight:700;}' +
            '#ar-lane-tip .lt-when{font-size:11px;color:#9aa7c8;margin-bottom:4px;}' +
            '#ar-lane-tip .lt-desc{font-size:12px;line-height:1.5;color:#cdd4ea;}' +
            '#ar-lane-tip .lt-risk{display:inline-block;margin-top:8px;font-size:10px;font-weight:700;letter-spacing:.5px;' +
            'border-radius:4px;padding:2px 7px;}' +
            '#ar-lane-tip .lt-low{background:#1f3a2a;color:#8af0c8;}' +
            '#ar-lane-tip .lt-medium{background:#3a3520;color:#ffe39a;}' +
            '#ar-lane-tip .lt-high{background:#3a2620;color:#ffb38a;}' +
            '#ar-lane-tip .lt-critical{background:#3a1d1d;color:#ff8a8a;}';
        document.head.appendChild(st);
    })();

    // Defensive polyfill: an older DemoStreamer module may have been resolved
    // (e.g., from a sibling app or browser require cache). Shim missing
    // methods so the rest of this script doesn't TypeError.
    if (!DemoStreamer || typeof DemoStreamer.getScenario !== 'function') {
        DemoStreamer = DemoStreamer || {};
        if (typeof DemoStreamer.getScenario !== 'function') DemoStreamer.getScenario = function() { return null; };
        if (typeof DemoStreamer.getScenarioInfo !== 'function') DemoStreamer.getScenarioInfo = function() { return null; };
        if (typeof DemoStreamer.listScenarios !== 'function') DemoStreamer.listScenarios = function() { return []; };
        if (typeof DemoStreamer.streamScenario !== 'function') {
            DemoStreamer.streamScenario = function(id, cb) {
                if (typeof DemoStreamer.start === 'function') return DemoStreamer.start(cb);
            };
        }
        if (typeof DemoStreamer.clearScenarioData !== 'function') {
            DemoStreamer.clearScenarioData = function(onDone) {
                if (typeof DemoStreamer.clearDemoData === 'function') return DemoStreamer.clearDemoData(onDone);
                if (typeof onDone === 'function') onDone(null);
            };
        }
        console.warn('[SA-attack-replay] DemoStreamer missing new API; using polyfill shims.');
    }
    // Attacker thought-bubble overlay state
    var _bubbleEl = null;
    var _bubbleHideTimer = null;
    var _lastBubbleIdx = -1;
    function _ensureBubble() {
        if (_bubbleEl) return _bubbleEl;
        var root = document.getElementById('blast-radius-root');
        if (!root) return null;
        _bubbleEl = document.createElement('div');
        _bubbleEl.className = 'attacker-thought-bubble';
        _bubbleEl.innerHTML = '<div class="atb-text"></div>';
        root.appendChild(_bubbleEl);
        return _bubbleEl;
    }
    function _showThought(text) {
        // Long dwell — the callout lingers until the next thought replaces it.
        var holdMs = Math.max(30000, text.length * 320);
        // In lane mode, render the thought in the lane view's reserved top band
        // (true dead space) instead of the floating DOM bubble.
        if (laneCtl && laneCtl.setThought) {
            laneCtl.setThought(text);
            clearTimeout(_bubbleHideTimer);
            _bubbleHideTimer = setTimeout(function() { if (laneCtl) laneCtl.setThought(null); }, holdMs);
            return;
        }
        var el = _ensureBubble();
        if (!el) return;
        el.querySelector('.atb-text').textContent = text;
        clearTimeout(_bubbleHideTimer);
        // Force reflow to retrigger transition
        el.classList.remove('visible');
        void el.offsetWidth;
        el.classList.add('visible');
        _bubbleHideTimer = setTimeout(function() {
            if (_bubbleEl) _bubbleEl.classList.remove('visible');
        }, holdMs);
    }
    function _maybeFireThought(offsetSec) {
        if (!activeScenario || !activeScenario.attacker_thoughts) return;
        var list = activeScenario.attacker_thoughts;
        var lastEligibleIdx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i]._time_offset <= offsetSec) lastEligibleIdx = i;
            else break;
        }
        if (lastEligibleIdx >= 0 && lastEligibleIdx !== _lastBubbleIdx) {
            _lastBubbleIdx = lastEligibleIdx;
            _showThought(list[lastEligibleIdx].text);
        }
    }
    function _resetBubbleState() {
        _lastBubbleIdx = -1;
        if (_bubbleEl) _bubbleEl.classList.remove('visible');
        if (laneCtl && laneCtl.setThought) laneCtl.setThought(null);
    }


    // Initialize floating demo control
    DemoControls.init();

    // ========================================================================
    // PHASE-ANNOTATION CSS INJECTION (T5.3)
    // ========================================================================
    // The element #br-phase-annotation already exists in the XML; we just
    // need to inject the visual styling for it + the speed-button click
    // animation. We do this in JS so the visual is owned by this view.

    (function injectPhase5Styles() {
        if (document.getElementById('phase-annotation-style')) return;
        var css = '\
        .phase-annotation { \
            position: absolute; \
            top: 40%; left: 50%; \
            transform: translate(-50%, -50%) scale(0.92); \
            background: linear-gradient(135deg, rgba(13,13,37,0.95), rgba(20,10,40,0.95)); \
            border: 2px solid #ff8c00; \
            border-radius: 12px; \
            padding: 22px 44px; \
            color: #fff; \
            font-family: "SF Mono","Fira Code",monospace; \
            font-size: 26px; \
            font-weight: bold; \
            letter-spacing: 4px; \
            text-transform: uppercase; \
            text-align: center; \
            text-shadow: 0 0 20px rgba(255,140,0,0.8); \
            box-shadow: 0 0 60px rgba(255,140,0,0.4), inset 0 0 30px rgba(255,140,0,0.1); \
            opacity: 0; \
            pointer-events: none; \
            z-index: 100; \
            white-space: nowrap; max-width: 90%; \
            transition: opacity 300ms ease-out, transform 300ms ease-out; \
        } \
        .phase-annotation .phase-icon { \
            color: #ffd700; \
            margin-right: 10px; \
            font-size: 28px; \
            text-shadow: 0 0 15px rgba(255,215,0,0.9); \
        } \
        .phase-annotation .phase-text { \
            background: linear-gradient(90deg, #ff8c00, #ffd700, #00ddff); \
            -webkit-background-clip: text; \
            background-clip: text; \
            -webkit-text-fill-color: transparent; \
        } \
        .phase-annotation.visible { \
            opacity: 1; \
            transform: translate(-50%, -50%) scale(1); \
        } \
        .phase-annotation.fading { \
            opacity: 0; \
            transform: translate(-50%, -50%) scale(1.05); \
            transition: opacity 500ms ease-in, transform 500ms ease-in; \
        } \
        \
        /* T5.1 - Speed cycler click animation */\
        #br-speed { \
            transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease; \
            min-width: 42px; \
            text-align: center; \
        } \
        #br-speed.speed-tick { \
            transform: scale(1.18); \
            box-shadow: 0 0 12px rgba(0,221,255,0.6); \
        } \
        \
        /* T5.2 - Two-line time display */\
        .time-current.has-scenario { \
            display: flex; flex-direction: column; align-items: flex-start; gap: 2px; \
            line-height: 1.25; \
        } \
        .time-current .time-clock { \
            font-size: 14px; font-weight: bold; color: #00ddff; \
            font-family: "SF Mono","Fira Code",monospace; \
        } \
        .time-current .time-phase { \
            font-size: 11px; font-weight: normal; color: #ff8c00; \
            font-family: "SF Mono","Fira Code",monospace; \
            letter-spacing: 0.4px; \
            text-overflow: ellipsis; overflow: hidden; white-space: nowrap; \
            max-width: 100%; \
        } \
        ';
        var styleEl = document.createElement('style');
        styleEl.id = 'phase-annotation-style';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    })();

    // ========================================================================
    // STATE
    // ========================================================================

    var width, height, svg, g, simulation;
    var nodes = [], edges = [], timelineEvents = [];
    var currentTimeIndex = -1;  // v1.8.0 — start "unapplied" so the first play()
                                // renders step 0; 0 made play() skip the opening
                                // phase (its < 0 fresh-start guard never fired).
    var isPlaying = false;
    var playInterval = null;
    var playSpeed = 1;
    var activeNodes = new Set();
    var activeEdges = new Set();
    var isDemoMode = true;
    var cachedDemoScenario = null;
    var cachedLiveScenario = null;
    var liveScenarioFetching = false;
    var _activeTipDismiss = null;

    // Phase 5 - playback engine state
    var playheadOffset = 0;           // current "simulated seconds" since scenario start
    var maxOffset = 0;                // scenario's maximum _time_offset
    var targetPlaybackSec = 90;       // scenario.target_playback_seconds
    var simulatedSecPerRealSec = 1;   // maxOffset / targetPlaybackSec
    var rafHandle = null;             // requestAnimationFrame for playhead advance
    var lastFrameTime = 0;            // ms timestamp of last frame
    var scenarioBaseClock = null;     // Date object - "first event happened at this real-clock time"
    var activeScenarioId = null;      // current scenario id
    var activeScenarioName = '';      // current scenario display name
    var activeScenario = null;        // full scenario object from DemoStreamer.getScenario
    var currentPhaseIdx = -1;         // last-known phase index (for boundary detection)
    var phasePresentationCache = null;// pre-flattened phase ranges for quick lookup
    var SPEED_STEPS = [0.5, 1, 2, 4]; // T5.1 cycler

    // Zoom/pan state
    var viewBox = { x: 0, y: 0, w: 0, h: 0 };
    var zoomLevel = 1;
    var isPanning = false;
    var panStart = { x: 0, y: 0 };
    var panViewBoxStart = { x: 0, y: 0 };

    // Drag listener cleanup references
    var dragMoveHandler = null;
    var dragUpHandler = null;

    // Protocol color map
    var protocolColors = {
        rdp:      '#ff4444',
        smb:      '#ff8c00',
        ssh:      '#00ff88',
        kerberos: '#aa44ff',
        http:     '#4488ff',
        dns:      '#00ddff',
        exfil:    '#ff4444',
        unknown:  '#666699'
    };

    // Risk level config
    var riskConfig = {
        critical: { color: '#ff4444', minRadius: 22, glow: '0 0 25px rgba(255,68,68,0.6)' },
        high:     { color: '#ff8c00', minRadius: 18, glow: '0 0 20px rgba(255,140,0,0.5)' },
        medium:   { color: '#ffd700', minRadius: 14, glow: '0 0 15px rgba(255,215,0,0.4)' },
        low:      { color: '#00ff88', minRadius: 10, glow: '0 0 10px rgba(0,255,136,0.3)' },
        info:     { color: '#4488ff', minRadius: 8,  glow: '0 0 10px rgba(68,136,255,0.3)' }
    };

    function getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        if (score >= 20) return 'low';
        return 'info';
    }

    // ========================================================================
    // SCENARIO RESOLUTION (Phase 5 T5.2)
    // ========================================================================
    // Precedence:
    //   1. scenario the user just streamed (DemoControls.getLastStreamedScenario)
    //   2. ?scenario= URL token via Splunk default token model
    //   3. fallback: op_midnight_eclipse
    // We ignore the special "all" token value (it's the dropdown's default and
    // means "any" rather than a specific scenario).

    function resolveScenarioId() {
        // (b) Last-streamed scenario from the FAB widget
        try {
            var fromCtrl = DemoControls && DemoControls.getLastStreamedScenario && DemoControls.getLastStreamedScenario();
            if (fromCtrl) return fromCtrl;
        } catch (e) {}
        try {
            if (window.__SA_LAST_SCENARIO__) return window.__SA_LAST_SCENARIO__;
        } catch (e) {}

        // (a) URL token
        try {
            var def = mvc.Components.get('default');
            if (def) {
                var v = def.get('scenario');
                if (v && v !== 'all' && DemoStreamer.getScenario(v)) return v;
            }
            // Also check submitted tokens
            var sub = mvc.Components.get('submitted');
            if (sub) {
                var sv = sub.get('scenario');
                if (sv && sv !== 'all' && DemoStreamer.getScenario(sv)) return sv;
            }
        } catch (e) {}

        // Default fallback
        return 'op_midnight_eclipse';
    }

    function loadActiveScenarioFromStreamer() {
        var id = resolveScenarioId();
        var s = DemoStreamer.getScenario(id);
        if (!s) {
            id = 'op_midnight_eclipse';
            s = DemoStreamer.getScenario(id);
        }
        activeScenarioId = id;
        activeScenario = s || null;
        activeScenarioName = (s && s.name) || '';
        rebuildPhasePresentationCache();
    }

    function rebuildPhasePresentationCache() {
        phasePresentationCache = [];
        maxOffset = 0;
        targetPlaybackSec = 90;
        if (!activeScenario || !activeScenario.phases) return;

        targetPlaybackSec = activeScenario.target_playback_seconds || 90;

        activeScenario.phases.forEach(function(p, idx) {
            var startOffset = Infinity;
            var endOffset = 0;
            (p.events || []).forEach(function(evt) {
                if (typeof evt._time_offset === 'number') {
                    if (evt._time_offset < startOffset) startOffset = evt._time_offset;
                    if (evt._time_offset > endOffset) endOffset = evt._time_offset;
                }
            });
            if (startOffset === Infinity) startOffset = 0;
            if (endOffset > maxOffset) maxOffset = endOffset;

            phasePresentationCache.push({
                index: idx,
                id: p.id,
                label: p.label,
                transitionText: p.transition_text,
                startOffset: startOffset,
                endOffset: endOffset
            });
        });

        // Ensure end-of-prev <= start-of-next gaps are owned by the next phase
        // by sorting on startOffset (defensive - they should already be in order).
        phasePresentationCache.sort(function(a, b) { return a.startOffset - b.startOffset; });

        // Recompute simulated-seconds-per-real-second
        if (targetPlaybackSec > 0 && maxOffset > 0) {
            simulatedSecPerRealSec = maxOffset / targetPlaybackSec;
        } else {
            simulatedSecPerRealSec = 1;
        }
    }

    function findPhaseAtOffset(offsetSec) {
        if (!phasePresentationCache || phasePresentationCache.length === 0) return -1;
        // A phase "owns" the playhead if startOffset <= offsetSec.
        // Walk from the end so the latest matching phase wins.
        for (var i = phasePresentationCache.length - 1; i >= 0; i--) {
            if (offsetSec >= phasePresentationCache[i].startOffset) return i;
        }
        // Before the first phase
        return 0;
    }

    // ========================================================================
    // ES DATA MODEL INTEGRATION
    // ========================================================================

    function tryESData(callback) {
        // App index search runs unconditionally (no data model dependency)
        var appSearch = new SearchManager({
            id: 'blast-app-search',
            search: '| search index=sa_attack_sim sourcetype="attack_sim:events" | stats count by host, src_user, dest, protocol',
            earliest_time: '-24h@h',
            latest_time: 'now',
            preview: false,
            autostart: true
        });

        var esResolved = false;
        var appResolved = false;
        var gotData = false;

        // v1.8.0 — guarantee the callback fires exactly once. Previously, if a
        // search reported resultCount>0 (gotData=true) but its results 'data'
        // event never delivered (a known MVC race, e.g. a non-accelerated
        // datamodel that counts but yields no grouped rows), the callback hung
        // forever and the topology never initialized. done() + the hard
        // fallback timeout below make the demo scenario always load.
        var calledBack = false;
        function done(result) {
            if (calledBack) return;
            calledBack = true;
            callback(result);
        }

        function checkDone() {
            if (gotData) return;
            if (esResolved && appResolved) {
                // Neither search returned data - use demo
                done(null);
            }
        }

        // ES data model search - guarded by existence check to avoid XML parse errors
        var checkSM = new SearchManager({
            id: 'blast_dm_check_' + Date.now(),
            search: '| datamodel "Network_Traffic" | head 1',
            earliest_time: '-1m',
            latest_time: 'now',
            autostart: true
        });

        checkSM.on('search:done', function() {
            // Data model exists - safe to create ES search
            var esSearch = new SearchManager({
                id: 'blast-es-search',
                search: '| from datamodel:"Network_Traffic"."All_Traffic" | stats count by src, dest, transport | head 200',
                earliest_time: '-24h@h',
                latest_time: 'now',
                preview: false,
                autostart: true
            });

            esSearch.on('search:done', function(properties) {
                if (gotData) return;
                var resultCount = properties.content.resultCount || 0;
                if (resultCount > 0) {
                    gotData = true;
                    var results = esSearch.data('results', { count: 200 });
                    results.on('data', function() {
                        var rows = results.data().rows;
                        var fields = results.data().fields;
                        done(buildFromESResults(rows, fields, 'es'));
                    });
                } else {
                    esResolved = true;
                    checkDone();
                }
            });

            esSearch.on('search:error', function() {
                esResolved = true;
                checkDone();
            });

            esSearch.on('search:failed', function() {
                esResolved = true;
                checkDone();
            });
        });

        checkSM.on('search:error search:failed', function() {
            // ES not installed - skip ES search
            esResolved = true;
            checkDone();
        });

        setTimeout(function() {
            try { checkSM.dispose(); } catch(e) {}
            if (!esResolved) {
                esResolved = true;
                checkDone();
            }
        }, 2500);

        // App index search handlers (run unconditionally)
        appSearch.on('search:done', function(properties) {
            if (gotData) return;
            var resultCount = properties.content.resultCount || 0;
            if (resultCount > 0) {
                gotData = true;
                var results = appSearch.data('results', { count: 200 });
                results.on('data', function() {
                    var rows = results.data().rows;
                    var fields = results.data().fields;
                    done(buildFromESResults(rows, fields, 'app'));
                });
            } else {
                appResolved = true;
                checkDone();
            }
        });

        appSearch.on('search:error', function() {
            appResolved = true;
            checkDone();
        });

        appSearch.on('search:failed', function() {
            appResolved = true;
            checkDone();
        });

        // Timeout after 3 seconds
        setTimeout(function() {
            if (!gotData) {
                esResolved = true;
                appResolved = true;
                checkDone();
            }
        }, 3000);

        // v1.8.0 — hard fallback: no matter what (including the gotData-but-no-
        // data-event hang), fall back to the demo scenario so the topology
        // always initializes within 6s.
        setTimeout(function() { done(null); }, 6000);
    }

    function buildFromESResults(rows, fields, source) {
        var nodeMap = {};
        var edgeList = [];
        var srcIdx, destIdx, protoIdx, countIdx;

        if (source === 'es') {
            srcIdx = fields.indexOf('src');
            destIdx = fields.indexOf('dest');
            protoIdx = fields.indexOf('transport');
            countIdx = fields.indexOf('count');
        } else {
            srcIdx = fields.indexOf('host') !== -1 ? fields.indexOf('host') : fields.indexOf('src_user');
            destIdx = fields.indexOf('dest');
            protoIdx = fields.indexOf('protocol');
            countIdx = fields.indexOf('count');
        }

        if (srcIdx < 0 || destIdx < 0) return null;

        rows.forEach(function(row) {
            var src = row[srcIdx];
            var dest = row[destIdx];
            var proto = (protoIdx >= 0 ? row[protoIdx] : 'unknown').toLowerCase();
            var count = countIdx >= 0 ? parseInt(row[countIdx], 10) : 1;

            // Map transport names to our protocol keys
            if (proto === 'tcp' || proto === 'https' || proto === 'http') proto = 'http';
            else if (proto === 'udp') proto = 'dns';
            if (!protocolColors[proto]) proto = 'unknown';

            if (!nodeMap[src]) {
                nodeMap[src] = { id: src, label: src, type: guessNodeType(src), risk: 20, ip: src, os: 'Unknown', user: '--', notables: 0, connectionCount: 0 };
            }
            if (!nodeMap[dest]) {
                nodeMap[dest] = { id: dest, label: dest, type: guessNodeType(dest), risk: 20, ip: dest, os: 'Unknown', user: '--', notables: 0, connectionCount: 0 };
            }

            nodeMap[src].connectionCount += count;
            nodeMap[dest].connectionCount += count;

            edgeList.push({ source: src, target: dest, protocol: proto, label: proto.toUpperCase() + ' (' + count + ')', count: count });
        });

        // Assign risk scores based on connection volume
        var maxConns = 1;
        Object.keys(nodeMap).forEach(function(k) {
            maxConns = Math.max(maxConns, nodeMap[k].connectionCount);
        });
        Object.keys(nodeMap).forEach(function(k) {
            nodeMap[k].risk = Math.min(100, Math.round((nodeMap[k].connectionCount / maxConns) * 80) + 20);
        });

        var liveNodes = [];
        Object.keys(nodeMap).forEach(function(k) { liveNodes.push(nodeMap[k]); });

        // Build a single timeline step with all data
        var timeline = [{
            time: new Date(),
            label: 'Live Data - ' + liveNodes.length + ' hosts, ' + edgeList.length + ' connections',
            description: 'Data from ' + (source === 'es' ? 'Enterprise Security Network_Traffic data model' : 'SA-Attack-Simulator index'),
            addNodes: liveNodes.map(function(n) { return n.id; }),
            addEdges: edgeList,
            _time_offset: 0,
            phaseIndex: -1
        }];

        return { nodes: liveNodes, timeline: timeline };
    }

    function guessNodeType(name) {
        var n = name.toLowerCase();
        if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(n)) {
            if (/dc|domain/.test(n)) return 'domain_controller';
            if (/srv|server/.test(n)) return 'server';
            return 'workstation';
        }
        if (/\d+\.\d+\.\d+\.\d+/.test(n)) return 'external';
        if (/dc|domain/.test(n)) return 'domain_controller';
        if (/srv|server/.test(n)) return 'server';
        return 'workstation';
    }

    // ========================================================================
    // DEMO SCENARIO DATA
    // A realistic attack chain: phishing -> credential theft -> lateral movement
    // -> domain controller compromise -> data exfiltration
    // ========================================================================
    // NB - the original visualization used the hard-coded timeline below.
    // Phase 5 layers a more accurate per-event playhead on top of it; the
    // timeline events are still the "blocks" the UI advances through, but
    // the time-display (T5.2) and transition banner (T5.3) are driven off
    // the streamer's full event list. The "addNodes / addEdges" timeline
    // events also carry a _time_offset and phaseIndex so the playhead can
    // step them at the right moment.

    function generateDemoScenario() {
        if (cachedDemoScenario && cachedDemoScenario.__sid === activeScenarioId) return cachedDemoScenario;

        var scn = (activeScenarioId && typeof DemoStreamer.getScenario === 'function') ? DemoStreamer.getScenario(activeScenarioId) : null;
        if (!scn || !scn.phases) {
            cachedDemoScenario = { nodes: [], timeline: [], __sid: activeScenarioId };
            return cachedDemoScenario;
        }

        var hostRiskMap = {};
        var hostMetaMap = {};
        var allEdges = [];
        var timeline = [];
        var seenHosts = {};

        scn.phases.forEach(function(phase, phaseIdx) {
            var phaseAddNodes = [];
            var phaseAddEdges = [];
            var phaseFirstEvent = phase.events && phase.events[0];
            var phaseOffset = phaseFirstEvent ? phaseFirstEvent._time_offset : 0;

            (phase.events || []).forEach(function(evt) {
                var hostId = evt.host || evt.orig_host;
                if (hostId && !seenHosts[hostId]) {
                    seenHosts[hostId] = true;
                    phaseAddNodes.push(hostId);
                    // capture metadata for the node when first seen
                    hostMetaMap[hostId] = {
                        id: hostId,
                        label: hostId,
                        type: guessNodeType(hostId),
                        risk: evt.risk_score || 30,
                        ip: evt.src_ip || evt.dest_ip || hostId,
                        os: hostId.indexOf('WS-') === 0 ? 'Windows 11' : (hostId.indexOf('SRV-') === 0 ? 'Windows Server' : (hostId.indexOf('DC') === 0 ? 'Windows Server (DC)' : 'Unknown')),
                        user: evt.src_user || evt.user || '--',
                        notables: 0
                    };
                }
                if (hostId) {
                    // update max risk seen for this host
                    hostRiskMap[hostId] = Math.max(hostRiskMap[hostId] || 0, evt.risk_score || 0);
                    if ((evt.risk_score || 0) >= 70) hostMetaMap[hostId].notables = (hostMetaMap[hostId].notables || 0) + 1;
                }

                // Build edges from network events (have dest_ip distinct from host)
                if (evt.dest_ip && hostId && evt.dest_ip !== hostId) {
                    var destId = evt.dest_ip;
                    // If destination IP looks external (public), tag as EXT-*
                    if (!/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(destId)) {
                        destId = 'EXT-' + destId;
                    }
                    if (!seenHosts[destId]) {
                        seenHosts[destId] = true;
                        phaseAddNodes.push(destId);
                        hostMetaMap[destId] = {
                            id: destId, label: destId.replace(/^EXT-/, ''),
                            type: destId.indexOf('EXT-') === 0 ? 'external' : guessNodeType(destId),
                            risk: evt.risk_score || 50,
                            ip: evt.dest_ip, os: 'Unknown', user: '--', notables: 0
                        };
                    }
                    var protocol = 'unknown';
                    var port = evt.dest_port;
                    if (port == 3389) protocol = 'rdp';
                    else if (port == 445) protocol = 'smb';
                    else if (port == 22) protocol = 'ssh';
                    else if (port == 88 || port == 464) protocol = 'kerberos';
                    else if (port == 80 || port == 443) protocol = 'http';
                    else if (port == 53) protocol = 'dns';
                    else if (port == 3306 || port == 1433 || port == 5432) protocol = 'http';
                    var edgeLabel = evt.mitre_technique ? evt.mitre_technique : (protocol.toUpperCase());
                    phaseAddEdges.push({
                        source: hostId,
                        target: destId,
                        protocol: protocol,
                        label: edgeLabel
                    });
                }
            });

            // One timeline step per phase (consolidates that phase's events visually)
            timeline.push({
                time: new Date(),
                label: 'Phase ' + (phaseIdx + 1) + ': ' + (phase.label || phase.id || ''),
                description: phase.transition_text || phase.label || '',
                addNodes: phaseAddNodes,
                addEdges: phaseAddEdges,
                _time_offset: phaseOffset,
                phaseIndex: phaseIdx
            });
        });

        // Apply final risk maps to node metadata
        Object.keys(hostMetaMap).forEach(function(h) {
            if (hostRiskMap[h]) hostMetaMap[h].risk = Math.min(100, hostRiskMap[h]);
        });
        var nodes = Object.keys(hostMetaMap).map(function(k) { return hostMetaMap[k]; });

        cachedDemoScenario = { nodes: nodes, timeline: timeline, __sid: activeScenarioId };
        return cachedDemoScenario;
    }

    // ========================================================================
    // LIVE MODE SCENARIO BUILDER (v1.5.1)
    // Materializes a {nodes, timeline} object compatible with the DVR engine
    // from real CIM-tagged events. Phase boundaries detected by 5-minute MITRE
    // tactic buckets. No external dependencies (no Splunk_SA_CIM required).
    // ========================================================================

    function clusterEventsByTactic(events) {
        if (!events || !events.length) return [];
        var TACTIC_LABELS = {
            'initial_access': 'Initial Access',
            'execution': 'Execution',
            'persistence': 'Persistence',
            'privilege_escalation': 'Privilege Escalation',
            'defense_evasion': 'Defense Evasion',
            'credential_access': 'Credential Access',
            'discovery': 'Discovery',
            'lateral_movement': 'Lateral Movement',
            'collection': 'Collection',
            'command_and_control': 'Command and Control',
            'c2': 'Command and Control',
            'exfiltration': 'Exfiltration',
            'impact': 'Impact'
        };
        var phases = [];
        var current = null;
        var currentTactic = null;
        events.forEach(function(evt) {
            var t = String(evt.mitre_tactic || 'unknown').toLowerCase().replace(/[\s\-&,]+/g, '_');
            if (t !== currentTactic) {
                if (current && current.events.length) phases.push(current);
                current = {
                    id: 'p_' + phases.length,
                    label: TACTIC_LABELS[t] || (evt.mitre_tactic || 'Activity'),
                    events: [],
                    _time_offset: evt._time_offset || 0
                };
                currentTactic = t;
            }
            current.events.push(evt);
        });
        if (current && current.events.length) phases.push(current);
        return phases;
    }

    function materializeLiveScenario(rows, sid) {
        // rows: array of {_time, host, user, dest, mitre_technique, mitre_tactic, description, risk_score}
        if (!rows || !rows.length) {
            return { nodes: [], timeline: [], __sid: sid, __empty: true };
        }
        rows.sort(function(a, b) { return (a._time || 0) - (b._time || 0); });
        var firstTime = rows[0]._time;
        rows.forEach(function(r) { r._time_offset = (r._time || firstTime) - firstTime; });

        var phases = clusterEventsByTactic(rows);
        var hostMetaMap = {};
        var hostRiskMap = {};
        var timeline = [];
        var seenHosts = {};

        phases.forEach(function(phase, phaseIdx) {
            var phaseAddNodes = [];
            var phaseAddEdges = [];
            phase.events.forEach(function(evt) {
                var hostId = evt.host || evt.orig_host;
                if (hostId && hostId !== '-' && !seenHosts[hostId]) {
                    seenHosts[hostId] = true;
                    phaseAddNodes.push(hostId);
                    hostMetaMap[hostId] = {
                        id: hostId, label: hostId,
                        type: guessNodeType(hostId),
                        risk: Number(evt.risk_score) || 30,
                        ip: hostId, os: 'Unknown',
                        user: evt.user || '--',
                        notables: 0
                    };
                }
                if (hostId && hostMetaMap[hostId]) {
                    var r = Number(evt.risk_score) || 0;
                    hostRiskMap[hostId] = Math.max(hostRiskMap[hostId] || 0, r);
                    if (r >= 70) hostMetaMap[hostId].notables++;
                }
                // edges: src -> dest when both present
                if (evt.dest && evt.dest !== '-' && hostId && evt.dest !== hostId) {
                    var destId = evt.dest;
                    if (!/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(destId)) {
                        destId = 'EXT-' + destId;
                    }
                    if (!seenHosts[destId]) {
                        seenHosts[destId] = true;
                        phaseAddNodes.push(destId);
                        hostMetaMap[destId] = {
                            id: destId, label: destId.replace(/^EXT-/, ''),
                            type: destId.indexOf('EXT-') === 0 ? 'external' : guessNodeType(destId),
                            risk: Number(evt.risk_score) || 50,
                            ip: evt.dest, os: 'Unknown', user: '--', notables: 0
                        };
                    }
                    phaseAddEdges.push({
                        source: hostId,
                        target: destId,
                        protocol: 'http',
                        label: evt.mitre_technique || ''
                    });
                }
            });
            timeline.push({
                time: new Date(),
                label: 'Phase ' + (phaseIdx + 1) + ': ' + phase.label,
                description: phase.label + ' — ' + phase.events.length + ' events',
                addNodes: phaseAddNodes,
                addEdges: phaseAddEdges,
                _time_offset: phase._time_offset,
                phaseIndex: phaseIdx
            });
        });

        Object.keys(hostMetaMap).forEach(function(h) {
            if (hostRiskMap[h]) hostMetaMap[h].risk = Math.min(100, hostRiskMap[h]);
        });
        var nodes = Object.keys(hostMetaMap).map(function(k) { return hostMetaMap[k]; });
        // Flat per-event list (for the host-lane view) — the raw rows already
        // carry host/dest/_time_offset/tactic/technique/risk/description.
        var flatEvents = [];
        phases.forEach(function(p) { (p.events || []).forEach(function(e) { flatEvents.push(e); }); });
        return { nodes: nodes, timeline: timeline, events: flatEvents, __sid: sid, __live: true };
    }

    function generateLiveScenario(entity, earliestEpoch, callback) {
        if (cachedLiveScenario && cachedLiveScenario.__sid === ('live_' + entity)) {
            callback(cachedLiveScenario);
            return;
        }
        if (liveScenarioFetching) return;
        liveScenarioFetching = true;

        var sid = 'live_' + entity;
        var spl = '| `ar_live_top_events("' + entity + '")` | sort _time | head 300 ' +
                  '| eval _time_epoch = if(isnotnull(_time) AND _time != "", strptime(_time,"%Y-%m-%d %H:%M:%S"), null()) ' +
                  '| eval _time_epoch = coalesce(_time_epoch, _time)';

        var sm = new SearchManager({
            id: 'ar-live-replay-' + Date.now(),
            search: spl,
            earliest_time: '-7d@d',
            latest_time: 'now',
            preview: false,
            autostart: true,
            cancelOnUnload: true
        });

        var finished = false;
        function finish(rows) {
            if (finished) return;
            finished = true;
            liveScenarioFetching = false;
            try { sm.dispose(); } catch(e) {}
            cachedLiveScenario = materializeLiveScenario(rows || [], sid);
            callback(cachedLiveScenario);
        }

        sm.on('search:done', function() {
            sm.data('results', { count: 300 }).on('data', function(results) {
                if (finished) return;
                var raw = results.data();
                // raw is column-major; normalize to row array
                var rows = [];
                if (raw && raw.fields && raw.rows) {
                    raw.rows.forEach(function(r) {
                        var row = {};
                        raw.fields.forEach(function(f, i) { row[f] = r[i]; });
                        // Normalize _time
                        var t = row._time_epoch || row._time;
                        if (typeof t === 'string') {
                            var p = Date.parse(t.replace(' ', 'T') + 'Z');
                            if (!isNaN(p)) t = p / 1000;
                        }
                        row._time = Number(t) || 0;
                        rows.push(row);
                    });
                }
                finish(rows);
            });
        });
        sm.on('search:failed', function() { finish([]); });
        sm.on('search:error', function() { finish([]); });
        setTimeout(function() { finish([]); }, 15000); // hard fallback
    }

    function generateScenario(callback) {
        // Mode-aware scenario fetch. Demo is sync, Live is async; both call back.
        if (isDemoMode) {
            callback(generateDemoScenario());
            return;
        }
        var entityTok = (function(){
            try {
                var def = mvc.Components.get('default');
                var sub = mvc.Components.get('submitted');
                var v = sub && sub.get('form.entity'); if (v) return v;
                v = def && def.get('form.entity'); if (v) return v;
            } catch(e) {}
            return '*';
        })();
        generateLiveScenario(entityTok, null, function(scn) {
            callback(scn);
        });
    }

    function invalidateLiveScenarioCache() {
        cachedLiveScenario = null;
    }

    // ========================================================================
    // DEMO MODE BADGE
    // ========================================================================

    function showDemoModeBadge() {
        if (useLanes) return;  // v1.9.2 — the badge clutters the lane top band
        var container = document.getElementById('blast-radius-root');
        if (!container) return;

        var existing = document.getElementById('demo-mode-badge');
        if (existing) return;

        var badge = document.createElement('div');
        badge.id = 'demo-mode-badge';
        badge.style.cssText = 'position:absolute;top:14px;left:50%;transform:translateX(-50%);' +
            'background:rgba(255,140,0,0.15);border:1px solid rgba(255,140,0,0.4);' +
            'color:#ff8c00;padding:6px 18px;border-radius:20px;font-size:11px;' +
            'font-family:"SF Mono","Fira Code",monospace;letter-spacing:1px;z-index:100;' +
            'pointer-events:none;backdrop-filter:blur(4px);' +
            'animation:demo-badge-pulse 3s ease-in-out infinite;';
        badge.textContent = 'DEMO MODE — Connect Enterprise Security for live data';
        container.appendChild(badge);

        // Inject pulse animation if not already present
        if (!document.getElementById('demo-badge-style')) {
            var style = document.createElement('style');
            style.id = 'demo-badge-style';
            style.textContent = '@keyframes demo-badge-pulse{0%,100%{opacity:0.8;}50%{opacity:1;}}';
            document.head.appendChild(style);
        }
    }

    function hideDemoModeBadge() {
        var badge = document.getElementById('demo-mode-badge');
        if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    }

    // ========================================================================
    // EXPORT BUTTON
    // ========================================================================

    function injectExportButton() {
        var controls = document.querySelector('.play-controls');
        if (!controls) return;

        var btn = document.createElement('button');
        btn.className = 'play-btn';
        btn.id = 'br-export';
        btn.title = 'Export as PNG';
        btn.innerHTML = '&#x2B07;';
        btn.style.cssText = 'font-size:14px;';
        controls.appendChild(btn);

        btn.addEventListener('click', exportPNG);
    }

    function exportPNG() {
        var svgEl = document.getElementById('blast-svg');
        if (!svgEl) return;

        var serializer = new XMLSerializer();
        var svgClone = svgEl.cloneNode(true);

        // Set explicit dimensions
        svgClone.setAttribute('width', width);
        svgClone.setAttribute('height', height);

        // Add background
        var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', '#0a0a1a');
        svgClone.insertBefore(bgRect, svgClone.firstChild);

        var svgString = serializer.serializeToString(svgClone);
        var svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(svgBlob);

        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = width * 2;  // 2x for retina
            canvas.height = height * 2;
            var ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            canvas.toBlob(function(blob) {
                var a = document.createElement('a');
                a.download = 'blast-radius-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
                a.href = URL.createObjectURL(blob);
                a.click();
                setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
            }, 'image/png');
        };
        img.src = url;
    }

    // ========================================================================
    // SVG / D3-LIKE RENDERING (pure JS, no D3 dependency)
    // ========================================================================

    function initSVG() {
        var container = document.getElementById('blast-radius-root');
        width = container.offsetWidth;
        height = container.offsetHeight;

        svg = document.getElementById('blast-svg');
        viewBox = { x: 0, y: 0, w: width, h: height };
        svg.setAttribute('viewBox', viewBox.x + ' ' + viewBox.y + ' ' + viewBox.w + ' ' + viewBox.h);
        svg.innerHTML = '';

        // Defs for glow filter and arrow markers
        var defs = createSVGElement('defs');

        // Glow filter
        var filter = createSVGElement('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        var blur = createSVGElement('feGaussianBlur', { stdDeviation: '3', result: 'coloredBlur' });
        var merge = createSVGElement('feMerge');
        merge.appendChild(createSVGElement('feMergeNode', { in: 'coloredBlur' }));
        merge.appendChild(createSVGElement('feMergeNode', { in: 'SourceGraphic' }));
        filter.appendChild(blur);
        filter.appendChild(merge);
        defs.appendChild(filter);

        // Intense glow filter
        var filter2 = createSVGElement('filter', { id: 'glow-intense', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        var blur2 = createSVGElement('feGaussianBlur', { stdDeviation: '6', result: 'coloredBlur' });
        var merge2 = createSVGElement('feMerge');
        merge2.appendChild(createSVGElement('feMergeNode', { in: 'coloredBlur' }));
        merge2.appendChild(createSVGElement('feMergeNode', { in: 'SourceGraphic' }));
        filter2.appendChild(blur2);
        filter2.appendChild(merge2);
        defs.appendChild(filter2);

        // Arrow markers for each protocol
        Object.keys(protocolColors).forEach(function(proto) {
            var marker = createSVGElement('marker', {
                id: 'arrow-' + proto,
                viewBox: '0 0 10 6',
                refX: '10', refY: '3',
                markerWidth: '10', markerHeight: '6',
                orient: 'auto-start-reverse',
                fill: protocolColors[proto]
            });
            marker.appendChild(createSVGElement('path', { d: 'M0,0 L10,3 L0,6 Z' }));
            defs.appendChild(marker);
        });

        svg.appendChild(defs);

        // Layer groups
        g = {
            edges: createSVGElement('g', { class: 'edges-layer' }),
            particles: createSVGElement('g', { class: 'particles-layer' }),
            nodes: createSVGElement('g', { class: 'nodes-layer' }),
            labels: createSVGElement('g', { class: 'labels-layer' })
        };
        svg.appendChild(g.edges);
        svg.appendChild(g.particles);
        svg.appendChild(g.nodes);
        svg.appendChild(g.labels);

        // Zoom/pan handlers on the SVG
        initZoomPan();
    }

    function createSVGElement(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        if (attrs) {
            Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
        }
        return el;
    }

    // ========================================================================
    // ZOOM & PAN
    // ========================================================================

    // v1.9.5 — fullscreen the whole viz container (lanes + controls + scrubber).
    function toggleVizFullscreen() {
        var root = document.getElementById('blast-radius-root');
        if (!root) return;
        var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        try {
            if (fsEl) {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            } else {
                (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
            }
        } catch (e) {
            if (laneCtl && typeof laneCtl.resetView === 'function') laneCtl.resetView(); // graceful fallback
        }
    }

    function fitToView() {
        if (useLanes) {
            // v1.9.4 — reset the lane view's pan/zoom (the ⛶ button was a no-op in
            // lane mode; only double-click reset the viewBox before this).
            if (laneCtl && typeof laneCtl.resetView === 'function') laneCtl.resetView();
            return;
        }
        zoomLevel = 1;
        viewBox.x = 0;
        viewBox.y = 0;
        viewBox.w = width;
        viewBox.h = height;
        applyViewBox();
    }

    function initZoomPan() {
        svg.addEventListener('wheel', function(e) {
            if (!(e.ctrlKey || e.metaKey)) {
                return;
            }
            e.preventDefault();
            var delta = e.deltaY > 0 ? 1.1 : 0.9;
            var newZoom = zoomLevel * delta;
            if (newZoom < 0.2 || newZoom > 5) return;
            zoomLevel = newZoom;

            // Zoom toward mouse position
            var rect = svg.getBoundingClientRect();
            var mx = (e.clientX - rect.left) / rect.width;
            var my = (e.clientY - rect.top) / rect.height;

            var newW = width * zoomLevel;
            var newH = height * zoomLevel;
            var dw = newW - viewBox.w;
            var dh = newH - viewBox.h;

            viewBox.x -= dw * mx;
            viewBox.y -= dh * my;
            viewBox.w = newW;
            viewBox.h = newH;

            applyViewBox();
        }, { passive: false });

        svg.addEventListener('mousedown', function(e) {
            // Only pan if clicking on background (svg itself or a layer group), not on a node
            if (e.target === svg || e.target.tagName === 'svg' ||
                (e.target.parentNode && e.target.parentNode === svg)) {
                isPanning = true;
                panStart.x = e.clientX;
                panStart.y = e.clientY;
                panViewBoxStart.x = viewBox.x;
                panViewBoxStart.y = viewBox.y;
                svg.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', function(e) {
            if (!isPanning) return;
            var rect = svg.getBoundingClientRect();
            var scaleX = viewBox.w / rect.width;
            var scaleY = viewBox.h / rect.height;
            viewBox.x = panViewBoxStart.x - (e.clientX - panStart.x) * scaleX;
            viewBox.y = panViewBoxStart.y - (e.clientY - panStart.y) * scaleY;
            applyViewBox();
        });

        document.addEventListener('mouseup', function() {
            if (isPanning) {
                isPanning = false;
                svg.style.cursor = '';
            }
        });
    }

    function applyViewBox() {
        svg.setAttribute('viewBox',
            viewBox.x.toFixed(1) + ' ' + viewBox.y.toFixed(1) + ' ' +
            viewBox.w.toFixed(1) + ' ' + viewBox.h.toFixed(1));
    }

    // ========================================================================
    // WINDOW RESIZE HANDLER
    // ========================================================================

    var resizeTimeout = null;

    function handleResize() {
        if (useLanes) return;  // lane view scales responsively via preserveAspectRatio
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            var container = document.getElementById('blast-radius-root');
            if (!container) return;
            var oldW = width;
            var oldH = height;
            width = container.offsetWidth;
            height = container.offsetHeight;

            // Scale the viewBox proportionally. Guard against a 0 prior size
            // (container hidden on first layout) which would yield NaN/Infinity
            // and blank the topology.
            var scaleX = (oldW > 0) ? width / oldW : 1;
            var scaleY = (oldH > 0) ? height / oldH : 1;
            viewBox.x *= scaleX;
            viewBox.y *= scaleY;
            viewBox.w *= scaleX;
            viewBox.h *= scaleY;
            applyViewBox();

            // Reposition force nodes proportionally
            forceNodes.forEach(function(fn) {
                fn.x *= scaleX;
                fn.y *= scaleY;
            });
        }, 250);
    }

    window.addEventListener('resize', handleResize);

    // ========================================================================
    // SIMPLE FORCE SIMULATION (no D3 required)
    // ========================================================================

    var forceNodes = [];
    var forceEdges = [];
    var forceAlpha = 1.0;   // v1.8.0 — cooling factor: decays the layout to rest, re-energized on add
    var animFrame = null;

    function initForceLayout() {
        forceNodes = [];
        forceEdges = [];
        forceAlpha = 1.0;
    }

    function addForceNode(nodeData) {
        var existing = forceNodes.find(function(n) { return n.id === nodeData.id; });
        if (existing) return existing;

        var angle = Math.random() * Math.PI * 2;
        var dist = 50 + Math.random() * 100;
        var cx = width / 2;
        var cy = height / 2 - 40;

        // Position external nodes at edges
        if (nodeData.type === 'external') {
            cx = nodeData.id === 'EXT-C2' ? width * 0.15 : width * 0.85;
            cy = height * 0.2;
            dist = 10;
        } else if (nodeData.type === 'domain_controller') {
            cx = width * 0.5;
            cy = height * 0.3;
            dist = 10;
        }

        var fn = {
            id: nodeData.id,
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: 0, vy: 0,
            data: nodeData,
            radius: riskConfig[getRiskLevel(nodeData.risk)].minRadius,
            fixed: false
        };
        forceNodes.push(fn);
        forceAlpha = 1.0;   // re-energize the layout so the new node settles in
        return fn;
    }

    function addForceEdge(edgeData) {
        var existing = forceEdges.find(function(e) {
            return e.source === edgeData.source && e.target === edgeData.target && e.protocol === edgeData.protocol;
        });
        if (existing) return;
        forceEdges.push(edgeData);
        forceAlpha = 1.0;   // re-energize so the new edge pulls its endpoints into place
    }

    function tickForce() {
        var alpha = 0.3 * forceAlpha;
        var repulsion = 8000;
        var attraction = 0.005;
        var centerForce = 0.01;
        var damping = 0.85;
        var cx = width / 2;
        var cy = (height / 2) - 40;

        // Repulsion between all nodes
        for (var i = 0; i < forceNodes.length; i++) {
            for (var j = i + 1; j < forceNodes.length; j++) {
                var dx = forceNodes[i].x - forceNodes[j].x;
                var dy = forceNodes[i].y - forceNodes[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                var force = repulsion / (dist * dist);
                var fx = (dx / dist) * force;
                var fy = (dy / dist) * force;
                forceNodes[i].vx += fx * alpha;
                forceNodes[i].vy += fy * alpha;
                forceNodes[j].vx -= fx * alpha;
                forceNodes[j].vy -= fy * alpha;
            }
        }

        // Attraction along edges
        forceEdges.forEach(function(e) {
            var src = forceNodes.find(function(n) { return n.id === e.source; });
            var tgt = forceNodes.find(function(n) { return n.id === e.target; });
            if (!src || !tgt) return;
            var dx = tgt.x - src.x;
            var dy = tgt.y - src.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var idealDist = 160;
            var force = (dist - idealDist) * attraction * forceAlpha;
            src.vx += (dx / dist) * force;
            src.vy += (dy / dist) * force;
            tgt.vx -= (dx / dist) * force;
            tgt.vy -= (dy / dist) * force;
        });

        // Center gravity
        forceNodes.forEach(function(n) {
            n.vx += (cx - n.x) * centerForce * forceAlpha;
            n.vy += (cy - n.y) * centerForce * forceAlpha;
        });

        // Update positions
        forceNodes.forEach(function(n) {
            if (n.fixed) return;
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
            // Keep in bounds
            n.x = Math.max(60, Math.min(width - 60, n.x));
            n.y = Math.max(60, Math.min(height - 120, n.y));
        });

        // Cool the layout toward rest. New nodes/edges/seeks reset this to 1.0.
        forceAlpha = Math.max(0, forceAlpha * 0.98);
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    var renderedNodes = {};
    var renderedEdges = {};
    var particleSystems = [];
    var _attackStep = 0;            // v1.9.1 — running attack-chain hop counter
    var _currentStepBadge = null;   // the "now" step badge (gets the pulse)
    var laneCtl = null;             // v1.9.2 — host-swimlane view controller
    var useLanes = true;            // lanes are the primary visual (vs force graph)
    var currentLiveEvents = [];     // flat per-event list for live mode lanes

    var _redAlertTimer = null;
    function _fireRedAlert() {
        var root = document.getElementById('blast-radius-root');
        if (!root) return;
        root.classList.remove('br-red-alert-active');
        void root.offsetWidth; // force reflow so the animation retriggers
        root.classList.add('br-red-alert-active');
        clearTimeout(_redAlertTimer);
        _redAlertTimer = setTimeout(function() {
            if (root) root.classList.remove('br-red-alert-active');
        }, 2100);
    }

    function renderNode(nodeData, animate) {
        if (renderedNodes[nodeData.id]) return;

        var fn = addForceNode(nodeData);
        var risk = getRiskLevel(nodeData.risk);
        var cfg = riskConfig[risk];
        var nodeGroup = createSVGElement('g', {
            class: 'blast-node',
            'data-id': nodeData.id,
            transform: 'translate(' + fn.x + ',' + fn.y + ')'
        });

        // Outer glow ring
        var glowRing = createSVGElement('circle', {
            r: cfg.minRadius + 12,
            fill: 'none',
            stroke: cfg.color,
            'stroke-width': '1',
            opacity: '0.2',
            class: 'risk-ring'
        });

        // Main circle
        var circle = createSVGElement('circle', {
            r: animate ? 0 : cfg.minRadius,
            fill: cfg.color,
            'fill-opacity': '0.15',
            stroke: cfg.color,
            'stroke-width': '2',
            filter: 'url(#glow)'
        });

        // Inner dot
        var dot = createSVGElement('circle', {
            r: 3,
            fill: cfg.color,
            filter: 'url(#glow-intense)'
        });

        // Icon based on type
        var icon = '';
        if (nodeData.type === 'domain_controller') icon = 'DC';
        else if (nodeData.type === 'server') icon = 'SRV';
        else if (nodeData.type === 'workstation') icon = 'WS';
        else if (nodeData.type === 'external') icon = 'EXT';

        var iconText = createSVGElement('text', {
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            fill: cfg.color,
            'font-size': '8px',
            'font-family': '"SF Mono", "Fira Code", monospace',
            'font-weight': 'bold',
            opacity: '0.8',
            dy: '-1'
        });
        iconText.textContent = icon;

        // Label — dark halo (paint-order:stroke) keeps it readable over edges,
        // other labels, and node glow even in a dense blast radius.
        var label = createSVGElement('text', {
            'text-anchor': 'middle',
            fill: '#f2f2ff',
            'font-size': '11px',
            'font-weight': 'bold',
            'font-family': '"SF Mono", "Fira Code", monospace',
            stroke: '#08081a',
            'stroke-width': '3.5',
            'stroke-linejoin': 'round',
            'paint-order': 'stroke',
            dy: cfg.minRadius + 19
        });
        label.textContent = nodeData.label;

        nodeGroup.appendChild(glowRing);
        nodeGroup.appendChild(circle);
        nodeGroup.appendChild(dot);
        nodeGroup.appendChild(iconText);
        nodeGroup.appendChild(label);
        g.nodes.appendChild(nodeGroup);

        // Animate entrance
        if (animate) {
            animateAttribute(circle, 'r', 0, cfg.minRadius, 600, 'easeOutElastic');
            nodeGroup.style.opacity = '0';
            fadeIn(nodeGroup, 400);

            // Flash effect
            var flash = createSVGElement('circle', {
                r: cfg.minRadius,
                fill: cfg.color,
                opacity: '0.8',
                filter: 'url(#glow-intense)'
            });
            nodeGroup.insertBefore(flash, circle);
            animateAttribute(flash, 'r', cfg.minRadius, cfg.minRadius + 40, 800, 'easeOut');
            animateAttribute(flash, 'opacity', 0.8, 0, 800, 'easeOut', function() {
                if (flash.parentNode) flash.parentNode.removeChild(flash);
            });
        }

        // v1.8.0 — Critical-event "Red Alert": pulse the canvas crimson when a
        // node with risk >= 95 (LSASS dump, DCSync, Golden Ticket) first lands.
        if (animate && nodeData.risk >= 95) {
            _fireRedAlert();
        }

        // Click handler for tooltip + drilldown
        nodeGroup.addEventListener('click', function(e) {
            e.stopPropagation();
            showTooltip(nodeData, e);
        });

        // Drag support
        enableDrag(nodeGroup, fn);

        renderedNodes[nodeData.id] = { group: nodeGroup, forceNode: fn, data: nodeData };
    }

    function renderEdge(edgeData, animate) {
        var key = edgeData.source + '->' + edgeData.target + ':' + edgeData.protocol;
        if (renderedEdges[key]) return;

        addForceEdge(edgeData);

        var srcNode = forceNodes.find(function(n) { return n.id === edgeData.source; });
        var tgtNode = forceNodes.find(function(n) { return n.id === edgeData.target; });
        if (!srcNode || !tgtNode) return;

        var color = protocolColors[edgeData.protocol] || protocolColors.unknown;

        var line = createSVGElement('line', {
            x1: srcNode.x, y1: srcNode.y,
            x2: tgtNode.x, y2: tgtNode.y,
            stroke: color,
            'stroke-width': edgeData.protocol === 'exfil' ? '3' : '1.5',
            'stroke-dasharray': edgeData.protocol === 'exfil' ? '8 4' : 'none',
            opacity: animate ? '0' : '0.6',
            'marker-end': 'url(#arrow-' + edgeData.protocol + ')',
            class: 'blast-edge protocol-' + edgeData.protocol,
            'data-source': edgeData.source,
            'data-target': edgeData.target
        });

        // Edge label
        var midX = (srcNode.x + tgtNode.x) / 2;
        var midY = (srcNode.y + tgtNode.y) / 2;
        var edgeLabel = createSVGElement('text', {
            x: midX, y: midY - 8,
            'text-anchor': 'middle',
            fill: color,
            'font-size': '9px',
            'font-family': '"SF Mono", "Fira Code", monospace',
            stroke: '#08081a',
            'stroke-width': '3',
            'stroke-linejoin': 'round',
            'paint-order': 'stroke',
            opacity: '0',
            class: 'blast-edge-label',
            'data-protocol': edgeData.protocol
        });
        edgeLabel.textContent = edgeData.label || '';

        g.edges.appendChild(line);
        g.labels.appendChild(edgeLabel);

        if (animate) {
            fadeIn(line, 500, 0.6);
            // Show label briefly then fade
            setTimeout(function() {
                fadeIn(edgeLabel, 300, 0.7);
                setTimeout(function() {
                    animateAttribute(edgeLabel, 'opacity', 0.7, 0.3, 2000, 'easeOut');
                }, 3000);
            }, 600);
        }

        // Create particle system for this edge
        createParticleSystem(edgeData, color);

        // v1.9.1 — sequenced attack-chain badge. Each hop is numbered in attack
        // order so the topology reads as an ordered chain (1 → 2 → 3 …), and the
        // latest step pulses to mark "where the attack is now" as it replays.
        _attackStep++;
        var badge = createSVGElement('g', {
            'class': 'ar-step-badge',
            'data-step': _attackStep,
            transform: 'translate(' + midX.toFixed(1) + ',' + midY.toFixed(1) + ')',
            opacity: animate ? '0' : '1'
        });
        badge.appendChild(createSVGElement('circle', {
            cx: 0, cy: 0, r: 8.5, fill: '#0b0b22', stroke: color,
            'stroke-width': '2', 'class': 'ar-step-dot'
        }));
        var bText = createSVGElement('text', {
            x: 0, y: 3.5, 'text-anchor': 'middle', fill: '#ffffff',
            'font-size': '10px', 'font-weight': 'bold',
            'font-family': '"SF Mono","Fira Code",monospace', 'class': 'ar-step-num'
        });
        bText.textContent = _attackStep;
        badge.appendChild(bText);
        g.labels.appendChild(badge);

        // Move the pulsing "now" marker from the previous hop to this one.
        if (_currentStepBadge) _currentStepBadge.classList.remove('ar-step-current');
        badge.classList.add('ar-step-current');
        _currentStepBadge = badge;
        if (animate) fadeIn(badge, 500, 1);

        renderedEdges[key] = { line: line, label: edgeLabel, data: edgeData, badge: badge };
    }

    // ========================================================================
    // PARTICLE ANIMATION (flowing dots along edges)
    // ========================================================================

    function createParticleSystem(edgeData, color) {
        particleSystems.push({
            source: edgeData.source,
            target: edgeData.target,
            color: color,
            particles: [],
            spawnTimer: 0,
            spawnRate: edgeData.protocol === 'exfil' ? 8 : 30 // faster particles for exfil
        });
    }

    function updateParticles() {
        particleSystems.forEach(function(ps) {
            var srcNode = forceNodes.find(function(n) { return n.id === ps.source; });
            var tgtNode = forceNodes.find(function(n) { return n.id === ps.target; });
            if (!srcNode || !tgtNode) return;

            ps.spawnTimer++;
            if (ps.spawnTimer >= ps.spawnRate) {
                ps.spawnTimer = 0;
                var particle = createSVGElement('circle', {
                    r: '2',
                    fill: ps.color,
                    filter: 'url(#glow)',
                    opacity: '0.9'
                });
                g.particles.appendChild(particle);
                ps.particles.push({ el: particle, t: 0 });
            }

            ps.particles = ps.particles.filter(function(p) {
                p.t += 0.015;
                if (p.t >= 1) {
                    if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
                    return false;
                }
                var x = srcNode.x + (tgtNode.x - srcNode.x) * p.t;
                var y = srcNode.y + (tgtNode.y - srcNode.y) * p.t;
                p.el.setAttribute('cx', x);
                p.el.setAttribute('cy', y);
                p.el.setAttribute('opacity', p.t < 0.1 ? p.t * 9 : (p.t > 0.9 ? (1 - p.t) * 9 : 0.9));
                return true;
            });
        });
    }

    // ========================================================================
    // ANIMATION UTILITIES
    // ========================================================================

    function animateAttribute(el, attr, from, to, duration, easing, callback) {
        var start = performance.now();
        function tick(now) {
            var t = Math.min(1, (now - start) / duration);
            var et = t;
            if (easing === 'easeOut') et = 1 - Math.pow(1 - t, 3);
            else if (easing === 'easeOutElastic') {
                if (t === 1) et = 1;
                else et = Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
            }
            el.setAttribute(attr, from + (to - from) * et);
            if (t < 1) requestAnimationFrame(tick);
            else if (callback) callback();
        }
        requestAnimationFrame(tick);
    }

    function fadeIn(el, duration, targetOpacity) {
        targetOpacity = targetOpacity || 1;
        el.style.opacity = '0';
        var start = performance.now();
        function tick(now) {
            var t = Math.min(1, (now - start) / duration);
            el.style.opacity = String(t * targetOpacity);
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function enableDrag(el, forceNode) {
        var dragging = false;
        var offsetX, offsetY;

        el.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return; // left button only
            dragging = true;
            forceNode.fixed = true;
            offsetX = e.clientX;
            offsetY = e.clientY;
            e.preventDefault();
            e.stopPropagation(); // prevent pan

            // Remove old document-level listeners before adding new ones
            if (dragMoveHandler) {
                document.removeEventListener('mousemove', dragMoveHandler);
            }
            if (dragUpHandler) {
                document.removeEventListener('mouseup', dragUpHandler);
            }

            dragMoveHandler = function(ev) {
                if (!dragging) return;
                var dx = ev.clientX - offsetX;
                var dy = ev.clientY - offsetY;
                offsetX = ev.clientX;
                offsetY = ev.clientY;

                var rect = svg.getBoundingClientRect();
                var scaleX = viewBox.w / rect.width;
                var scaleY = viewBox.h / rect.height;

                forceNode.x += dx * scaleX;
                forceNode.y += dy * scaleY;
            };

            dragUpHandler = function() {
                if (dragging) {
                    dragging = false;
                    forceNode.fixed = false;
                }
                document.removeEventListener('mousemove', dragMoveHandler);
                document.removeEventListener('mouseup', dragUpHandler);
                dragMoveHandler = null;
                dragUpHandler = null;
            };

            document.addEventListener('mousemove', dragMoveHandler);
            document.addEventListener('mouseup', dragUpHandler);
        });
    }

    // ========================================================================
    // TOOLTIP with Drilldown
    // ========================================================================

    function showTooltip(nodeData, event) {
        var tip = document.getElementById('br-tooltip');
        // Guard: if the tooltip scaffold or node data is missing, bail rather
        // than throw (a thrown error here would kill every subsequent node click).
        if (!tip || !nodeData) return;
        var setText = function(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = (val == null ? '' : val);
        };
        setText('tooltip-name', nodeData.label);
        setText('tooltip-type', (nodeData.type || '').replace('_', ' '));
        setText('tooltip-conns', countConnections(nodeData));
        setText('tooltip-notables', nodeData.notables);

        var riskBadge = document.getElementById('tooltip-risk');
        var level = getRiskLevel(nodeData.risk);
        if (riskBadge) {
            riskBadge.textContent = 'Risk: ' + nodeData.risk + ' (' + level.toUpperCase() + ')';
            riskBadge.className = 'risk-badge risk-' + level;
        }

        // "First Seen" = how far into the attack this node first appeared.
        // The timeline events all carry a synthetic wall-clock time() stamped
        // at generation, so use the scenario-relative _time_offset instead
        // (honest for the compressed-timeline demos) and render it as T+MM:SS.
        var firstEvent = timelineEvents.find(function(e) {
            return e.addNodes.indexOf(nodeData.id) > -1;
        });
        if (firstEvent && typeof firstEvent._time_offset === 'number') {
            var off = Math.max(0, Math.round(firstEvent._time_offset));
            var mm = Math.floor(off / 60), ss = off % 60;
            setText('tooltip-first', 'T+' + mm + ':' + (ss < 10 ? '0' : '') + ss);
        } else {
            setText('tooltip-first', 'Unknown');
        }

        // Drilldown link
        var drilldown = document.getElementById('tooltip-drilldown');
        if (!drilldown) {
            // Create drilldown link inside tooltip
            var drilldownDiv = document.createElement('div');
            drilldownDiv.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #2a2a5a;';
            var link = document.createElement('a');
            link.id = 'tooltip-drilldown';
            link.style.cssText = 'color:#4488ff;font-size:11px;cursor:pointer;text-decoration:none;' +
                'font-family:"SF Mono","Fira Code",monospace;';
            link.textContent = 'Search in Splunk →';
            link.target = '_blank';
            drilldownDiv.appendChild(link);
            tip.appendChild(drilldownDiv);
            drilldown = link;
        }

        var lbl = nodeData.label;
        var searchQuery = 'search index=sa_attack_sim (host="' + lbl + '" OR src="' + lbl + '" OR dest="' + lbl + '" OR src_ip="' + lbl + '" OR dest_ip="' + lbl + '" OR orig_host="' + lbl + '")';
        var encodedSearch = encodeURIComponent(searchQuery);
        // v1.9.1 — drill to the Search & Reporting app, which always ships a
        // 'search' view. SA-attack-replay has no 'search' view, so the old
        // '/app/SA-attack-replay/search' URL 404'd. Derive the locale root
        // (e.g. /en-US) from the current path so the link works under any locale.
        var _localeRoot = window.location.pathname.split('/app/')[0] || '/en-US';
        drilldown.href = _localeRoot + '/app/search/search?q=' + encodedSearch + '&earliest=-24h%40h&latest=now';

        var container = document.getElementById('blast-radius-root');
        if (!container) return;
        var rect = container.getBoundingClientRect();
        tip.style.left = Math.min(event.clientX - rect.left + 10, width - 300) + 'px';
        tip.style.top = Math.min(event.clientY - rect.top + 10, height - 200) + 'px';
        tip.classList.add('visible');
        tip.setAttribute('aria-hidden', 'false');

        if (_activeTipDismiss) {
            document.removeEventListener('click', _activeTipDismiss);
        }
        _activeTipDismiss = function(e) {
            if (e.target === drilldown) return;
            tip.classList.remove('visible');
            tip.setAttribute('aria-hidden', 'true');
            document.removeEventListener('click', _activeTipDismiss);
            _activeTipDismiss = null;
        };
        setTimeout(function() {
            if (_activeTipDismiss) document.addEventListener('click', _activeTipDismiss);
        }, 100);
    }

    function countConnections(nodeData) {
        // A host can appear as a hostname when it's an event source but as an
        // IP when it's a connection target, so match the node by any of its
        // aliases (id / label / ip) rather than id alone.
        var aliases = {};
        if (nodeData == null) return 0;
        if (typeof nodeData === 'string') { aliases[nodeData] = true; }
        else {
            if (nodeData.id) aliases[nodeData.id] = true;
            if (nodeData.label) aliases[nodeData.label] = true;
            if (nodeData.ip) aliases[nodeData.ip] = true;
        }
        return forceEdges.filter(function(e) {
            return aliases[e.source] || aliases[e.target];
        }).length;
    }

    // ========================================================================
    // TIME DISPLAY (T5.2) - two-line presentation with scenario + phase
    // ========================================================================

    function pickIconForPhase(phaseInfo) {
        if (!phaseInfo) return '⚠';
        var t = (phaseInfo.transitionText || phaseInfo.label || '').toLowerCase();
        if (/exfil/.test(t)) return '↗';   // up-right arrow - data leaving
        if (/lateral|move/.test(t)) return '⇄'; // left-right arrow
        if (/credential|cred/.test(t)) return '⧉'; // keys / two circles
        if (/persistence/.test(t)) return '⚓';   // anchor
        if (/initial|access/.test(t)) return '❖'; // diamond
        if (/expansion/.test(t)) return '❂';     // star
        if (/encrypt|impact|ransom/.test(t)) return '⛔'; // no-entry
        if (/discovery|recon/.test(t)) return '◉'; // bullseye
        if (/c2|command/.test(t)) return '⦾';   // signal
        return '⚠'; // warning sign default
    }

    // Format a Date as "HH:MM:SS" or, for multi-day campaigns, "Mon D · HH:MM".
    function formatClock(date, withDate) {
        if (!date) return '';
        if (withDate) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // ========================================================================
    // HOST-SWIMLANE "incident timeline" view (v1.9.2) — the SOC-analyst visual.
    // Normalises the active scenario's per-event data and hands it to ar_lanes.
    // Works for demo (streamer scenario) and live (materialised CIM events).
    // ========================================================================
    function extractLaneEvents() {
        var raw = [];
        var scn = (activeScenarioId && DemoStreamer.getScenario) ? DemoStreamer.getScenario(activeScenarioId) : null;
        if (scn && scn.phases) {
            scn.phases.forEach(function(p) { (p.events || []).forEach(function(e) { raw.push(e); }); });
        } else if (currentLiveEvents && currentLiveEvents.length) {
            raw = currentLiveEvents;
        }
        return raw.map(function(e) {
            var host = e.host || e.orig_host;
            var dest = e.dest || e.dest_ip;
            return {
                host: host,
                dest: (dest && dest !== host) ? dest : null,
                t: e._time_offset || 0,
                tactic: e.mitre_tactic,
                technique: e.mitre_technique,
                risk: Number(e.risk_score) || 0,
                desc: e.description || '',
                sourcetype: e.sourcetype
            };
        }).filter(function(e) { return e.host; });
    }

    function renderLaneView() {
        if (!useLanes || typeof LaneView === 'undefined' || !LaneView) return;
        var svgEl = document.getElementById('blast-svg');
        if (!svgEl) return;
        // v1.9.2 — flag lane mode on the root so CSS can hide/relocate the
        // force-graph overlay chrome (Protocols/Nodes legend, demo badge, the
        // playhead KPI counters) that otherwise collide with the lane content.
        var _root = document.getElementById('blast-radius-root');
        if (_root) _root.classList.add('lanes-mode');
        var events = extractLaneEvents();
        if (laneCtl) { laneCtl.destroy(); laneCtl = null; }
        if (!events.length) return;
        var mt = events.reduce(function(m, e) { return Math.max(m, e.t || 0); }, 0) || maxOffset || 1;
        var multiDay = mt > 86400;
        laneCtl = LaneView.create(svgEl, events, {
            maxT: mt,
            formatTime: function(t) {
                if (scenarioBaseClock) return formatClock(new Date(scenarioBaseClock.getTime() + t * 1000), multiDay);
                return formatClock(new Date(t * 1000), false);
            },
            onPick: function(ev, dotEl) { showLaneTip(ev, dotEl, multiDay); }
        });
        if (laneCtl) laneCtl.setPlayhead(playheadOffset || 0);
    }

    var _laneTipTimer = null;
    // Rich hover/click tooltip for a lane event: what it is + what it did.
    function showLaneTip(ev, dotEl, multiDay) {
        var tip = document.getElementById('ar-lane-tip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'ar-lane-tip';
            document.body.appendChild(tip);
        }
        var risk = ev.risk || 0;
        var lvl = risk >= 85 ? 'critical' : risk >= 70 ? 'high' : risk >= 40 ? 'medium' : 'low';
        var color = (typeof LaneView !== 'undefined' && LaneView.tacticColor) ? LaneView.tacticColor(ev.tactic) : '#8a93ab';
        var when = scenarioBaseClock
            ? formatClock(new Date(scenarioBaseClock.getTime() + (ev.t || 0) * 1000), multiDay)
            : '';
        tip.innerHTML =
            '<button class="lt-close" type="button" aria-label="Close">&times;</button>' +
            '<div class="lt-head" style="border-left-color:' + color + '">' +
                '<span class="lt-tech">' + escapeHtml(ev.technique || '—') + '</span>' +
                '<span class="lt-tac" style="color:' + color + '">' + escapeHtml(ev.tactic || '') + '</span>' +
            '</div>' +
            '<div class="lt-who">' + escapeHtml(ev.host) +
                (ev.dest && ev.dest !== ev.host ? ' <span class="lt-arrow">→</span> ' + escapeHtml(ev.dest) : '') + '</div>' +
            (when ? '<div class="lt-when">⏱ ' + escapeHtml(when) + '</div>' : '') +
            '<div class="lt-desc">' + escapeHtml(ev.desc || '') + '</div>' +
            '<div class="lt-risk lt-' + lvl + '">Risk ' + risk + ' · ' + lvl.toUpperCase() + '</div>';
        var r = dotEl.getBoundingClientRect();
        var tw = 300;
        var left = r.right + 12;
        if (left + tw > window.innerWidth) left = r.left - tw - 12;
        tip.style.left = Math.max(8, left) + 'px';
        tip.style.top = Math.max(8, Math.min(r.top - 6, window.innerHeight - 170)) + 'px';
        tip.classList.add('visible');
        // v1.9.4 — explicit close affordances (the tip used to only auto-hide after
        // 7s with no way to dismiss it): an × button, click-outside, and Esc.
        var closeBtn = tip.querySelector('.lt-close');
        if (closeBtn) closeBtn.onclick = function(e) { e.stopPropagation(); hideLaneTip(); };
        clearTimeout(_laneTipTimer);
        _laneTipTimer = setTimeout(hideLaneTip, 12000);
        if (!_laneTipDismissBound) {
            _laneTipDismissBound = true;
            document.addEventListener('mousedown', function(e) {
                var t = document.getElementById('ar-lane-tip');
                if (!t || !t.classList.contains('visible')) return;
                if (t.contains(e.target)) return; // clicks inside the tip stay
                if (e.target && e.target.classList && e.target.classList.contains('ar-lane-dot')) return; // another dot re-opens
                hideLaneTip();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') hideLaneTip();
            });
        }
    }

    var _laneTipDismissBound = false;
    function hideLaneTip() {
        var tip = document.getElementById('ar-lane-tip');
        if (tip) tip.classList.remove('visible');
        clearTimeout(_laneTipTimer);
    }

    function updateTimeDisplay() {
        var display = document.getElementById('br-time-display');
        if (!display) return;

        // Multi-day scenarios (e.g. the 21-day Stillwater) show dates so each
        // phase's real time is legible; compressed scenarios show clock time.
        var multiDay = maxOffset > 86400;

        var clockText, startText = '';
        if (scenarioBaseClock && playheadOffset >= 0) {
            var d = new Date(scenarioBaseClock.getTime() + (playheadOffset * 1000));
            clockText = formatClock(d, multiDay);
            startText = formatClock(scenarioBaseClock, multiDay);
        } else {
            clockText = 'Ready - Press Play';
        }

        var phaseInfo = currentPhaseIdx >= 0 && phasePresentationCache &&
            phasePresentationCache[currentPhaseIdx];
        var hasPhase = !!(activeScenarioName && phaseInfo);

        if (hasPhase) {
            // When this phase began, in real campaign time, so the analyst can
            // see "what time each phase is in" — especially across a 21-day span.
            var phaseSuffix = '';
            if (scenarioBaseClock) {
                var phaseStart = new Date(scenarioBaseClock.getTime() + (phaseInfo.startOffset * 1000));
                if (multiDay) {
                    var dayNum = Math.floor(phaseInfo.startOffset / 86400) + 1;
                    phaseSuffix = ' <span class="time-phase-at">· Day ' + dayNum +
                        ' · ' + escapeHtml(formatClock(phaseStart, true)) + '</span>';
                } else {
                    phaseSuffix = ' <span class="time-phase-at">· ' +
                        escapeHtml(formatClock(phaseStart, false)) + '</span>';
                }
            }
            display.classList.add('has-scenario');
            display.innerHTML =
                '<span class="time-clock">' + escapeHtml(clockText) + '</span>' +
                '<span class="time-phase">' +
                    escapeHtml(activeScenarioName) +
                    ' — Phase ' + (phaseInfo.index + 1) + ': ' +
                    escapeHtml(phaseInfo.label || phaseInfo.id || '') +
                    phaseSuffix +
                '</span>' +
                (startText ? '<span class="time-start">▶ Campaign start: ' +
                    escapeHtml(startText) + '</span>' : '');
        } else {
            display.classList.remove('has-scenario');
            display.textContent = clockText;
        }
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ========================================================================
    // PHASE-TRANSITION BANNER (T5.3)
    // ========================================================================

    var _bannerTimers = [];

    function clearBannerTimers() {
        _bannerTimers.forEach(function(t) { clearTimeout(t); });
        _bannerTimers = [];
    }

    function fireTransitionBanner(phaseInfo) {
        if (!phaseInfo) return;
        var banner = document.getElementById('br-phase-annotation');
        if (!banner) return;

        var text = phaseInfo.transitionText || (phaseInfo.label || '').toUpperCase();
        if (!text) return;

        var icon = pickIconForPhase(phaseInfo);
        banner.innerHTML = '<span class="phase-icon">' + escapeHtml(icon) + '</span>' +
                           '<span class="phase-text">' + escapeHtml(text) + '</span>';

        // Reset any in-flight transition
        clearBannerTimers();
        banner.classList.remove('fading');
        banner.classList.remove('visible');

        // Force reflow so the transition fires
        void banner.offsetWidth;

        // Fade in (300ms via CSS transition)
        banner.classList.add('visible');

        // Hold for 2500ms, then fade out (500ms)
        _bannerTimers.push(setTimeout(function() {
            banner.classList.add('fading');
            banner.classList.remove('visible');
        }, 2800));

        _bannerTimers.push(setTimeout(function() {
            banner.classList.remove('fading');
            banner.innerHTML = '';
        }, 3400));
    }

    function hideBannerImmediate() {
        clearBannerTimers();
        var banner = document.getElementById('br-phase-annotation');
        if (!banner) return;
        banner.classList.remove('visible', 'fading');
        banner.innerHTML = '';
    }

    // ========================================================================
    // TIMELINE PLAYBACK (legacy block-based steps)
    // ========================================================================

    function applyTimelineStep(index, animate) {
        if (index < 0 || index >= timelineEvents.length) return;

        var event = timelineEvents[index];

        // Use cached scenario nodes for lookup
        var allNodes = isDemoMode ? generateDemoScenario().nodes : scenarioNodes;
        event.addNodes.forEach(function(nodeId) {
            var nodeData = allNodes.find(function(n) { return n.id === nodeId; });
            if (nodeData) {
                if (!useLanes) renderNode(nodeData, animate);  // lanes own the SVG
                activeNodes.add(nodeId);
            }
        });

        // Apply risk updates if present
        if (event.updateRisk) {
            Object.keys(event.updateRisk).forEach(function(nodeId) {
                var rendered = renderedNodes[nodeId];
                if (rendered) {
                    rendered.data.risk = event.updateRisk[nodeId];
                }
            });
        }

        // Add edges (slight delay so nodes appear first)
        setTimeout(function() {
            event.addEdges.forEach(function(edgeData) {
                if (!useLanes) renderEdge(edgeData, animate);  // lanes own the SVG
                activeEdges.add(edgeData.source + '->' + edgeData.target);
            });

            // Update stats
            updateStats();
        }, animate ? 300 : 0);

        // Phase 5: jump the playhead to this event's _time_offset so the
        // time display and banner stay coherent when scrubbing.
        if (typeof event._time_offset === 'number') {
            playheadOffset = event._time_offset;
            // Recompute phase silently (no banner fire on scrub)
            currentPhaseIdx = findPhaseAtOffset(playheadOffset);
            _maybeFireThought(playheadOffset);
        }
        updateTimeDisplay();

        // Update slider
        var progress = ((index + 1) / timelineEvents.length) * 100;
        var sp = document.getElementById('br-slider-progress');
        var sth = document.getElementById('br-slider-thumb');
        if (sp) sp.style.width = progress + '%';
        if (sth) sth.style.left = progress + '%';
        updateSliderAria(progress);

        currentTimeIndex = index;
    }

    // Store scenario nodes for live data mode
    var scenarioNodes = [];

    // ------------------------------------------------------------------------
    // PLAY / PAUSE / REWIND / STEP - now driven by playhead + auto-advance
    // ------------------------------------------------------------------------

    function hideFirstHint() {
        var hint = document.getElementById('br-first-hint');
        if (hint && !hint.classList.contains('br-hint-gone')) {
            hint.classList.add('br-hint-gone');
        }
    }

    // WCAG 4.1.2 — keep the slider's ARIA state in sync with the playhead so
    // screen-reader users hear the replay position change.
    function updateSliderAria(progress) {
        var track = document.getElementById('br-slider-track');
        if (!track) return;
        var pct = Math.max(0, Math.min(100, Math.round(progress)));
        track.setAttribute('aria-valuenow', pct);
        var clk = document.getElementById('br-time-display');
        track.setAttribute('aria-valuetext', pct + '% — ' + (clk ? clk.textContent : ''));
    }

    function play() {
        if (isPlaying) return;
        isPlaying = true;
        var pb = document.getElementById('br-play');
        if (pb) {
            pb.innerHTML = '&#x23F8;';
            pb.classList.add('active');
            pb.setAttribute('aria-label', 'Pause replay');
        }

        // If we're at the end, restart from scratch
        if (currentTimeIndex >= timelineEvents.length - 1 || playheadOffset >= maxOffset) {
            resetVisualization();
            currentTimeIndex = -1;
            playheadOffset = 0;
            currentPhaseIdx = -1;
        }

        // Apply step 0 immediately if we're starting from scratch
        if (currentTimeIndex < 0 && timelineEvents.length > 0) {
            applyTimelineStep(0, true);
        }

        // Start the playhead animation loop
        startPlayheadLoop();
    }

    function pause() {
        isPlaying = false;
        clearTimeout(playInterval);
        if (rafHandle) {
            cancelAnimationFrame(rafHandle);
            rafHandle = null;
        }
        var playBtn = document.getElementById('br-play');
        if (playBtn) {
            playBtn.innerHTML = '&#x25B6;';
            playBtn.classList.remove('active');
            playBtn.setAttribute('aria-label', 'Play replay');
        }
    }

    function rewind() {
        pause();
        resetVisualization();
        currentTimeIndex = 0;
        playheadOffset = 0;
        currentPhaseIdx = -1;
        hideBannerImmediate();
        applyTimelineStep(0, true);
    }

    function stepForward() {
        pause();
        if (currentTimeIndex < timelineEvents.length - 1) {
            currentTimeIndex++;
            applyTimelineStep(currentTimeIndex, true);
        }
    }

    // v1.8.0 — true DVR rewind. Rebuilds the topology to its EXACT state at a
    // given event index by clearing and replaying every event up to it, so going
    // back actually shows the past (not an append-only graph).
    function seekToIndex(targetIndex) {
        pause();
        resetVisualization();
        if (timelineEvents.length === 0) { updatePlayheadDependentUI(); return; }
        targetIndex = Math.max(0, Math.min(targetIndex, timelineEvents.length - 1));
        for (var i = 0; i <= targetIndex; i++) {
            applyTimelineStep(i, false);
        }
        // applyTimelineStep set currentTimeIndex + playheadOffset
        currentPhaseIdx = findPhaseAtOffset(playheadOffset);
        _maybeFireThought(playheadOffset);
        updatePlayheadDependentUI();
    }

    // Rebuild to the exact state at a simulated-seconds offset (slider scrub).
    function seekToOffset(targetOffset) {
        pause();
        resetVisualization();
        if (timelineEvents.length === 0 || maxOffset <= 0) {
            playheadOffset = Math.max(0, targetOffset);
            updatePlayheadDependentUI();
            return;
        }
        targetOffset = Math.max(0, Math.min(targetOffset, maxOffset));
        for (var i = 0; i < timelineEvents.length; i++) {
            var off = typeof timelineEvents[i]._time_offset === 'number' ? timelineEvents[i]._time_offset : 0;
            if (off <= targetOffset) applyTimelineStep(i, false);
            else break;
        }
        playheadOffset = targetOffset; // honor the exact scrub position
        currentPhaseIdx = findPhaseAtOffset(playheadOffset);
        _maybeFireThought(playheadOffset);
        updatePlayheadDependentUI();
    }

    function stepBack() {
        pause();
        if (currentTimeIndex > 0) seekToIndex(currentTimeIndex - 1);
        else rewind();
    }

    // v1.8.0 — Per-scenario description shown above the topology. Updates when the
    // Scenario dropdown changes so the analyst knows what attack they're watching.
    function updateScenarioDescription(scenarioId) {
        var el = document.getElementById('ar-scenario-desc');
        if (!el) return;
        var s = (scenarioId && scenarioId !== 'all' && scenarioId !== '*' &&
                 typeof DemoStreamer.getScenario === 'function')
            ? DemoStreamer.getScenario(scenarioId) : null;
        if (s) {
            el.innerHTML =
                (s.index_span_seconds ? '<div class="ar-scenario-badge">&#9733; Realistic timeline &#8212; replays at true dwell-time tempo</div>' : '') +
                '<div class="ar-scenario-desc-name">' + escapeHtml(s.name || '') + '</div>' +
                (s.subtitle ? '<div class="ar-scenario-desc-sub">' + escapeHtml(s.subtitle) + '</div>' : '') +
                '<div class="ar-scenario-desc-text">' + escapeHtml(s.description || '') + '</div>' +
                (s.real_world ? '<div class="ar-scenario-desc-meta">&#9201; Real-world span: ' +
                    escapeHtml(s.real_world) + (s.index_span_seconds ? '' : ' &#8212; replayed compressed') + '</div>' : '');
        } else {
            el.innerHTML =
                '<div class="ar-scenario-desc-name">All Scenarios</div>' +
                '<div class="ar-scenario-desc-text">Three bundled attacks &#8212; ' +
                '<strong>Operation Midnight Eclipse</strong> (APT-29 espionage), ' +
                '<strong>Operation Ironclaw</strong> (ransomware), and ' +
                '<strong>Operation Silent Drift</strong> (insider theft). ' +
                'Pick one in the Scenario dropdown to read its story, or hit the ' +
                '&#9889; button to stream and replay it.</div>';
        }
    }

    // ------------------------------------------------------------------------
    // T5.1 - Speed cycler: 0.5x -> 1x -> 2x -> 4x (loops)
    // ------------------------------------------------------------------------

    function cycleSpeed() {
        var idx = SPEED_STEPS.indexOf(playSpeed);
        if (idx < 0) idx = SPEED_STEPS.indexOf(1); // recover if somehow off-grid
        playSpeed = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];

        var btn = document.getElementById('br-speed');
        if (btn) {
            btn.textContent = playSpeed + 'x';
            // brief click-tick animation
            btn.classList.add('speed-tick');
            setTimeout(function() {
                if (btn) btn.classList.remove('speed-tick');
            }, 200);
        }
        // Playhead loop reads playSpeed each frame, so no extra plumbing needed.
    }

    function resetVisualization() {
        _resetBubbleState();
        g.edges.innerHTML = '';
        g.particles.innerHTML = '';
        g.nodes.innerHTML = '';
        g.labels.innerHTML = '';
        renderedNodes = {};
        renderedEdges = {};
        particleSystems = [];
        _attackStep = 0;
        _currentStepBadge = null;
        activeNodes.clear();
        activeEdges.clear();
        initForceLayout();
        currentTimeIndex = -1;
        playheadOffset = 0;
        currentPhaseIdx = -1;
        if (laneCtl) laneCtl.setPlayhead(0);  // sweep lanes back to the start
        hideBannerImmediate();
        document.getElementById('br-slider-progress').style.width = '0%';
        document.getElementById('br-slider-thumb').style.left = '0%';
        var display = document.getElementById('br-time-display');
        if (display) {
            display.classList.remove('has-scenario');
            display.textContent = 'Ready - Press Play';
        }
        updateStats();
    }

    function updateStats() {
        document.getElementById('br-stat-nodes').textContent = activeNodes.size;
        document.getElementById('br-stat-edges').textContent = activeEdges.size;
        var maxRisk = 0;
        activeNodes.forEach(function(id) {
            if (renderedNodes[id]) {
                maxRisk = Math.max(maxRisk, renderedNodes[id].data.risk);
            }
        });
        document.getElementById('br-stat-risk').textContent = maxRisk;
    }

    // ========================================================================
    // PLAYHEAD LOOP (T5.4 - auto-tune duration per scenario)
    // ========================================================================
    // Drives the time-display clock, the active phase index, the transition
    // banner, and the auto-advancement of the legacy timelineEvents blocks.
    //
    // Each animation frame, advance the playhead by
    //     simSecPerFrame = (simulatedSecPerRealSec / 60) * playSpeed
    // We don't strictly need to assume 60fps because the loop is wall-clock
    // calibrated: actually we use the delta between rAF timestamps, so the
    // effective rate becomes
    //     deltaSec * simulatedSecPerRealSec * playSpeed
    // which is more robust on low-fps tabs / under load.

    function startPlayheadLoop() {
        lastFrameTime = performance.now();

        function tick(now) {
            if (!isPlaying) return;
            var deltaMs = now - lastFrameTime;
            lastFrameTime = now;
            // Cap delta to avoid huge jumps if the tab was backgrounded
            if (deltaMs > 250) deltaMs = 250;

            var deltaSec = deltaMs / 1000;
            playheadOffset += deltaSec * simulatedSecPerRealSec * playSpeed;

            // Clamp to maxOffset; auto-pause at the end
            if (playheadOffset >= maxOffset) {
                playheadOffset = maxOffset;
                advanceTimelineToCurrent();
                updatePlayheadDependentUI();
                pause();
                return;
            }

            advanceTimelineToCurrent();
            updatePlayheadDependentUI();

            rafHandle = requestAnimationFrame(tick);
        }

        rafHandle = requestAnimationFrame(tick);
    }

    // Advance the legacy timelineEvents block stepper so that any blocks
    // whose _time_offset has been reached get applied. Each block fires its
    // animated entrance only once.
    function advanceTimelineToCurrent() {
        if (!timelineEvents || timelineEvents.length === 0) return;
        while (currentTimeIndex + 1 < timelineEvents.length) {
            var next = timelineEvents[currentTimeIndex + 1];
            var nextOff = typeof next._time_offset === 'number' ? next._time_offset : 0;
            if (playheadOffset >= nextOff) {
                currentTimeIndex++;
                applyTimelineStep(currentTimeIndex, true);
            } else {
                break;
            }
        }
    }

    // Update everything that depends on the playhead each frame:
    //  - time display clock + scenario/phase second line (T5.2)
    //  - phase boundary detection -> transition banner (T5.3)
    //  - slider progress
    function updatePlayheadDependentUI() {
        // Phase boundary detection
        var newPhaseIdx = findPhaseAtOffset(playheadOffset);
        if (newPhaseIdx !== currentPhaseIdx && newPhaseIdx >= 0) {
            currentPhaseIdx = newPhaseIdx;
            // Don't fire banner for phase 0 if we haven't actually played
            // anything (i.e. at offset 0 on first frame).
            var phaseInfo = phasePresentationCache[newPhaseIdx];
            if (phaseInfo) fireTransitionBanner(phaseInfo);
        }

        updateTimeDisplay();

        // Sweep the host-lane "now" line + reveal events up to the playhead.
        if (laneCtl) laneCtl.setPlayhead(playheadOffset);

        // Update slider based on offset progress (more accurate than block index)
        if (maxOffset > 0) {
            var progress = Math.min(100, (playheadOffset / maxOffset) * 100);
            var sliderProgress = document.getElementById('br-slider-progress');
            var sliderThumb = document.getElementById('br-slider-thumb');
            if (sliderProgress) sliderProgress.style.width = progress + '%';
            if (sliderThumb) sliderThumb.style.left = progress + '%';
        }
    }

    // ========================================================================
    // MAIN RENDER LOOP
    // ========================================================================

    function mainLoop() {
        // v1.8.0 — only run the O(n^2) force solver while the layout still
        // has energy; once it cools below threshold the graph holds still
        // (eliminates the endless slow drift). Position sync + particles +
        // rAF stay alive so node-drag and packet animation keep working.
        if (forceAlpha > 0.004) {
            tickForce();
        }
        updateParticles();

        // Update node positions
        forceNodes.forEach(function(fn) {
            if (renderedNodes[fn.id]) {
                renderedNodes[fn.id].group.setAttribute('transform',
                    'translate(' + fn.x.toFixed(1) + ',' + fn.y.toFixed(1) + ')');
            }
        });

        // Update edge positions
        Object.keys(renderedEdges).forEach(function(key) {
            var re = renderedEdges[key];
            var src = forceNodes.find(function(n) { return n.id === re.data.source; });
            var tgt = forceNodes.find(function(n) { return n.id === re.data.target; });
            if (src && tgt) {
                re.line.setAttribute('x1', src.x.toFixed(1));
                re.line.setAttribute('y1', src.y.toFixed(1));
                re.line.setAttribute('x2', tgt.x.toFixed(1));
                re.line.setAttribute('y2', tgt.y.toFixed(1));
                re.label.setAttribute('x', ((src.x + tgt.x) / 2).toFixed(1));
                re.label.setAttribute('y', ((src.y + tgt.y) / 2 - 8).toFixed(1));
                if (re.badge) {
                    re.badge.setAttribute('transform', 'translate(' +
                        ((src.x + tgt.x) / 2).toFixed(1) + ',' +
                        ((src.y + tgt.y) / 2).toFixed(1) + ')');
                }
            }
        });

        animFrame = requestAnimationFrame(mainLoop);
    }

    // ========================================================================
    // INITIALIZE
    // ========================================================================

    function initWithData(data) {
        // Load the streamer scenario first so the playhead engine and
        // phase metadata are available regardless of whether we end up
        // rendering live or demo data.
        loadActiveScenarioFromStreamer();

        if (data) {
            // Live data from ES or app index
            isDemoMode = false;
            hideDemoModeBadge();
            scenarioNodes = data.nodes;
            timelineEvents = data.timeline;
            currentLiveEvents = data.events || [];   // per-event list for lanes
        } else {
            // Demo mode
            isDemoMode = true;
            var scenario = generateDemoScenario();
            scenarioNodes = scenario.nodes;
            timelineEvents = scenario.timeline;
            currentLiveEvents = [];
            showDemoModeBadge();
        }

        // Compute a synthetic base clock for the time-display: anchor the
        // last event at "now" so the clock counts up convincingly.
        var endRealClock = new Date();
        scenarioBaseClock = new Date(endRealClock.getTime() - (maxOffset * 1000));

        // Scrubber end-labels = the attack's true start and end (the real
        // campaign span), date-aware for multi-day scenarios. (The per-event
        // .time stamps are all generation-time "now", so they can't be used —
        // that made both ends read the same clock.)
        var multiDayLbl = maxOffset > 86400;
        document.getElementById('br-time-start').textContent = formatClock(scenarioBaseClock, multiDayLbl);
        document.getElementById('br-time-end').textContent = formatClock(endRealClock, multiDayLbl);

        // Show initial state
        var display = document.getElementById('br-time-display');
        if (display) {
            display.classList.remove('has-scenario');
            display.textContent = 'Ready - Press Play';
        }

        // Build the host-swimlane incident timeline (the primary visual).
        renderLaneView();

        // Auto-play after a short delay for wow effect
        setTimeout(function() {
            play();
        }, 1000);

        // First-run hint fades on its own after a few seconds even if the
        // analyst never touches a control (it also hides on any interaction).
        setTimeout(hideFirstHint, 6000);
    }

    function init() {
        initSVG();
        initForceLayout();
        injectExportButton();

        // Bind controls — user interaction dismisses the first-run hint
        document.getElementById('br-play').addEventListener('click', function() {
            hideFirstHint();
            isPlaying ? pause() : play();
        });
        document.getElementById('br-rewind').addEventListener('click', function() { hideFirstHint(); rewind(); });
        var stepBackBtn = document.getElementById('br-stepback');
        if (stepBackBtn) stepBackBtn.addEventListener('click', function() { hideFirstHint(); stepBack(); });
        document.getElementById('br-step').addEventListener('click', function() { hideFirstHint(); stepForward(); });
        document.getElementById('br-speed').addEventListener('click', cycleSpeed);
        var fitBtn = document.getElementById('br-fit');
        if (fitBtn) fitBtn.addEventListener('click', function() {
            // v1.9.5 — the ⛶ icon reads as "fullscreen", so in lane mode it now
            // toggles real fullscreen of the viz (double-click the chart still
            // resets pan/zoom). Force-graph mode keeps fit-to-view.
            if (useLanes) { toggleVizFullscreen(); } else { fitToView(); }
        });
        // Initialize speed-button label to match initial playSpeed
        var speedBtn = document.getElementById('br-speed');
        if (speedBtn) speedBtn.textContent = playSpeed + 'x';

        // v1.5.3 — Share Link button: copy current investigation URL with playhead
        var shareBtn = document.getElementById('ar-share-link');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                var u = new URL(window.location.href);
                // Splunk dashboard already encodes form.* tokens in the URL
                // We just add the playhead position
                u.searchParams.set('t', String(Math.round(playheadOffset)));
                var url = u.toString();
                var done = function(ok) {
                    var origLabel = shareBtn.querySelector('.ar-export-pdf-lbl');
                    if (origLabel) {
                        var prev = origLabel.textContent;
                        origLabel.textContent = ok ? 'Copied!' : 'Copy failed';
                        setTimeout(function() { origLabel.textContent = prev; }, 1500);
                    }
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(function(){ done(true); }, function(){ done(false); });
                } else {
                    // Fallback: select an offscreen textarea
                    var ta = document.createElement('textarea');
                    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta); ta.select();
                    try { document.execCommand('copy'); done(true); } catch(e) { done(false); }
                    document.body.removeChild(ta);
                }
            });
        }

        // v1.5.3 — Resume playhead from ?t=NN URL param after scenario loads
        // (scenario loads async in Live mode, so retry briefly)
        var urlT = (function(){
            try {
                var u = new URL(window.location.href);
                var t = parseInt(u.searchParams.get('t'), 10);
                return isNaN(t) ? null : t;
            } catch(e) { return null; }
        })();
        if (urlT !== null && urlT > 0) {
            var seekTries = 0;
            var trySeek = function() {
                seekTries++;
                if (maxOffset > 0 && timelineEvents && timelineEvents.length) {
                    pause();
                    resetVisualization();
                    playheadOffset = Math.min(urlT, maxOffset);
                    // Step through timeline up to that offset
                    for (var i = 0; i < timelineEvents.length; i++) {
                        if ((timelineEvents[i]._time_offset || 0) <= playheadOffset) {
                            applyTimelineStep(i, false);
                        } else break;
                    }
                    updateTimeDisplay();
                } else if (seekTries < 15) {
                    setTimeout(trySeek, 600);
                }
            };
            setTimeout(trySeek, 1200);
        }

        // Slider click-to-seek - uses playhead-offset percentage now so the
        // time display + phase banner stay coherent with the seek.
        // v1.8.0 — DVR scrub: click OR DRAG the timeline to reconstruct the
        // topology at that exact moment. Dragging backward shows the past state
        // (reset + replay up to the offset), not an append-only graph. The rebuild
        // is rAF-coalesced so dragging stays smooth.
        var sliderTrack = document.getElementById('br-slider-track');
        if (sliderTrack) {
            var _scrubbing = false, _scrubRaf = null, _scrubPending = null;
            var offsetFromX = function(clientX) {
                var rect = sliderTrack.getBoundingClientRect();
                var pct = (clientX - rect.left) / rect.width;
                return Math.max(0, Math.min(1, pct)) * maxOffset;
            };
            var flushScrub = function() {
                _scrubRaf = null;
                if (_scrubPending !== null) { seekToOffset(_scrubPending); _scrubPending = null; }
            };
            var queueScrub = function(clientX) {
                _scrubPending = offsetFromX(clientX);
                if (!_scrubRaf) _scrubRaf = requestAnimationFrame(flushScrub);
            };
            sliderTrack.addEventListener('mousedown', function(e) {
                _scrubbing = true;
                queueScrub(e.clientX);
                e.preventDefault();
            });
            document.addEventListener('mousemove', function(e) {
                if (_scrubbing) queueScrub(e.clientX);
            });
            document.addEventListener('mouseup', function() {
                if (_scrubbing) { _scrubbing = false; flushScrub(); }
            });
            // Keyboard scrubbing (WCAG 2.1.1): ← / → step, Home rewinds.
            sliderTrack.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowLeft') { stepBack(); e.preventDefault(); }
                else if (e.key === 'ArrowRight') { stepForward(); e.preventDefault(); }
                else if (e.key === 'Home') { rewind(); e.preventDefault(); }
                else if (e.key === 'End' && timelineEvents.length) { seekToIndex(timelineEvents.length - 1); e.preventDefault(); }
            });
        }

        // Start render loop
        mainLoop();

        // Protocol filter - listen for Splunk token changes
        var defaultTokens = mvc.Components.get('default');
        if (defaultTokens) {
            defaultTokens.on('change:protocol_filter', function(model, value) {
                var svg = document.getElementById('blast-svg');
                if (!svg) return;
                var edges = svg.querySelectorAll('.blast-edge');
                var labels = svg.querySelectorAll('.blast-edge-label');
                for (var i = 0; i < edges.length; i++) {
                    if (value === 'all') {
                        edges[i].style.display = '';
                    } else {
                        var isMatch = edges[i].classList.contains('protocol-' + value);
                        edges[i].style.display = isMatch ? '' : 'none';
                    }
                }
                // Also filter edge labels
                for (var j = 0; j < labels.length; j++) {
                    if (value === 'all') {
                        labels[j].style.display = '';
                    } else {
                        var parentProto = labels[j].getAttribute('data-protocol') || '';
                        labels[j].style.display = parentProto === value ? '' : 'none';
                    }
                }
            });

            // Phase 5 - react to scenario token changes by reloading the
            // active streamer scenario (affects phase labels + banner text) AND
            // rebuilding the topology + description for the picked scenario.
            // v1.8.0 — the dropdown previously only refreshed when 'default'
            // fired 'change:scenario'. Depending on the Splunk version and
            // searchWhenChanged, the dropdown writes to the 'default' and/or
            // 'submitted' model under either the bare name ('scenario') or the
            // 'form.'-prefixed name. Binding all four combinations (with a
            // de-dupe guard) makes the topology + description always follow the
            // selection instead of staying stuck on Operation Midnight Eclipse.
            var _lastScenarioApplied = null;
            function applyScenarioChange(value) {
                if (value == null) return;
                if (value === _lastScenarioApplied) return;   // de-dupe duplicate fires
                _lastScenarioApplied = value;
                updateScenarioDescription(value); // refresh the description for any selection
                if (value === 'all' || value === '*') return; // "All Scenarios" → no single topology
                var s = DemoStreamer.getScenario(value);
                if (!s) return;
                activeScenarioId = value;
                activeScenario = s;
                activeScenarioName = s.name || '';
                rebuildPhasePresentationCache();
                // Re-anchor base clock so the new maxOffset still lands at "now"
                scenarioBaseClock = new Date(Date.now() - (maxOffset * 1000));
                currentPhaseIdx = findPhaseAtOffset(playheadOffset);
                _maybeFireThought(playheadOffset);
                updateTimeDisplay();

                // Rebuild the topology from the new scenario
                cachedDemoScenario = null;
                pause();
                var newScn = generateDemoScenario();
                scenarioNodes = newScn.nodes;
                timelineEvents = newScn.timeline;
                currentLiveEvents = [];
                resetVisualization();
                currentTimeIndex = -1;
                playheadOffset = 0;
                renderLaneView();   // rebuild the host-lane view for the new scenario
                if (timelineEvents.length > 0) applyTimelineStep(0, true);
            }
            function _onScenarioChange(model, value) { applyScenarioChange(value); }
            var _submittedTokens = mvc.Components.get('submitted');
            [defaultTokens, _submittedTokens].forEach(function(m) {
                if (!m) return;
                m.on('change:scenario', _onScenarioChange);
                m.on('change:form.scenario', _onScenarioChange);
            });

            // Initial description on load (reads the current scenario token).
            try {
                var initScn = (mvc.Components.get('submitted') && mvc.Components.get('submitted').get('form.scenario'))
                    || defaultTokens.get('form.scenario') || '*';
                updateScenarioDescription(initScn);
            } catch (e) { updateScenarioDescription('*'); }
        }

        // Mode-aware data load (v1.5.1)
        // - Live mode → fetch real CIM data via generateLiveScenario
        // - Demo mode → existing tryESData → demo fallback path
        function currentEntityTok() {
            try {
                var sub = mvc.Components.get('submitted');
                var def = mvc.Components.get('default');
                return (sub && sub.get('form.entity')) || (def && def.get('form.entity')) || '*';
            } catch(e) { return '*'; }
        }
        function readMode() {
            try {
                var sub = mvc.Components.get('submitted');
                var def = mvc.Components.get('default');
                var v = (sub && sub.get('form.mode')) || (def && def.get('form.mode'));
                return (v === 'live') ? 'live' : 'demo';
            } catch(e) { return 'demo'; }
        }
        function loadForMode(mode) {
            if (mode === 'live') {
                // Invalidate any cached live scenario so a re-entry re-queries.
                if (typeof invalidateLiveScenarioCache === 'function') invalidateLiveScenarioCache();
                generateLiveScenario(currentEntityTok(), null, function(scn) {
                    if (scn && scn.timeline && scn.timeline.length > 0) {
                        initWithData(scn);
                    } else {
                        // Empty real-data result — initialize anyway so DVR controls work
                        initWithData({ nodes: [], timeline: [], __live: true, __empty: true });
                    }
                });
            } else {
                tryESData(function(data) {
                    initWithData(data);
                });
            }
        }

        loadForMode(readMode());

        // v1.6.0 — react to a runtime mode switch (radio toggle, no page reload).
        // Without this the topology kept showing the previous mode's nodes — e.g.
        // demo data lingering after flipping to Live. Clear the canvas and reload.
        if (defaultTokens) {
            defaultTokens.on('change:mode', function(model, value) {
                pause();
                resetVisualization();
                currentTimeIndex = -1;
                playheadOffset = 0;
                currentPhaseIdx = -1;
                hideBannerImmediate();
                loadForMode((value === 'live') ? 'live' : 'demo');
            });
        }
    }

    // Wait for DOM
    setTimeout(init, 500);
});
