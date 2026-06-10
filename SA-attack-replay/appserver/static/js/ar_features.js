// ============================================================================
// AR_FEATURES.JS — Auto-Narrate generator + First-Visit Splash
// ============================================================================
var _arFeatStaticPrefix = ((typeof $C !== 'undefined' && $C['MRSPARKLE_ROOT_PATH']) || '') + '/static/app/SA-attack-replay/js/';

require([
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    // Must carry the same ?v= as ar_blast so this resolves to the SAME (fresh)
    // ar_streamer module — otherwise it loads a stale cached copy missing newer
    // scenarios (e.g. op_stillwater) and the JS narrative silently falls back.
    _arFeatStaticPrefix + 'ar_streamer.js?v=2.0.2',
    'splunkjs/mvc/simplexml/ready!'
], function($, mvc, SearchManager, DemoStreamer) {
    'use strict';

    // ========================================================================
    // AUTO-NARRATE — generate prose summary from scenario events
    // ========================================================================
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function phaseLabel(p) {
        var map = {
            initial_access: 'gained initial access',
            execution: 'executed payload',
            persistence: 'established persistence',
            privilege_escalation: 'escalated privileges',
            defense_evasion: 'evaded defenses',
            credential_access: 'harvested credentials',
            discovery: 'enumerated the environment',
            lateral_movement: 'moved laterally',
            collection: 'collected data',
            c2: 'established command-and-control',
            exfiltration: 'exfiltrated data',
            impact: 'caused impact'
        };
        return map[p] || p.replace(/_/g, ' ');
    }

    function renderNarrative(rows) {
        var body = document.getElementById('ar-narrate-body');
        if (!body) return;
        if (!rows || rows.length === 0) {
            body.innerHTML = '<div class="ar-narrate-placeholder">No scenario events yet. Stream a scenario via the orange FAB to generate the narrative.</div>';
            return;
        }

        // Group rows by scenario_id
        var scenarios = {};
        rows.forEach(function(r) {
            var sid = r.scenario_id || 'unknown';
            if (!scenarios[sid]) scenarios[sid] = [];
            scenarios[sid].push(r);
        });

        // v1.9.5 — render as a clean, scannable timeline: one row per phase with
        // aligned columns (time · host · what happened · ATT&CK technique), instead
        // of a run-on paragraph that was hard to read.
        var html = '';
        Object.keys(scenarios).forEach(function(sid) {
            var scn = (typeof DemoStreamer.getScenario === 'function') ? DemoStreamer.getScenario(sid) : null;
            var scnName = scn ? scn.name : sid;
            var events = scenarios[sid];

            html += '<div class="ar-narrate-scn">' + escapeHtml(scnName) + '</div>';
            html += '<ol class="ar-narrate-list">';
            events.forEach(function(e) {
                var tech = (e.mitre_technique && e.mitre_technique !== '-') ? e.mitre_technique : '';
                html += '<li class="ar-narrate-item">' +
                    '<span class="ar-narrate-time">' + escapeHtml(e.clock || '') + '</span>' +
                    '<span class="ar-narrate-host">' + escapeHtml(e.host_label || '') + '</span>' +
                    '<span class="ar-narrate-desc">' + escapeHtml(e.description || phaseLabel(e.kill_chain_phase)) + '</span>' +
                    (tech ? '<span class="ar-narrate-mitre">' + escapeHtml(tech) + '</span>' : '<span class="ar-narrate-mitre-empty"></span>') +
                    '</li>';
            });
            html += '</ol>';
        });

        body.innerHTML = html;
    }

    // v1.9.6 — build narrative rows straight from a scenario's bundled JS
    // events, so the Attack Narrative always matches the SELECTED demo (not
    // whatever happens to be streamed in the index). Mirrors ar_narrative_events:
    // pick the meaningful kill-chain phases (or any critical event), one row per
    // phase, in time order.
    function narrativeRowsFromScenario(sid) {
        var scn = (typeof DemoStreamer.getScenario === 'function') ? DemoStreamer.getScenario(sid) : null;
        if (!scn || !scn.phases) return [];
        var all = [];
        scn.phases.forEach(function(p) { (p.events || []).forEach(function(e) { all.push(e); }); });
        var maxOff = all.reduce(function(m, e) { return Math.max(m, e._time_offset || 0); }, 0) || 1;
        var base = Date.now() - maxOff * 1000;
        var multiDay = maxOff > 86400;
        var WANT = { initial_access: 1, credential_access: 1, lateral_movement: 1,
            privilege_escalation: 1, defense_evasion: 1, exfiltration: 1, impact: 1 };
        var sel = all.filter(function(e) { return WANT[e.kill_chain_phase] || e.severity === 'critical'; });
        sel.sort(function(a, b) { return (a._time_offset || 0) - (b._time_offset || 0); });
        var seen = {}, rows = [];
        sel.forEach(function(e) {
            if (seen[e.kill_chain_phase]) return;
            seen[e.kill_chain_phase] = true;
            var d = new Date(base + (e._time_offset || 0) * 1000);
            var clock = multiDay
                ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
                    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            rows.push({
                clock: clock, kill_chain_phase: e.kill_chain_phase, mitre_technique: e.mitre_technique,
                host_label: e.host || e.orig_host || 'unknown', description: e.description || '',
                scenario_id: e.scenario_id || sid
            });
        });
        return rows;
    }

    // When a known demo scenario is selected, render its JS narrative and lock
    // out the SPL search (whose stale/empty results were what "hung around").
    var _jsNarrativeActive = false;
    function updateNarrativeForScenario(sid) {
        if (sid && typeof DemoStreamer.getScenario === 'function' && DemoStreamer.getScenario(sid)) {
            _jsNarrativeActive = true;
            renderNarrative(narrativeRowsFromScenario(sid));
        } else {
            _jsNarrativeActive = false;  // live / "All Scenarios" → let SPL drive
        }
    }

    // SPL search stays for live mode; gated off when a JS scenario is active.
    var narrateSearch = new SearchManager({
        id: 'ar_narrate_search',
        search: '`ar_narrative_events($form.entity$,$form.scenario$)`',
        earliest_time: '$form.time_range.earliest$',
        latest_time: '$form.time_range.latest$',
        preview: false,
        cache: false
    }, { tokens: true });

    narrateSearch.data('results', { count: 0 }).on('data', function(results) {
        if (_jsNarrativeActive) return;
        var data = results.data();
        if (!data) return;
        var rows = (data.rows || []).map(function(row) {
            var obj = {};
            (data.fields || []).forEach(function(f, i) { obj[f] = row[i]; });
            return obj;
        });
        renderNarrative(rows);
    });

    // ========================================================================
    // MODE NORMALIZER (v1.9.2) — single reliable source of truth for the
    // live/demo gate. The SimpleXML <change> handler on the Data Source radio
    // does NOT fire when ?form.mode= is applied on initial load (deep-link),
    // and was proving unreliable when the radio value changed — which left
    // mode_demo set in Live mode, so the demo panels (and demo data) kept
    // rendering underneath the live ones. JS token listeners DO fire on every
    // change (URL, programmatic, or click), so we derive mode_demo / mode_live,
    // the KPI macros, and the title wording from the actual mode value here on
    // both token models. Mutually exclusive: Live unsets demo and vice-versa.
    var _mDef = mvc.Components.get('default'), _mSub = mvc.Components.get('submitted');
    function _applyMode(mode) {
        var isLive = (String(mode) === 'live');
        [_mDef, _mSub].forEach(function(m) {
            if (!m) return;
            if (isLive) {
                m.set('mode_live', '1'); m.unset('mode_demo');
                m.set('title_mode', 'live CIM data');
                m.set('macro_compromised', 'ar_compromised_count_live');
                m.set('macro_connections', 'ar_connection_count_live');
                m.set('macro_max_risk', 'ar_max_risk_live');
            } else {
                m.set('mode_demo', '1'); m.unset('mode_live');
                m.set('title_mode', 'bundled demo scenario');
                m.set('macro_compromised', 'ar_compromised_count_demo');
                m.set('macro_connections', 'ar_connection_count_demo');
                m.set('macro_max_risk', 'ar_max_risk_demo');
            }
        });
        // v1.9.4 — in Live mode, hide the demo Stream FAB/panel so a user can't
        // contaminate live data by streaming bundled scenarios into the index.
        try { document.body.classList.toggle('ar-mode-live', isLive); } catch (e) {}
    }
    function _onMode(model, value) { _applyMode(value); }
    [_mDef, _mSub].forEach(function(m) {
        if (!m) return;
        m.on('change:mode', _onMode);
        m.on('change:form.mode', _onMode);
    });
    // Apply on load (a few times, to catch late ?form.mode= deep-link application).
    [150, 500, 1200].forEach(function(t) {
        setTimeout(function() {
            var mode;
            try {
                mode = (_mSub && (_mSub.get('form.mode') || _mSub.get('mode'))) ||
                       (_mDef && (_mDef.get('form.mode') || _mDef.get('mode'))) || 'demo';
            } catch (e) { mode = 'demo'; }
            _applyMode(mode);
        }, t);
    });

    // Follow the scenario dropdown (both token models / event names, like ar_blast).
    function _onScn(model, value) { updateNarrativeForScenario(value); }
    var _def = mvc.Components.get('default'), _sub = mvc.Components.get('submitted');
    [_def, _sub].forEach(function(m) {
        if (!m) return;
        m.on('change:scenario', _onScn);
        m.on('change:form.scenario', _onScn);
    });
    setTimeout(function() {
        var initS;
        try {
            initS = (_sub && (_sub.get('form.scenario') || _sub.get('scenario'))) ||
                    (_def && (_def.get('form.scenario') || _def.get('scenario'))) || '*';
        } catch (e) { initS = '*'; }
        updateNarrativeForScenario(initS);
    }, 700);

    // ========================================================================
    // FIRST-VISIT SPLASH OVERLAY
    // ========================================================================
    var KEY = 'ar_first_visit_seen_v1';

    function showSplash() {
        if (localStorage.getItem(KEY)) return; // already seen
        // Only on blast_radius dashboard
        if (!/blast_radius/.test(window.location.pathname)) return;

        var overlay = document.createElement('div');
        overlay.className = 'ar-splash-overlay';
        overlay.innerHTML =
            '<div class="ar-splash-card">' +
              '<div class="ar-splash-eyebrow">First Visit / Attack Replay</div>' +
              '<h2 class="ar-splash-title">See it in motion</h2>' +
              '<p class="ar-splash-body">Stream the bundled APT-29 attack scenario and watch it replay across the topology with DVR-style scrubbing. Takes about 90 seconds end-to-end.</p>' +
              '<div class="ar-splash-actions">' +
                '<button class="ar-splash-btn ar-splash-btn-primary" id="ar-splash-go">Run Operation Midnight Eclipse</button>' +
                '<button class="ar-splash-btn ar-splash-btn-ghost" id="ar-splash-skip">Skip for now</button>' +
              '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        function dismiss(persist) {
            overlay.classList.remove('visible');
            setTimeout(function() { try { overlay.remove(); } catch(e) {} }, 350);
            if (persist) localStorage.setItem(KEY, '1');
        }

        document.getElementById('ar-splash-skip').addEventListener('click', function() { dismiss(true); });
        document.getElementById('ar-splash-go').addEventListener('click', function() {
            dismiss(true);
            // Stream then play
            if (DemoStreamer && typeof DemoStreamer.streamScenario === 'function') {
                DemoStreamer.streamScenario('op_midnight_eclipse', {
                    onComplete: function() {
                        // Auto-click play after 2s for events to settle
                        setTimeout(function() {
                            var playBtn = document.getElementById('br-play');
                            if (playBtn) playBtn.click();
                        }, 2000);
                    }
                });
            }
        });
    }

    // Defer to next tick so DOM + other scripts are ready
    setTimeout(showSplash, 800);
});
