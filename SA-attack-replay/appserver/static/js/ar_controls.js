// ============================================================================
// DEMO CONTROLS - Floating widget for streaming attack scenarios on any dashboard
// SA-attack-replay - Splunk Community Dashboard Contest 2026
//
// T4.5 (Phase 4.5):
//   - Scenario dropdown populated dynamically from DemoStreamer.listScenarios()
//   - Dynamic scenario summary card (subtitle/description/event_count/phase_count
//     /duration_label) that updates as the user changes the dropdown
//   - Stream button uses DemoStreamer.streamScenario(id, callbacks) and surfaces
//     phase-level progress (status text + progress bar + phase dots)
//   - "Clear Demo Data" secondary button uses DemoStreamer.clearScenarioData(...)
//     with inline confirmation (no alert/confirm dialogs)
//   - FAB animates while streaming and turns solid green for ~5s after completion
//     to signal "data is live in the index"
//
// Architecture:
//   define([...], function($, DemoStreamer){ ... }) - unchanged.
//   CSS injection pattern unchanged - just extended.
//   FAB+panel reveal-on-click unchanged - panel contents replaced.
// ============================================================================

var _appStaticPrefix = ((typeof $C !== 'undefined' && $C['MRSPARKLE_ROOT_PATH']) || '') + '/static/app/SA-attack-replay/js/';
// Must match _arv in ar_blast.js so ar_streamer resolves to a single module.
var _arv = '?v=2.0.2';

