// ============================================================================
// AR_RBA.JS — v2.0.0 Enterprise Security Edition
// Risk-Based Alerting (RBA) cumulative risk-score timeline.
//
// Renders, per risk object (host/user), how risk ACCRUES over the attack as
// each correlation search "fires" — and the moment a running total crosses the
// ES notable threshold, a Risk Notable lights up on the curve. This is the
// signature Splunk ES RBA concept, shown DVR-style. The model is computed by
// DemoStreamer.getRBAModel() straight from the scenario (no index round-trip),
// so it paints instantly and stays in lock-step with the lane replay.
// ============================================================================
var _arRbaStaticPrefix = ((typeof $C !== 'undefined' && $C['MRSPARKLE_ROOT_PATH']) || '') + '/static/app/SA-attack-replay/js/';

require([
    'jquery',
    'splunkjs/mvc',
    // Must carry the SAME ?v= as ar_blast/ar_features so this resolves to the
    // one fresh ar_streamer module instance (see ar_blast.js cache-bust note).
    _arRbaStaticPrefix + 'ar_streamer.js?v=2.0.2',
    'splunkjs/mvc/simplexml/ready!'
], function ($, mvc, DemoStreamer) {
    'use strict';

    var SVGNS = 'http://www.w3.org/2000/svg';
    var ROOT_ID = 'ar-rba-root';
    // vivid palette — assigned per object in descending-risk order
    var PALETTE = ['#36d1ff', '#ffb35c', '#7c5cff', '#33e6a0', '#ff6b9d', '#f2d04b', '#5ca8ff', '#ff8a5c'];

    var _model = null;
    var _lastScenario = null;

    function el(tag, attrs) {
        var e = document.createElementNS(SVGNS, tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }

    function fmtClock(sec) {
        sec = Math.max(0, Math.round(sec));
        var d = Math.floor(sec / 86400);
        if (d >= 1) return 'Day ' + (d + 1);
        var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
        if (h >= 1) return h + 'h' + (m ? (' ' + m + 'm') : '');
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function getScenarioId() {
        try {
            var sub = mvc.Components.get('submitted');
            var def = mvc.Components.get('default');
            return (sub && sub.get('scenario')) || (def && def.get('scenario')) || 'op_midnight_eclipse';
        } catch (e) { return 'op_midnight_eclipse'; }
    }

    function render(container) {
        var sid = getScenarioId();
        if (!DemoStreamer || typeof DemoStreamer.getRBAModel !== 'function') return;
        _model = DemoStreamer.getRBAModel(sid);
        _lastScenario = sid;
        container.innerHTML = '';
        if (!_model || !_model.objects.length) {
            container.innerHTML = '<div class="ar-rba-empty">No risk data for this scenario yet — pick a scenario and Stream Demo Data to populate Risk-Based Alerting.</div>';
            return;
        }

        var objects = _model.objects.slice(0, 6);
        var threshold = _model.threshold;
        var maxOffset = _model.maxOffset || 1;
        var maxRisk = Math.max(threshold * 1.25, objects.length ? objects[0].total : threshold) * 1.08;

        // geometry
        var W = Math.max(container.clientWidth || 900, 680);
        var H = 340;
        var ML = 54, MR = 216, MT = 26, MB = 46;
        var plotW = W - ML - MR, plotH = H - MT - MB;

        var X = function (t) { return ML + (t / maxOffset) * plotW; };
        var Y = function (r) { return MT + plotH - (r / maxRisk) * plotH; };

        var svg = el('svg', { 'class': 'ar-rba-svg', width: '100%', height: H, viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet' });

        // defs: soft glow
        var defs = el('defs');
        defs.innerHTML =
            '<filter id="arGlow" x="-40%" y="-40%" width="180%" height="180%">' +
            '<feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<filter id="arGlowSoft" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
        svg.appendChild(defs);

        // y gridlines + labels
        var ticks = 4;
        for (var i = 0; i <= ticks; i++) {
            var rv = (maxRisk / ticks) * i;
            var yy = Y(rv);
            svg.appendChild(el('line', { x1: ML, y1: yy, x2: ML + plotW, y2: yy, 'class': 'ar-rba-grid' }));
            var lbl = el('text', { x: ML - 8, y: yy + 4, 'class': 'ar-rba-axis', 'text-anchor': 'end' });
            lbl.textContent = Math.round(rv);
            svg.appendChild(lbl);
        }
        // x labels (start / mid / end)
        [0, 0.5, 1].forEach(function (f) {
            var t = maxOffset * f, xx = X(t);
            var tl = el('text', { x: xx, y: H - 16, 'class': 'ar-rba-axis', 'text-anchor': f === 0 ? 'start' : (f === 1 ? 'end' : 'middle') });
            tl.textContent = fmtClock(t);
            svg.appendChild(tl);
        });
        var yTitle = el('text', { x: 16, y: MT + plotH / 2, 'class': 'ar-rba-axis-title', transform: 'rotate(-90 16 ' + (MT + plotH / 2) + ')', 'text-anchor': 'middle' });
        yTitle.textContent = 'Cumulative risk score';
        svg.appendChild(yTitle);

        // threshold line + label
        var ty = Y(threshold);
        svg.appendChild(el('line', { x1: ML, y1: ty, x2: ML + plotW, y2: ty, 'class': 'ar-rba-threshold', filter: 'url(#arGlowSoft)' }));
        var thLbl = el('text', { x: ML + plotW, y: ty - 7, 'class': 'ar-rba-threshold-label', 'text-anchor': 'end' });
        thLbl.textContent = 'RBA notable threshold (' + threshold + ')';
        svg.appendChild(thLbl);

        // curves (animated reveal via stroke-dashoffset)
        var revealMs = 3400;
        var legendRows = [];
        objects.forEach(function (o, idx) {
            var color = PALETTE[idx % PALETTE.length];
            var pts = o.points.map(function (p) { return X(p.t) + ',' + Y(p.risk); });
            // start the curve at baseline so it grows from 0
            if (o.points.length) pts.unshift(X(o.points[0].t) + ',' + Y(0));
            var poly = el('polyline', {
                points: pts.join(' '),
                'class': 'ar-rba-curve',
                stroke: color,
                'stroke-dasharray': o.type === 'user' ? '7 5' : '0',
                filter: 'url(#arGlow)'
            });
            svg.appendChild(poly);
            // reveal animation
            try {
                var len = poly.getTotalLength ? poly.getTotalLength() : plotW;
                poly.style.strokeDasharray = len;
                poly.style.strokeDashoffset = len;
                poly.getBoundingClientRect(); // force reflow
                poly.style.transition = 'stroke-dashoffset ' + revealMs + 'ms linear';
                poly.style.strokeDashoffset = '0';
                // restore the user dash after reveal completes
                if (o.type === 'user') {
                    setTimeout(function () { poly.style.strokeDasharray = '7 5'; poly.style.strokeDashoffset = '0'; poly.style.transition = 'none'; }, revealMs + 30);
                }
            } catch (e) {}

            // breach marker (the moment it crosses threshold). We mark the spot
            // with a pulsing dot in the object's colour + a small flag — the
            // object name lives in the legend (with FIRED), so no inline text
            // labels here (they collided when objects tripped near the same time).
            if (o.breachOffset !== null && o.breachOffset !== undefined) {
                var bx = X(o.breachOffset), by = ty;
                var delay = (o.breachOffset / maxOffset) * revealMs;
                var g = el('g', { 'class': 'ar-rba-breach', opacity: '0' });
                g.appendChild(el('line', { x1: bx, y1: by, x2: bx, y2: by - 16, stroke: color, 'stroke-width': 1.4, opacity: 0.7 }));
                g.appendChild(el('circle', { cx: bx, cy: by, r: 6, 'class': 'ar-rba-breach-dot', fill: color, filter: 'url(#arGlow)' }));
                g.appendChild(el('circle', { cx: bx, cy: by, r: 6, 'class': 'ar-rba-breach-pulse', stroke: color }));
                svg.appendChild(g);
                setTimeout(function () { g.setAttribute('opacity', '1'); g.classList.add('shown'); }, delay + 120);
            }

            legendRows.push({ color: color, o: o });
        });

        // legend (right gutter)
        var lx = ML + plotW + 18, ly = MT + 6;
        legendRows.forEach(function (row, i) {
            var yy = ly + i * 30;
            var o = row.o;
            var sw = el('line', { x1: lx, y1: yy, x2: lx + 22, y2: yy, stroke: row.color, 'stroke-width': 3, 'stroke-dasharray': o.type === 'user' ? '7 5' : '0', 'stroke-linecap': 'round' });
            svg.appendChild(sw);
            var nm = el('text', { x: lx + 30, y: yy + 4, 'class': 'ar-rba-legend-name' });
            nm.textContent = o.id;
            svg.appendChild(nm);
            var meta = el('text', { x: lx + 30, y: yy + 18, 'class': 'ar-rba-legend-meta' });
            var fired = (o.breachOffset !== null && o.breachOffset !== undefined);
            meta.textContent = (o.type === 'user' ? 'user' : 'system') + ' · ' + o.total + ' risk · ' + o.rules + ' rules' + (fired ? ' · FIRED' : '');
            if (fired) meta.setAttribute('class', 'ar-rba-legend-meta fired');
            svg.appendChild(meta);
        });

        container.appendChild(svg);
    }

    function mount() {
        var container = document.getElementById(ROOT_ID);
        if (!container) return false;

        // header with a replay control
        if (!container.__arRbaWired) {
            container.__arRbaWired = true;
            var rerun = function () { render(container); };

            // re-render when the scenario changes
            try {
                var sub = mvc.Components.get('submitted');
                var def = mvc.Components.get('default');
                if (sub && sub.on) sub.on('change:scenario', function () { setTimeout(rerun, 60); });
                if (def && def.on) def.on('change:scenario', function () { setTimeout(rerun, 60); });
            } catch (e) {}

            // re-render after a stream completes (data/model may have grown)
            $(document).on('ar:rba:refresh', rerun);
            // replay button (delegated)
            $(container).on('click', '.ar-rba-replay', rerun);
            // re-flow on resize
            var rt;
            $(window).on('resize.arRba', function () { clearTimeout(rt); rt = setTimeout(rerun, 200); });
        }
        render(container);
        return true;
    }

    // The panel HTML lands asynchronously; poll briefly until #ar-rba-root exists.
    var tries = 0;
    var iv = setInterval(function () {
        tries++;
        if (mount() || tries > 40) clearInterval(iv);
    }, 250);

    // expose a tiny hook so the controller can nudge a refresh post-stream
    window.ARRba = { refresh: function () { $(document).trigger('ar:rba:refresh'); } };
});
