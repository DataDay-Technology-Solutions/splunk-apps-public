// ============================================================================
// ar_lanes.js — Host-swimlane "incident timeline" renderer (v1.9.2)
// ----------------------------------------------------------------------------
// A SOC-analyst-oriented alternative to the force-directed topology: each
// entity (host / user / external) gets a horizontal lane, the X axis is time,
// every event is a dot coloured by its MITRE tactic, lateral movement is drawn
// as an arrow crossing lanes, and a vertical "now" line sweeps as the DVR plays.
//
// Self-contained: ar_blast.js feeds it a normalised event list + the SVG, then
// calls setPlayhead(offsetSeconds) each frame. Works for every demo scenario
// AND live mode because they share the same event shape.
//   event = { host, dest, t, tactic, technique, risk, desc, sourcetype }
//     t = seconds from campaign start (0 .. maxT)
// ============================================================================
define(['jquery'], function ($) {
    'use strict';

    var SVGNS = 'http://www.w3.org/2000/svg';

    // MITRE tactic → colour (ATT&CK kill-chain order). Unknown falls back grey.
    var TACTIC_ORDER = [
        'initial access', 'execution', 'persistence', 'privilege escalation',
        'defense evasion', 'credential access', 'discovery', 'lateral movement',
        'collection', 'command and control', 'c2', 'exfiltration', 'impact'
    ];
    var TACTIC_COLORS = {
        'initial access': '#4aa3ff', 'execution': '#5ad1e0', 'persistence': '#7c6cff',
        'privilege escalation': '#b06cff', 'defense evasion': '#9aa0b5',
        'credential access': '#ffd24a', 'discovery': '#46e0a0',
        'lateral movement': '#ff9a3c', 'collection': '#ff6fae',
        'command and control': '#ff5a5a', 'c2': '#ff5a5a',
        'exfiltration': '#ff3b3b', 'impact': '#ff2d2d'
    };
    function norm(s) { return String(s || '').toLowerCase().replace(/[\s\-_&,]+/g, ' ').trim(); }
    function tacticColor(t) { return TACTIC_COLORS[norm(t)] || '#8a93ab'; }
    // v1.9.2 — real CIM/ES data often has no ATT&CK tactic; label those clearly
    // (grey) instead of an invisible blank, so live mode stays legible.
    function hasTactic(t) { var n = norm(t); return !!(n && n !== '-' && TACTIC_COLORS[n]); }
    function tacticLabel(t) {
        if (!hasTactic(t)) return 'Untagged';
        return norm(t).replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    }

    function el(name, attrs) {
        var e = document.createElementNS(SVGNS, name);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }

    // Lane sort: workstations (where intrusions start) top → servers → DC →
    // external/C2 at the bottom, so the eye reads the attack flowing down+right.
    function entityRank(meta) {
        var id = norm(meta.id), type = norm(meta.type);
        if (type.indexOf('external') > -1 || /^ext|c2|\d+\.\d+\.\d+\.\d+/.test(id)) return 5;
        if (type.indexOf('domain') > -1 || /dc\d|domain/.test(id)) return 4;
        if (type.indexOf('server') > -1 || /^srv|server/.test(id)) return 3;
        if (type.indexOf('workstation') > -1 || /^ws/.test(id)) return 1;
        return 2;
    }
    function entityIcon(meta) {
        var r = entityRank(meta);
        return r === 5 ? '🌐' : r === 4 ? '👑' : r === 3 ? '🖥' : '💻';
    }

    // ------------------------------------------------------------------------
    // createLaneView(svgEl, events, opts) -> controller
    //   opts: { maxT, formatTime(t) -> string, onPick(ev) }
    // ------------------------------------------------------------------------
    function createLaneView(svgEl, events, opts) {
        opts = opts || {};
        events = (events || []).filter(function (e) { return e && e.host; })
            .slice().sort(function (a, b) { return (a.t || 0) - (b.t || 0); });

        var maxT = opts.maxT || events.reduce(function (m, e) { return Math.max(m, e.t || 0); }, 0) || 1;
        var fmt = opts.formatTime || function (t) { return Math.round(t) + 's'; };

        // Build the lane list (one per entity), ordered by rank then first-seen.
        var metaById = {}, firstSeen = {};
        events.forEach(function (e) {
            [e.host, e.dest].forEach(function (h) {
                if (!h) return;
                if (!metaById[h]) metaById[h] = { id: h, type: e.hostType || '' };
            });
            if (firstSeen[e.host] === undefined) firstSeen[e.host] = e.t || 0;
        });
        var lanes = Object.keys(metaById).map(function (id) { return metaById[id]; });
        lanes.sort(function (a, b) {
            var ra = entityRank(a), rb = entityRank(b);
            if (ra !== rb) return ra - rb;
            return (firstSeen[a.id] || 0) - (firstSeen[b.id] || 0);
        });
        var laneIndex = {};
        lanes.forEach(function (l, i) { laneIndex[l.id] = i; });

        // Geometry (viewBox space; ar_blast sizes the SVG responsively).
        // Vertical stack: small top gap → lanes → time axis (bottom) → legend.
        var W = 1000;
        // MT reserves a top band for the attacker-thought caption (true dead
        // space — always clear of the lanes and the bottom legend).
        var ML = 150, MR = 28, MT = 60, MB = 150;
        var H = Math.max(320, MT + lanes.length * 46 + MB);
        svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        var plotW = W - ML - MR, plotH = H - MT - MB;
        var laneH = plotH / Math.max(1, lanes.length);
        function laneY(id) { return MT + (laneIndex[id] + 0.5) * laneH; }
        function xT(t) { return ML + (Math.max(0, Math.min(t, maxT)) / maxT) * plotW; }

        // Clear + scaffold layers
        while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
        var gGrid = el('g'), gArrows = el('g'), gDots = el('g'), gAxis = el('g'), gNow = el('g'), gThought = el('g');
        [gGrid, gArrows, gDots, gAxis, gNow, gThought].forEach(function (g) { svgEl.appendChild(g); });

        // Attacker-thought caption, rendered in the reserved top band. Width is
        // capped to the left ~60% of the plot so it never reaches the playhead
        // KPI counters that sit at the top-right in lane mode.
        var thoughtW = plotW * 0.6;
        var thoughtBg = el('rect', {
            x: ML, y: 8, width: thoughtW, height: MT - 18, rx: 7,
            fill: 'rgba(40,14,14,0.55)', stroke: 'rgba(255,90,90,0.35)', 'stroke-width': '1', opacity: '0'
        });
        var thoughtTxt = el('text', {
            x: ML + 14, y: 30, fill: '#ffb3b3', 'font-size': '14',
            'font-style': 'italic', 'font-family': 'var(--ar-sans,-apple-system)', opacity: '0'
        });
        gThought.appendChild(thoughtBg);
        gThought.appendChild(thoughtTxt);
        function setThought(text) {
            if (!text) { thoughtBg.setAttribute('opacity', '0'); thoughtTxt.setAttribute('opacity', '0'); return; }
            // word-wrap into up to 2 lines that fit plotW
            while (thoughtTxt.firstChild) thoughtTxt.removeChild(thoughtTxt.firstChild);
            var words = ('💭  ' + text).split(' '), lines = [], cur = '';
            var maxChars = Math.floor((thoughtW - 28) / 8);  // ~8px/char at 14px
            words.forEach(function (w) {
                if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
                else cur = (cur + ' ' + w).trim();
            });
            if (cur) lines.push(cur);
            if (lines.length > 2) { lines = lines.slice(0, 2); lines[1] = lines[1].replace(/.{1}$/, '…'); }
            lines.forEach(function (ln, i) {
                var ts = el('tspan', { x: ML + 14, dy: i === 0 ? 0 : 16 });
                ts.textContent = ln;
                thoughtTxt.appendChild(ts);
            });
            thoughtBg.setAttribute('opacity', '1');
            thoughtTxt.setAttribute('opacity', '1');
        }

        // Lane bands + entity labels
        lanes.forEach(function (l, i) {
            var y0 = MT + i * laneH;
            gGrid.appendChild(el('rect', {
                x: ML, y: y0, width: plotW, height: laneH,
                fill: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'
            }));
            var label = el('text', {
                x: ML - 10, y: laneY(l.id) + 4, 'text-anchor': 'end',
                fill: '#cfd6ee', 'font-size': '13', 'font-family': 'var(--ar-sans,-apple-system)',
                'font-weight': '600'
            });
            label.textContent = entityIcon(l) + ' ' + l.id;
            gGrid.appendChild(label);
        });

        // Time axis: ~6 ticks across the span
        var TICKS = 6;
        for (var k = 0; k <= TICKS; k++) {
            var tt = (maxT / TICKS) * k, x = xT(tt);
            gAxis.appendChild(el('line', {
                x1: x, y1: MT, x2: x, y2: MT + plotH,
                stroke: 'rgba(255,255,255,0.07)', 'stroke-width': '1'
            }));
            // Time labels live BELOW the plot (the top was getting clipped).
            var tl = el('text', {
                x: x, y: MT + plotH + 16, 'text-anchor': 'middle', fill: '#aeb6cf',
                'font-size': '12', 'font-family': 'var(--ar-sans,-apple-system)'
            });
            tl.textContent = fmt(tt);
            gAxis.appendChild(tl);
        }

        // Lateral-movement arrows (an event whose dest is a *different* lane).
        var arrowEls = [];
        events.forEach(function (e) {
            if (!e.dest || e.dest === e.host || laneIndex[e.dest] === undefined) return;
            var x = xT(e.t || 0), y1 = laneY(e.host), y2 = laneY(e.dest);
            var path = el('path', {
                d: 'M' + x + ',' + y1 + ' C' + (x + 26) + ',' + ((y1 + y2) / 2) + ' ' +
                    (x + 26) + ',' + ((y1 + y2) / 2) + ' ' + x + ',' + y2,
                fill: 'none', stroke: tacticColor(e.tactic), 'stroke-width': '1.5',
                'stroke-dasharray': '4 3', opacity: '0', 'marker-end': 'url(#ar-lane-arrow)'
            });
            path.__t = e.t || 0;
            gArrows.appendChild(path);
            arrowEls.push(path);
        });

        // Arrowhead marker (once)
        var defs = el('defs');
        var marker = el('marker', {
            id: 'ar-lane-arrow', markerWidth: '7', markerHeight: '7',
            refX: '5', refY: '3', orient: 'auto', markerUnits: 'strokeWidth'
        });
        marker.appendChild(el('path', { d: 'M0,0 L6,3 L0,6 Z', fill: '#9aa0b5' }));
        defs.appendChild(marker);
        svgEl.insertBefore(defs, gGrid);

        // Event dots
        var dotEls = [];
        events.forEach(function (e) {
            var r = 4 + Math.min(6, (e.risk || 0) / 18);
            var c = el('circle', {
                cx: xT(e.t || 0), cy: laneY(e.host), r: r,
                fill: tacticColor(e.tactic), stroke: '#08081a', 'stroke-width': '1.5',
                opacity: '0', 'class': 'ar-lane-dot', 'data-tech': e.technique || ''
            });
            c.__t = e.t || 0;
            c.__ev = e;
            // Native hover tooltip (no coupling to ar_blast's node tooltip).
            var title = el('title');
            title.textContent =
                (e.technique ? e.technique + ' · ' : '') + tacticLabel(e.tactic) + '\n' +
                fmt(e.t || 0) + '\n' +
                e.host + (e.dest && e.dest !== e.host ? '  →  ' + e.dest : '') + '\n' +
                (e.desc || '');
            c.appendChild(title);
            if ((e.risk || 0) >= 85) c.setAttribute('filter', 'drop-shadow(0 0 5px ' + tacticColor(e.tactic) + ')');
            c.addEventListener('mouseenter', function () { if (opts.onPick) opts.onPick(e, c); });
            c.addEventListener('click', function () { if (opts.onPick) opts.onPick(e, c, true); });
            gDots.appendChild(c);
            dotEls.push(c);
        });

        // "Now" sweep line
        var nowLine = el('line', {
            x1: ML, y1: MT - 6, x2: ML, y2: MT + plotH + 6,
            stroke: '#ff5a5a', 'stroke-width': '2', opacity: '0.9'
        });
        var nowDot = el('circle', { cx: ML, cy: MT - 6, r: 3, fill: '#ff5a5a' });
        gNow.appendChild(nowLine); gNow.appendChild(nowDot);

        // Legend (tactic colours present) — wraps into rows in the bottom band,
        // below the time axis, so it never overlaps the lanes.
        var present = [], hasUntagged = false;
        events.forEach(function (e) {
            if (hasTactic(e.tactic)) { var n = norm(e.tactic); if (present.indexOf(n) < 0) present.push(n); }
            else hasUntagged = true;
        });
        present.sort(function (a, b) { return TACTIC_ORDER.indexOf(a) - TACTIC_ORDER.indexOf(b); });
        if (hasUntagged) present.push('untagged');  // single grouped chip for no-ATT&CK events
        // v1.9.4 — legend sits in a readable strip just below the time axis (and
        // above the floating transport controls), with a dark background so the
        // tactic chips read over the busy plot. Width-capped to the plot so it
        // can't run under the right-hand KPI counters.
        var gLegend = el('g');
        svgEl.appendChild(gLegend);
        var rowH = 18, legendTop = MT + plotH + 14;
        var bg = el('rect', { x: ML - 8, y: legendTop, width: plotW + 16, height: rowH + 10, rx: 7,
            fill: 'rgba(8,10,22,0.82)', stroke: 'rgba(255,255,255,0.07)', 'stroke-width': '1' });
        gLegend.appendChild(bg);
        var lx = ML, ly = legendTop + 18, rows = 1;
        present.forEach(function (n) {
            var isUnt = n === 'untagged';
            var lbl = isUnt ? 'Untagged (no ATT&CK tag)' : n.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
            var col = isUnt ? '#8a93ab' : tacticColor(n);
            var itemW = 26 + lbl.length * 6.8;
            if (lx + itemW > W - MR) { lx = ML; ly += rowH; rows++; bg.setAttribute('height', rows * rowH + 10); }  // wrap
            gLegend.appendChild(el('circle', { cx: lx, cy: ly - 4, r: 5, fill: col }));
            var t = el('text', {
                x: lx + 11, y: ly, fill: '#cdd4ea', 'font-size': '11.5', 'font-weight': '600',
                'font-family': 'var(--ar-sans,-apple-system)'
            });
            t.textContent = lbl;
            gLegend.appendChild(t);
            lx += itemW;
        });

        // setPlayhead: reveal everything up to `offset`, sweep the now-line.
        function setPlayhead(offset) {
            var x = xT(offset);
            nowLine.setAttribute('x1', x); nowLine.setAttribute('x2', x);
            nowDot.setAttribute('cx', x);
            dotEls.forEach(function (c) {
                c.setAttribute('opacity', c.__t <= offset ? '1' : '0.06');
            });
            arrowEls.forEach(function (p) {
                p.setAttribute('opacity', p.__t <= offset ? '0.85' : '0');
            });
        }
        setPlayhead(0);

        // --------------------------------------------------------------------
        // Pan + scroll-zoom for granularity. Manipulates the SVG viewBox; the
        // lane coordinates are untouched so dots/sweep stay correct. Drag on
        // the background pans; wheel zooms toward the cursor; double-click
        // resets. Handlers bind once per SVG element (state lives on the SVG).
        // --------------------------------------------------------------------
        svgEl.__vbBase = { W: W, H: H };
        svgEl.__vb = { x: 0, y: 0, w: W, h: H };
        function applyVB() {
            var v = svgEl.__vb;
            svgEl.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
        }
        function clampVB() {
            var v = svgEl.__vb, b = svgEl.__vbBase;
            v.w = Math.min(b.W, v.w); v.h = Math.min(b.H, v.h);
            v.x = Math.max(0, Math.min(b.W - v.w, v.x));
            v.y = Math.max(0, Math.min(b.H - v.h, v.y));
        }
        if (!svgEl.__laneZoomBound) {
            svgEl.__laneZoomBound = true;
            svgEl.style.cursor = 'grab';
            svgEl.addEventListener('wheel', function (e) {
                e.preventDefault();
                var v = svgEl.__vb, b = svgEl.__vbBase;
                var rect = svgEl.getBoundingClientRect();
                var mx = v.x + (e.clientX - rect.left) / rect.width * v.w;
                var my = v.y + (e.clientY - rect.top) / rect.height * v.h;
                var f = e.deltaY < 0 ? 0.85 : 1 / 0.85;
                var nw = Math.min(b.W, Math.max(b.W * 0.12, v.w * f));
                var nh = nw * (b.H / b.W);
                v.x = mx - (mx - v.x) * (nw / v.w);
                v.y = my - (my - v.y) * (nh / v.h);
                v.w = nw; v.h = nh;
                clampVB(); applyVB();
            }, { passive: false });
            var pan = null;
            svgEl.addEventListener('mousedown', function (e) {
                if (e.target && e.target.classList && e.target.classList.contains('ar-lane-dot')) return;
                var v = svgEl.__vb;
                pan = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
                svgEl.style.cursor = 'grabbing';
            });
            window.addEventListener('mousemove', function (e) {
                if (!pan) return;
                var v = svgEl.__vb, rect = svgEl.getBoundingClientRect();
                v.x = pan.vx - (e.clientX - pan.x) / rect.width * v.w;
                v.y = pan.vy - (e.clientY - pan.y) / rect.height * v.h;
                clampVB(); applyVB();
            });
            window.addEventListener('mouseup', function () { pan = null; svgEl.style.cursor = 'grab'; });
            svgEl.addEventListener('dblclick', function () {
                svgEl.__vb = { x: 0, y: 0, w: svgEl.__vbBase.W, h: svgEl.__vbBase.H };
                applyVB();
            });
        }

        return {
            setPlayhead: setPlayhead,
            setThought: setThought,
            // v1.9.4 — reset pan/zoom back to the full fitted view. Same as the
            // double-click handler; lets the ⛶ "fit to view" transport button work
            // in lane mode (ar_blast.fitToView delegates here).
            resetView: function () {
                svgEl.__vb = { x: 0, y: 0, w: svgEl.__vbBase.W, h: svgEl.__vbBase.H };
                applyVB();
            },
            laneCount: lanes.length,
            dotCount: dotEls.length,
            arrowCount: arrowEls.length,
            destroy: function () { while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild); }
        };
    }

    return { create: createLaneView, tacticColor: tacticColor };
});