define([
    'jquery',
    'splunkjs/mvc',
    _appStaticPrefix + 'ar_streamer.js' + _arv
], function($, mvc, DemoStreamer) {
    'use strict';

    // ========================================================================
    // STATE
    // ========================================================================

    var _widgets = null;          // { fab, panel }
    var _scenarios = [];          // array of scenario info objects
    var _selectedId = null;       // currently selected scenario id
    var _isStreaming = false;     // local UI state (mirrors DemoStreamer.isStreaming)
    var _lastStreamedId = null;   // remembered for downstream dashboards

    // ========================================================================
    // CSS INJECTION
    // ========================================================================

    function injectStyles() {
        if (document.getElementById('demo-controls-style')) return;

        var css = '\
        /* ===== FAB ===== */\
        #demo-fab { \
            position: fixed; bottom: 30px; right: 30px; z-index: 9999; \
            width: 56px; height: 56px; border-radius: 50%; \
            background: linear-gradient(135deg, #ff4444, #ff8c00); \
            border: none; color: #fff; font-size: 22px; cursor: pointer; \
            box-shadow: 0 4px 20px rgba(255,68,68,0.4); \
            transition: all 0.3s ease; display: flex; align-items: center; \
            justify-content: center; overflow: visible; \
        } \
        #demo-fab:hover { \
            transform: scale(1.1); \
            box-shadow: 0 6px 30px rgba(255,68,68,0.6); \
        } \
        #demo-fab::after { \
            content: "Stream Demo Data"; \
            position: absolute; right: 66px; top: 50%; \
            transform: translateY(-50%); \
            background: #1a1a3e; color: #e0e0ff; \
            padding: 6px 12px; border-radius: 6px; \
            font-size: 12px; font-weight: 600; \
            white-space: nowrap; pointer-events: none; \
            opacity: 0; transition: opacity 0.2s ease; \
            border: 1px solid #2a2a5a; \
            box-shadow: 0 4px 12px rgba(0,0,0,0.4); \
        } \
        #demo-fab:hover::after { opacity: 1; } \
        #demo-fab.streaming { \
            animation: fab-pulse 1.5s ease-in-out infinite; \
        } \
        #demo-fab.success { \
            background: linear-gradient(135deg, #00aa66, #00ff88) !important; \
            box-shadow: 0 0 30px rgba(0,255,136,0.7) !important; \
            animation: fab-success-pulse 1.2s ease-in-out infinite; \
        } \
        #demo-fab.success::after { \
            content: "Data Live in Splunk"; \
        } \
        @keyframes fab-pulse { \
            0%,100% { box-shadow: 0 4px 20px rgba(255,68,68,0.4); } \
            50% { box-shadow: 0 4px 40px rgba(255,68,68,0.8); } \
        } \
        @keyframes fab-success-pulse { \
            0%,100% { box-shadow: 0 0 30px rgba(0,255,136,0.7); } \
            50% { box-shadow: 0 0 50px rgba(0,255,136,1); } \
        } \
        \
        /* ===== PANEL ===== */\
        #demo-panel { \
            position: fixed; bottom: 100px; right: 30px; z-index: 9998; \
            width: 420px; background: #0d0d25; \
            border: 1px solid #2a2a5a; border-radius: 16px; \
            padding: 0; overflow: hidden; \
            box-shadow: 0 10px 50px rgba(0,0,0,0.6); \
            transform: scale(0.9) translateY(20px); opacity: 0; \
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); \
            pointer-events: none; \
            max-height: calc(100vh - 130px); \
            display: flex; flex-direction: column; \
        } \
        #demo-panel.visible { \
            transform: scale(1) translateY(0); opacity: 1; \
            pointer-events: auto; \
        } \
        .demo-panel-header { \
            background: linear-gradient(135deg, #1a1a3e, #0d0d25); \
            padding: 18px 22px 14px; border-bottom: 1px solid #2a2a5a; \
            flex-shrink: 0; \
        } \
        .demo-panel-header h3 { \
            margin: 0; color: #e0e0ff; font-size: 16px; font-weight: 600; \
            letter-spacing: 0.5px; \
        } \
        .demo-panel-header p { \
            margin: 6px 0 0; color: #6a6a9a; font-size: 11px; \
            line-height: 1.4; \
        } \
        .demo-panel-body { \
            padding: 18px 22px; overflow-y: auto; flex: 1; \
        } \
        .demo-panel-body::-webkit-scrollbar { width: 6px; } \
        .demo-panel-body::-webkit-scrollbar-thumb { background: #2a2a5a; border-radius: 3px; } \
        \
        /* ===== SCENARIO DROPDOWN ===== */\
        .demo-field-label { \
            font-size: 10px; color: #6a6a9a; \
            text-transform: uppercase; letter-spacing: 1.2px; \
            margin-bottom: 6px; font-weight: 600; \
            font-family: "SF Mono","Fira Code",monospace; \
        } \
        .demo-scenario-select-wrap { \
            position: relative; margin-bottom: 14px; \
        } \
        #demo-scenario-select { \
            width: 100%; appearance: none; -webkit-appearance: none; -moz-appearance: none; \
            background: #12122a; color: #e0e0ff; \
            border: 1px solid #2a2a5a; border-radius: 8px; \
            padding: 11px 36px 11px 14px; \
            font-size: 13px; font-weight: 500; cursor: pointer; \
            font-family: inherit; \
            transition: all 0.2s ease; \
            background-image: linear-gradient(45deg, transparent 50%, #ff8c00 50%), linear-gradient(135deg, #ff8c00 50%, transparent 50%); \
            background-position: calc(100% - 16px) 50%, calc(100% - 11px) 50%; \
            background-size: 5px 5px, 5px 5px; \
            background-repeat: no-repeat; \
        } \
        #demo-scenario-select:hover { \
            border-color: #ff8c00; \
            box-shadow: 0 0 0 3px rgba(255,140,0,0.1); \
        } \
        #demo-scenario-select:focus { \
            outline: none; border-color: #ff8c00; \
            box-shadow: 0 0 0 3px rgba(255,140,0,0.2); \
        } \
        #demo-scenario-select:disabled { \
            opacity: 0.5; cursor: not-allowed; \
        } \
        \
        /* ===== SCENARIO SUMMARY CARD ===== */\
        .demo-scenario-card { \
            background: #12122a; border: 1px solid #2a2a5a; \
            border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; \
            position: relative; overflow: hidden; \
        } \
        .demo-scenario-card::before { \
            content: ""; position: absolute; top: 0; left: 0; right: 0; \
            height: 2px; background: linear-gradient(90deg, #ff4444, #ff8c00, #ffd700); \
        } \
        .demo-scenario-name { \
            color: #ff8c00; font-size: 13px; font-weight: bold; \
            font-family: "SF Mono","Fira Code",monospace; \
            margin-bottom: 4px; line-height: 1.3; \
        } \
        .demo-scenario-subtitle { \
            color: #00ddff; font-size: 11px; \
            margin-bottom: 8px; line-height: 1.4; \
            font-style: italic; \
        } \
        .demo-scenario-desc { \
            color: #8888bb; font-size: 11px; \
            margin: 6px 0 12px; line-height: 1.5; \
        } \
        .demo-scenario-stats { \
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; \
            border-top: 1px solid #1f1f3e; padding-top: 12px; \
        } \
        .demo-scenario-stat { text-align: center; } \
        .demo-scenario-stat-val { \
            font-size: 18px; font-weight: bold; color: #00ddff; \
            font-family: "SF Mono","Fira Code",monospace; \
            line-height: 1.2; \
        } \
        .demo-scenario-stat-lbl { \
            font-size: 9px; color: #6a6a9a; text-transform: uppercase; \
            letter-spacing: 0.5px; margin-top: 2px; \
        } \
        \
        /* ===== STREAM BUTTON ===== */\
        #demo-stream-btn { \
            width: 100%; padding: 13px; border: none; border-radius: 10px; \
            font-size: 13px; font-weight: bold; cursor: pointer; \
            letter-spacing: 1.2px; transition: all 0.3s ease; \
            text-transform: uppercase; \
            font-family: inherit; \
            position: relative; overflow: hidden; \
        } \
        #demo-stream-btn.ready { \
            background: linear-gradient(135deg, #ff4444, #ff8c00); \
            color: #fff; \
        } \
        #demo-stream-btn.ready:hover { \
            box-shadow: 0 4px 20px rgba(255,68,68,0.4); \
            transform: translateY(-1px); \
        } \
        #demo-stream-btn.streaming { \
            background: #1a1a3e; color: #00ddff; \
            border: 1px solid #00ddff; cursor: default; \
        } \
        #demo-stream-btn.complete { \
            background: linear-gradient(135deg, #00aa66, #00ff88); \
            color: #000; \
            box-shadow: 0 0 24px rgba(0,255,136,0.5); \
        } \
        #demo-stream-btn .stream-btn-phase { \
            display: block; font-size: 10px; \
            font-weight: normal; opacity: 0.8; margin-top: 3px; \
            letter-spacing: 0.5px; text-transform: none; \
            font-family: "SF Mono","Fira Code",monospace; \
        } \
        \
        /* ===== CLEAR BUTTON ===== */\
        #demo-clear-btn { \
            width: 100%; padding: 9px; border: 1px solid #2a2a5a; \
            border-radius: 8px; margin-top: 8px; \
            background: transparent; color: #6a6a9a; \
            font-size: 11px; font-weight: 600; cursor: pointer; \
            letter-spacing: 1px; transition: all 0.2s ease; \
            text-transform: uppercase; font-family: inherit; \
        } \
        #demo-clear-btn:hover { \
            border-color: #ff4444; color: #ff4444; \
            background: rgba(255,68,68,0.05); \
        } \
        #demo-clear-btn:disabled { \
            opacity: 0.4; cursor: not-allowed; \
        } \
        #demo-clear-btn.confirm { \
            border-color: #ff4444; color: #ff4444; \
            background: rgba(255,68,68,0.08); \
            animation: clear-pulse 1.4s ease-in-out infinite; \
        } \
        #demo-clear-btn.working { \
            border-color: #00ddff; color: #00ddff; cursor: default; \
        } \
        #demo-clear-btn.done { \
            border-color: #00ff88; color: #00ff88; \
        } \
        @keyframes clear-pulse { \
            0%,100% { background: rgba(255,68,68,0.08); } \
            50% { background: rgba(255,68,68,0.18); } \
        } \
        \
        /* ===== INLINE NOTICE ===== */\
        .demo-inline-notice { \
            margin-top: 10px; padding: 8px 12px; border-radius: 6px; \
            font-size: 11px; line-height: 1.4; \
            font-family: "SF Mono","Fira Code",monospace; \
            text-align: center; display: none; \
        } \
        .demo-inline-notice.visible { display: block; } \
        .demo-inline-notice.info { \
            background: rgba(0,221,255,0.1); color: #00ddff; \
            border: 1px solid rgba(0,221,255,0.3); \
        } \
        .demo-inline-notice.error { \
            background: rgba(255,68,68,0.1); color: #ff4444; \
            border: 1px solid rgba(255,68,68,0.3); \
        } \
        .demo-inline-notice.success { \
            background: rgba(0,255,136,0.1); color: #00ff88; \
            border: 1px solid rgba(0,255,136,0.3); \
        } \
        \
        /* ===== PROGRESS BAR ===== */\
        .demo-progress { \
            margin-top: 14px; display: none; \
        } \
        .demo-progress.active { display: block; } \
        .demo-progress-bar-bg { \
            height: 6px; background: #1a1a3e; border-radius: 3px; \
            overflow: hidden; margin-bottom: 8px; position: relative; \
        } \
        .demo-progress-bar { \
            height: 100%; width: 0%; border-radius: 3px; \
            background: linear-gradient(90deg, #ff4444, #ff8c00, #ffd700, #00ddff); \
            background-size: 200% 100%; \
            transition: width 0.4s ease; \
            animation: progress-shimmer 2s linear infinite; \
        } \
        @keyframes progress-shimmer { \
            0% { background-position: 200% 0; } \
            100% { background-position: 0 0; } \
        } \
        .demo-progress-text { \
            font-size: 11px; color: #8888bb; text-align: center; \
            font-family: "SF Mono","Fira Code",monospace; \
            min-height: 14px; \
        } \
        .demo-phase-indicator { \
            display: flex; justify-content: center; gap: 6px; \
            margin-bottom: 10px; flex-wrap: wrap; \
        } \
        .demo-phase-dot { \
            width: 8px; height: 8px; border-radius: 50%; \
            background: #2a2a5a; transition: all 0.3s ease; \
        } \
        .demo-phase-dot.active { \
            background: #ff8c00; box-shadow: 0 0 10px rgba(255,140,0,0.6); \
            transform: scale(1.3); \
        } \
        .demo-phase-dot.complete { background: #00ff88; } \
        \
        /* ===== COMPLETE NAV ACTIONS ===== */\
        .demo-complete-actions { \
            display: none; margin-top: 14px; \
            flex-direction: column; gap: 6px; \
        } \
        .demo-complete-actions.visible { display: flex; } \
        .demo-nav-btn { \
            padding: 9px 14px; border-radius: 7px; border: 1px solid #2a2a5a; \
            background: #12122a; color: #e0e0ff; cursor: pointer; \
            font-size: 12px; text-decoration: none; text-align: center; \
            transition: all 0.2s ease; display: flex; align-items: center; \
            gap: 10px; \
        } \
        .demo-nav-btn:hover { \
            border-color: #4488ff; background: #1a1a3e; \
            text-decoration: none; color: #e0e0ff; \
            transform: translateX(2px); \
        } \
        .demo-nav-icon { font-size: 16px; width: 22px; text-align: center; } \
        .demo-nav-label { flex: 1; text-align: left; } \
        .demo-nav-arrow { color: #4a4a7a; } \
        ';

        var styleEl = document.createElement('style');
        styleEl.id = 'demo-controls-style';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    // ========================================================================
    // PANEL CONSTRUCTION
    // ========================================================================

    function buildPanelMarkup() {
        // Scenario <option> list from listScenarios()
        var optionMarkup = _scenarios.map(function(s, idx) {
            var sel = idx === 0 ? ' selected' : '';
            return '<option value="' + escapeHtml(s.id) + '"' + sel + '>' +
                escapeHtml(s.name) + '</option>';
        }).join('');

        return '\
            <div class="demo-panel-header">\
                <h3>Stream Attack Scenario</h3>\
                <p>Generate a multi-phase attack into your Splunk index. Pick a scenario, hit Stream, then explore Blast Radius / Attack Chain / MITRE Coverage.</p>\
            </div>\
            <div class="demo-panel-body">\
                <div class="demo-field-label">Scenario</div>\
                <div class="demo-scenario-select-wrap">\
                    <select id="demo-scenario-select">' + optionMarkup + '</select>\
                </div>\
                \
                <div class="demo-scenario-card" id="demo-summary">\
                    <div class="demo-scenario-name" id="demo-summary-name">--</div>\
                    <div class="demo-scenario-subtitle" id="demo-summary-subtitle">--</div>\
                    <div class="demo-scenario-desc" id="demo-summary-desc">--</div>\
                    <div class="demo-scenario-stats">\
                        <div class="demo-scenario-stat">\
                            <div class="demo-scenario-stat-val" id="demo-summary-phases">--</div>\
                            <div class="demo-scenario-stat-lbl">Phases</div>\
                        </div>\
                        <div class="demo-scenario-stat">\
                            <div class="demo-scenario-stat-val" id="demo-summary-events">--</div>\
                            <div class="demo-scenario-stat-lbl">Events</div>\
                        </div>\
                        <div class="demo-scenario-stat">\
                            <div class="demo-scenario-stat-val" id="demo-summary-hosts">--</div>\
                            <div class="demo-scenario-stat-lbl">Hosts</div>\
                        </div>\
                        <div class="demo-scenario-stat">\
                            <div class="demo-scenario-stat-val" id="demo-summary-duration">--</div>\
                            <div class="demo-scenario-stat-lbl">Sim. span</div>\
                        </div>\
                    </div>\
                    <div class="demo-scenario-compression" id="demo-summary-compression"></div>\
                </div>\
                \
                <button id="demo-stream-btn" class="ready">Stream Scenario</button>\
                <button id="demo-clear-btn">Clear Demo Data</button>\
                <div class="demo-inline-notice" id="demo-notice"></div>\
                \
                <div class="demo-progress" id="demo-progress">\
                    <div class="demo-phase-indicator" id="demo-phases"></div>\
                    <div class="demo-progress-bar-bg"><div class="demo-progress-bar" id="demo-bar"></div></div>\
                    <div class="demo-progress-text" id="demo-status">Preparing...</div>\
                </div>\
                \
                <div class="demo-complete-actions" id="demo-actions">\
                    <a href="blast_radius" class="demo-nav-btn">\
                        <span class="demo-nav-icon" style="color:#ff4444;">&#x29BF;</span>\
                        <span class="demo-nav-label">Blast Radius</span>\
                        <span class="demo-nav-arrow">&#x203A;</span>\
                    </a>\
                    <a href="attack_chain" class="demo-nav-btn">\
                        <span class="demo-nav-icon" style="color:#00ddff;">&#x2194;</span>\
                        <span class="demo-nav-label">Attack Chain</span>\
                        <span class="demo-nav-arrow">&#x203A;</span>\
                    </a>\
                    <a href="mitre_coverage" class="demo-nav-btn">\
                        <span class="demo-nav-icon" style="color:#00ff88;">&#x2593;</span>\
                        <span class="demo-nav-label">MITRE Coverage</span>\
                        <span class="demo-nav-arrow">&#x203A;</span>\
                    </a>\
                    <a href="enrichment" class="demo-nav-btn">\
                        <span class="demo-nav-icon" style="color:#aa44ff;">&#x2315;</span>\
                        <span class="demo-nav-label">Enrichment</span>\
                        <span class="demo-nav-arrow">&#x203A;</span>\
                    </a>\
                </div>\
            </div>';
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

    function createWidget() {
        // FAB button
        var fab = document.createElement('button');
        fab.id = 'demo-fab';
        fab.innerHTML = '&#x26A1;';
        fab.title = 'Stream Demo Data';
        document.body.appendChild(fab);

        // Panel (populated from listScenarios)
        var panel = document.createElement('div');
        panel.id = 'demo-panel';
        panel.innerHTML = buildPanelMarkup();
        document.body.appendChild(panel);

        return { fab: fab, panel: panel };
    }

    // ========================================================================
    // SUMMARY CARD + PHASE DOTS - dynamic update
    // ========================================================================

    function applySummary(scenarioInfo) {
        if (!scenarioInfo) return;

        var nameEl = document.getElementById('demo-summary-name');
        var subEl = document.getElementById('demo-summary-subtitle');
        var descEl = document.getElementById('demo-summary-desc');
        var phasesEl = document.getElementById('demo-summary-phases');
        var eventsEl = document.getElementById('demo-summary-events');
        var hostsEl = document.getElementById('demo-summary-hosts');
        var durationEl = document.getElementById('demo-summary-duration');

        if (nameEl) nameEl.textContent = scenarioInfo.name || '--';
        if (subEl)  subEl.textContent  = scenarioInfo.subtitle || '';
        if (descEl) descEl.textContent = scenarioInfo.description || '';
        if (phasesEl) phasesEl.textContent = scenarioInfo.totalPhases || 0;
        if (eventsEl) eventsEl.textContent = scenarioInfo.totalEvents || 0;
        if (hostsEl)  hostsEl.textContent  = scenarioInfo.hostCount || 0;
        if (durationEl) durationEl.textContent = scenarioInfo.durationLabel || scenarioInfo.duration_label || '--';

        var compEl = document.getElementById('demo-summary-compression');
        if (compEl) {
            var rw = scenarioInfo.realWorldLabel || scenarioInfo.real_world;
            compEl.innerHTML = rw
                ? '&#9201; <strong>Compressed timeline</strong> &mdash; a real-world ' + escapeHtml(rw) +
                  ' campaign is replayed as ' + escapeHtml(scenarioInfo.durationLabel || scenarioInfo.duration_label || 'a short span') +
                  ' of timestamps so you can scrub the whole kill chain in ~90s.'
                : '';
        }

        rebuildPhaseDots(scenarioInfo.totalPhases || 0);
    }

    function rebuildPhaseDots(phaseCount) {
        var container = document.getElementById('demo-phases');
        if (!container) return;
        container.innerHTML = '';
        for (var i = 0; i < phaseCount; i++) {
            var dot = document.createElement('div');
            dot.className = 'demo-phase-dot';
            dot.setAttribute('data-phase', i);
            container.appendChild(dot);
        }
    }

    function resetPhaseDots() {
        var dots = document.querySelectorAll('#demo-phases .demo-phase-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.remove('active', 'complete');
        }
    }

    // ========================================================================
    // NOTICES (inline, replaces alert/confirm per safety rules)
    // ========================================================================

    var _noticeTimeout = null;

    function showNotice(message, kind) {
        var el = document.getElementById('demo-notice');
        if (!el) return;
        el.textContent = message;
        el.className = 'demo-inline-notice visible ' + (kind || 'info');
        if (_noticeTimeout) clearTimeout(_noticeTimeout);
    }

    function autoHideNotice(ms) {
        if (_noticeTimeout) clearTimeout(_noticeTimeout);
        _noticeTimeout = setTimeout(hideNotice, ms || 5000);
    }

    function hideNotice() {
        var el = document.getElementById('demo-notice');
        if (el) el.classList.remove('visible');
    }

    // ========================================================================
    // STREAM BUTTON STATE
    // ========================================================================

    function setStreamBtn(state, mainText, subText) {
        var btn = document.getElementById('demo-stream-btn');
        if (!btn) return;
        btn.classList.remove('ready', 'streaming', 'complete');
        btn.classList.add(state);
        var html = escapeHtml(mainText);
        if (subText) html += '<span class="stream-btn-phase">' + escapeHtml(subText) + '</span>';
        btn.innerHTML = html;
    }

    function setFabSuccess(seconds) {
        if (!_widgets || !_widgets.fab) return;
        _widgets.fab.classList.remove('streaming');
        _widgets.fab.classList.add('success');
        setTimeout(function() {
            if (_widgets && _widgets.fab) _widgets.fab.classList.remove('success');
        }, (seconds || 5) * 1000);
    }

    // ========================================================================
    // ACTIONS
    // ========================================================================

    // v1.9.3 — The FAB streams whatever the main dashboard "Scenario" dropdown is
    // set to (when it's a specific scenario), so "select Stillwater → Stream"
    // actually lands Stillwater data in the SPL panels. The FAB's own selector /
    // first scenario is only a fallback (e.g. when the dropdown is "All Scenarios").
    function mainDashboardScenario() {
        try {
            var s = mvc.Components.get('submitted'), d = mvc.Components.get('default');
            var v = (s && (s.get('scenario') || s.get('form.scenario'))) ||
                    (d && (d.get('scenario') || d.get('form.scenario')));
            if (v && v !== '*' && v !== 'all' && DemoStreamer.getScenarioInfo(v)) return v;
        } catch (e) {}
        return null;
    }

    function startStreamFlow() {
        if (_isStreaming) return;

        var scenarioId = mainDashboardScenario() || _selectedId || (_scenarios[0] && _scenarios[0].id);
        if (!scenarioId) {
            showNotice('No scenarios available.', 'error');
            autoHideNotice(4000);
            return;
        }

        var scenarioInfo = DemoStreamer.getScenarioInfo(scenarioId);
        if (!scenarioInfo) {
            showNotice('Unknown scenario: ' + scenarioId, 'error');
            autoHideNotice(4000);
            return;
        }

        var streamBtn  = document.getElementById('demo-stream-btn');
        var clearBtn   = document.getElementById('demo-clear-btn');
        var selectEl   = document.getElementById('demo-scenario-select');
        var progressEl = document.getElementById('demo-progress');
        var barEl      = document.getElementById('demo-bar');
        var statusEl   = document.getElementById('demo-status');
        var actionsEl  = document.getElementById('demo-actions');

        _isStreaming = true;
        if (streamBtn) streamBtn.disabled = true;
        if (clearBtn) clearBtn.disabled = true;
        if (selectEl) selectEl.disabled = true;

        setStreamBtn('streaming', 'STREAMING…', 'Preparing…');
        _widgets.fab.classList.add('streaming');
        _widgets.fab.classList.remove('success');
        progressEl.classList.add('active');
        actionsEl.classList.remove('visible');
        resetPhaseDots();
        barEl.style.width = '0%';
        statusEl.textContent = 'Preparing…';
        hideNotice();

        var lastError = null;

        var didStart = DemoStreamer.streamScenario(scenarioId, {
            onPhaseStart: function(info) {
                if (info.phaseIndex < 0) {
                    statusEl.textContent = 'Clearing previous demo data…';
                    setStreamBtn('streaming', 'STREAMING…', 'Clearing previous data…');
                    return;
                }
                var label = info.phaseLabel || ('Phase ' + (info.phaseIndex + 1));
                statusEl.textContent = 'Phase ' + (info.phaseIndex + 1) + ' / ' +
                    (info.totalPhases || scenarioInfo.totalPhases) + ' — ' + label;
                setStreamBtn('streaming', 'STREAMING…', label);

                var dots = document.querySelectorAll('#demo-phases .demo-phase-dot');
                if (dots[info.phaseIndex]) dots[info.phaseIndex].classList.add('active');
            },
            onPhaseComplete: function(info) {
                var dots = document.querySelectorAll('#demo-phases .demo-phase-dot');
                if (dots[info.phaseIndex]) {
                    dots[info.phaseIndex].classList.remove('active');
                    dots[info.phaseIndex].classList.add('complete');
                }
            },
            onProgress: function(pct) {
                var p = Math.max(0, Math.min(1, pct || 0));
                barEl.style.width = Math.round(p * 100) + '%';
            },
            onError: function(err, phase) {
                lastError = err;
                var msg = typeof err === 'string' ? err : ('Phase ' + (phase + 1) + ' failed');
                statusEl.textContent = 'Warning: ' + msg + ' — continuing…';
            },
            onComplete: function(info) {
                _isStreaming = false;
                _lastStreamedId = scenarioId;
                try { window.__SA_LAST_SCENARIO__ = scenarioId; } catch(e) {}
                // v1.9.3 — point the dashboard's Scenario filter at what was just
                // streamed so the SPL panels (filtered by $scenario$) populate with
                // this scenario's events (scenario input is searchWhenChanged=true).
                try {
                    var _d = mvc.Components.get('default'), _s = mvc.Components.get('submitted');
                    if (_d) _d.set('scenario', scenarioId);
                    if (_s) _s.set('scenario', scenarioId);
                } catch (e) {}
                // v1.9.3 — force the panels to re-fetch the just-streamed events.
                // A manual Submit reuses the cached (empty) job dispatched at load,
                // so we re-dispatch each SearchManager directly via startSearch().
                // Retry a couple of times because indexing makes the events
                // searchable a beat after the stream's onComplete fires.
                function _refreshPanels() {
                    try {
                        var inst = (mvc.Components.getInstances && mvc.Components.getInstances()) || {};
                        Object.keys(inst).forEach(function(k) {
                            var c = inst[k];
                            if (c && typeof c.startSearch === 'function') { try { c.startSearch(); } catch (e) {} }
                        });
                    } catch (e) {}
                    // v2.0.0 — nudge the RBA hero timeline to re-read its model
                    // (the streamer just seeded index=risk/notable for this scenario).
                    try { if (window.ARRba && window.ARRba.refresh) window.ARRba.refresh(); } catch (e) {}
                }
                // Spread retries: indexing makes the freshly-streamed events
                // searchable several seconds after onComplete, so the early
                // passes warm the panels and the later ones catch the data.
                [2000, 5000, 9000, 15000].forEach(function(t) { setTimeout(_refreshPanels, t); });

                if (streamBtn) streamBtn.disabled = false;
                if (clearBtn) clearBtn.disabled = false;
                if (selectEl) selectEl.disabled = false;

                barEl.style.width = '100%';
                statusEl.textContent = (info && info.totalEvents ? info.totalEvents : scenarioInfo.totalEvents) +
                    ' events streamed — "' + (info && info.scenarioName ? info.scenarioName : scenarioInfo.name) + '"';

                setStreamBtn('complete', '✓ COMPLETE — DATA LIVE', 'Click anywhere to dismiss');
                _widgets.fab.classList.remove('streaming');
                setFabSuccess(5);

                actionsEl.classList.add('visible');
                showNotice('Data is live in index=sa_attack_sim. Visit Blast Radius, Attack Chain, or MITRE Coverage to explore.', 'success');

                // Reset button label after 30s
                setTimeout(function() {
                    setStreamBtn('ready', 'Stream Scenario');
                    progressEl.classList.remove('active');
                    barEl.style.width = '0%';
                    actionsEl.classList.remove('visible');
                    resetPhaseDots();
                    hideNotice();
                }, 30000);
            }
        });

        if (!didStart) {
            _isStreaming = false;
            if (streamBtn) streamBtn.disabled = false;
            if (clearBtn) clearBtn.disabled = false;
            if (selectEl) selectEl.disabled = false;
            setStreamBtn('ready', 'Stream Scenario');
            _widgets.fab.classList.remove('streaming');
            showNotice('Could not start stream: another stream is already in progress.', 'error');
            autoHideNotice(5000);
        }
    }

    // ----- CLEAR FLOW -----
    // Two-stage inline confirm: first click arms ("Confirm: clear all demo data"),
    // second click within 6s actually executes. Otherwise it auto-disarms.

    var _clearConfirmPending = false;
    var _clearConfirmTimeout = null;

    function startClearFlow() {
        if (_isStreaming) {
            showNotice('Cannot clear data while a stream is in progress.', 'error');
            autoHideNotice(4000);
            return;
        }
        var btn = document.getElementById('demo-clear-btn');
        if (!btn) return;

        if (!_clearConfirmPending) {
            _clearConfirmPending = true;
            btn.classList.add('confirm');
            btn.textContent = 'Confirm? Click again to wipe sa_attack_sim';
            showNotice('This will delete ALL events in index=sa_attack_sim. Click the red button again to confirm.', 'info');
            if (_clearConfirmTimeout) clearTimeout(_clearConfirmTimeout);
            _clearConfirmTimeout = setTimeout(function() {
                _clearConfirmPending = false;
                if (btn) {
                    btn.classList.remove('confirm');
                    btn.textContent = 'Clear Demo Data';
                }
                hideNotice();
            }, 6000);
            return;
        }

        // Confirmed - run clear
        if (_clearConfirmTimeout) clearTimeout(_clearConfirmTimeout);
        _clearConfirmPending = false;
        btn.classList.remove('confirm');
        btn.classList.add('working');
        btn.disabled = true;
        btn.textContent = 'Clearing…';
        showNotice('Wiping sa_attack_sim…', 'info');

        DemoStreamer.clearScenarioData(
            function onDone() {
                btn.classList.remove('working');
                btn.classList.add('done');
                btn.textContent = '✓ Cleared';
                showNotice('Demo data cleared. Stream a new scenario to repopulate.', 'success');
                autoHideNotice(6000);
                setTimeout(function() {
                    btn.classList.remove('done');
                    btn.disabled = false;
                    btn.textContent = 'Clear Demo Data';
                }, 4000);
            },
            function onError(err) {
                btn.classList.remove('working');
                btn.disabled = false;
                btn.textContent = 'Clear Demo Data';
                showNotice('Clear failed: ' + (err || 'unknown error'), 'error');
                autoHideNotice(8000);
            }
        );
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    function bindEvents() {
        var fab = _widgets.fab;
        var panel = _widgets.panel;
        var panelVisible = false;

        // Toggle panel on FAB click
        fab.addEventListener('click', function(e) {
            e.stopPropagation();
            panelVisible = !panelVisible;
            panel.classList.toggle('visible', panelVisible);
        });

        // Close panel when clicking outside (but not while a stream is running -
        // user might want to walk away and watch)
        document.addEventListener('click', function(e) {
            if (!panelVisible) return;
            if (panel.contains(e.target) || fab.contains(e.target)) return;
            panelVisible = false;
            panel.classList.remove('visible');
        });

        // Scenario dropdown change
        var selectEl = document.getElementById('demo-scenario-select');
        if (selectEl) {
            selectEl.addEventListener('change', function() {
                _selectedId = this.value;
                var info = DemoStreamer.getScenarioInfo(_selectedId);
                applySummary(info);
                // v1.9.3 — keep the main dashboard Scenario dropdown in lock-step so
                // the two scenario controls never disagree about what gets streamed.
                try { var d = mvc.Components.get('default'); if (d) d.set('scenario', _selectedId); } catch (e) {}
                hideNotice();
            });
        }

        // v1.9.3 — reflect main dashboard Scenario changes back into the FAB widget
        // (the other half of the lock-step), so picking "Stillwater" up top selects
        // it in the FAB too and the Stream button streams exactly that scenario.
        try {
            var _md = mvc.Components.get('default');
            function _syncFabFromMain(model, val) {
                if (!val || val === '*' || val === 'all' || val === _selectedId) return;
                if (!DemoStreamer.getScenarioInfo(val)) return;
                _selectedId = val;
                var se = document.getElementById('demo-scenario-select');
                if (se) se.value = val;
                applySummary(DemoStreamer.getScenarioInfo(val));
            }
            if (_md) { _md.on('change:scenario', _syncFabFromMain); _md.on('change:form.scenario', _syncFabFromMain); }
        } catch (e) {}

        // Stream button
        var streamBtn = document.getElementById('demo-stream-btn');
        if (streamBtn) {
            streamBtn.addEventListener('click', function() {
                if (streamBtn.classList.contains('complete')) {
                    // Dismiss to "ready" state
                    setStreamBtn('ready', 'Stream Scenario');
                    document.getElementById('demo-progress').classList.remove('active');
                    document.getElementById('demo-bar').style.width = '0%';
                    document.getElementById('demo-actions').classList.remove('visible');
                    resetPhaseDots();
                    hideNotice();
                    return;
                }
                if (streamBtn.classList.contains('streaming')) return;
                startStreamFlow();
            });
        }

        // Clear button
        var clearBtn = document.getElementById('demo-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', startClearFlow);
        }
    }

    function init() {
        injectStyles();

        // Pull scenario list once
        try {
            _scenarios = DemoStreamer.listScenarios() || [];
        } catch (e) {
            _scenarios = [];
        }

        if (_scenarios.length === 0) {
            // Should never happen, but degrade gracefully
            _scenarios = [];
        }
        _selectedId = _scenarios[0] ? _scenarios[0].id : null;

        _widgets = createWidget();
        bindEvents();

        // Initial summary card
        if (_selectedId) {
            applySummary(DemoStreamer.getScenarioInfo(_selectedId));
        }
    }

    // ========================================================================
    // EXTERNAL ENTRY POINTS
    // ========================================================================

    // Expose startStream for external callers (e.g. attack_overview hero button).
    // - With a string arg: stream that specific scenario.
    // - With an object: legacy callback shape (backwards compat).
    // - With nothing: stream the currently selected scenario (or default).
    function startStream(arg, maybeCallbacks) {
        if (typeof arg === 'string') {
            return DemoStreamer.streamScenario(arg, maybeCallbacks || {});
        }
        if (arg && typeof arg === 'object') {
            // legacy: arg IS the callbacks object
            return DemoStreamer.start(arg);
        }
        // No args - delegate to UI flow
        startStreamFlow();
    }

    function getLastStreamedScenario() {
        if (_lastStreamedId) return _lastStreamedId;
        try { if (window.__SA_LAST_SCENARIO__) return window.__SA_LAST_SCENARIO__; } catch(e) {}
        return null;
    }

    return {
        init: init,
        startStream: startStream,
        getLastStreamedScenario: getLastStreamedScenario
    };
});
