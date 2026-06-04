// Configuration page logic — settings persist via localStorage.
(function() {
    var KEY = 'sa-attack-replay-cfg-v1';
    var defaults = {
        mode: 'demo', scenario: '*', time: '-4h@h', entity: '*',
        speed: '1', protocol: '*',
        autoplay: false, banners: true, thoughts: true,
        recpanel: true, modebanner: true
    };

    function load() {
        try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
        catch (e) { return defaults; }
    }
    function save(c) { localStorage.setItem(KEY, JSON.stringify(c)); }

    function apply(c) {
        ['mode','scenario','time','entity','speed','protocol'].forEach(function(k){
            var e = document.getElementById('cfgx-' + k);
            if (e) e.value = c[k];
        });
        ['autoplay','banners','thoughts','recpanel','modebanner'].forEach(function(k){
            var e = document.getElementById('cfgx-' + k);
            if (e) e.checked = !!c[k];
        });
    }

    function collect() {
        return {
            mode: document.getElementById('cfgx-mode').value,
            scenario: document.getElementById('cfgx-scenario').value,
            time: document.getElementById('cfgx-time').value,
            entity: document.getElementById('cfgx-entity').value || '*',
            speed: document.getElementById('cfgx-speed').value,
            protocol: document.getElementById('cfgx-protocol').value,
            autoplay: document.getElementById('cfgx-autoplay').checked,
            banners: document.getElementById('cfgx-banners').checked,
            thoughts: document.getElementById('cfgx-thoughts').checked,
            recpanel: document.getElementById('cfgx-recpanel').checked,
            modebanner: document.getElementById('cfgx-modebanner').checked
        };
    }

    function flash(msg, kind) {
        var m = document.getElementById('cfgx-msg');
        if (!m) return;
        m.textContent = msg;
        m.className = 'cfgx-msg ' + (kind || '');
        setTimeout(function() { m.textContent = ''; m.className = 'cfgx-msg'; }, 4000);
    }

    function init() {
        if (!document.getElementById('cfgx-mode')) {
            // DOM not ready yet — try again
            setTimeout(init, 200);
            return;
        }
        apply(load());

        var saveBtn = document.getElementById('cfgx-savesilent');
        if (saveBtn) saveBtn.addEventListener('click', function() { save(collect()); flash('Saved.', 'ok'); });

        var resetBtn = document.getElementById('cfgx-reset');
        if (resetBtn) resetBtn.addEventListener('click', function() { localStorage.removeItem(KEY); apply(defaults); flash('Reset.', 'warn'); });

        var applyBtn = document.getElementById('cfgx-save');
        if (applyBtn) applyBtn.addEventListener('click', function() {
            var c = collect();
            save(c);
            var p = [
                'form.mode=' + encodeURIComponent(c.mode),
                'form.scenario=' + encodeURIComponent(c.scenario),
                'form.entity=' + encodeURIComponent(c.entity),
                'form.time_range.earliest=' + encodeURIComponent(c.time),
                'form.time_range.latest=now',
                'form.protocol_filter=' + encodeURIComponent(c.protocol)
            ];
            window.location.href = 'blast_radius?' + p.join('&');
        });

        // Probe data models for Live Mode Readiness
        var dms = ['Authentication','Network_Traffic','Endpoint','Web','Malware','Risk'];
        var ok = 0, accel = 0, pending = dms.length;
        function setRow(dm, status, a) {
            var row = document.querySelector('.cfgx-prereq tr[data-dm="' + dm + '"]');
            if (!row) return;
            var s = row.querySelector('[data-st]'), c = row.querySelector('[data-ac]');
            if (s) {
                s.className = 'cfgx-pill ' + (status === 'ok' ? 'ok' : 'bad');
                s.textContent = status === 'ok' ? 'AVAILABLE' : 'MISSING';
            }
            if (c) {
                c.className = 'cfgx-pill ' + (a === 'yes' ? 'ok' : a === 'no' ? 'warn' : 'unknown');
                c.textContent = a === 'yes' ? 'YES' : a === 'no' ? 'NO' : 'N/A';
            }
            if (status === 'ok') ok++;
            if (a === 'yes') accel++;
        }
        function summarize() {
            var sum = document.getElementById('cfgx-summary');
            if (!sum) return;
            if (ok === 0) {
                sum.innerHTML = '<strong>No CIM data models detected.</strong> Install <a href="https://splunkbase.splunk.com/app/1621" target="_blank">Splunk_SA_CIM</a> to unlock Live mode. Demo mode works immediately.';
            } else if (ok < dms.length) {
                sum.innerHTML = '<strong>' + ok + ' of ' + dms.length + ' data models available</strong> (' + accel + ' accelerated). Live mode has partial coverage.';
            } else {
                sum.innerHTML = '<strong>All CIM data models available</strong> (' + accel + ' accelerated). Live mode is ready.';
            }
        }
        dms.forEach(function(dm) {
            fetch('/en-US/splunkd/__raw/servicesNS/-/-/data/models/' + dm + '?output_mode=json', { credentials: 'same-origin' })
                .then(function(r) {
                    if (!r.ok) { setRow(dm, 'missing', 'n/a'); pending--; if (pending === 0) summarize(); return; }
                    return r.json().then(function(j) {
                        var entry = (j.entry || [])[0];
                        var a = false;
                        if (entry && entry.content && (entry.content.accelerated === true ||
                            (entry.content.acceleration && JSON.parse(entry.content.acceleration || '{}').enabled))) {
                            a = true;
                        }
                        setRow(dm, 'ok', a ? 'yes' : 'no');
                        pending--; if (pending === 0) summarize();
                    }).catch(function() { setRow(dm, 'missing', 'n/a'); pending--; if (pending === 0) summarize(); });
                })
                .catch(function() { setRow(dm, 'missing', 'n/a'); pending--; if (pending === 0) summarize(); });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
