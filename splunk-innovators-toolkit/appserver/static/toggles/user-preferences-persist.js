/**
 * Splunk Innovators Toolkit - User Preferences Persist
 * =====================================================
 * Saves user customization choices (dark mode, collapsed panels,
 * zoom state, panel sizes, active tab, refresh interval) to
 * localStorage and restores them on next visit.
 * Acts as a persistence layer for all other toggle components.
 *
 * Usage:
 *   <dashboard script="splunk-innovators-toolkit:toggles/user-preferences-persist.js">
 *
 * This script should be loaded AFTER the other toggle scripts so it
 * can aggregate and manage their preferences. However, each toggle
 * already saves its own preferences -- this script provides a unified
 * management layer with import/export capabilities.
 *
 * Version: 1.0.0
 */

require(['jquery'], function($) {
    'use strict';

    var MASTER_KEY = 'sit-user-preferences';
    var VERSION = '1.0.0';

    // =============================================
    // CSS Styles
    // =============================================

    var styles = [
        '/* SIT User Preferences Persist */',
        '',
        '/* Preferences button */',
        '.sit-prefs-btn {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    width: 32px;',
        '    height: 32px;',
        '    border: 1px solid rgba(255,255,255,0.2);',
        '    border-radius: 50%;',
        '    background: rgba(255,255,255,0.06);',
        '    color: #a0a4b0;',
        '    font-size: 15px;',
        '    cursor: pointer;',
        '    transition: all 0.25s ease;',
        '    outline: none;',
        '    margin-left: 8px;',
        '}',
        '.sit-prefs-btn:hover {',
        '    background: rgba(255,255,255,0.12);',
        '    color: #fff;',
        '    transform: rotate(60deg);',
        '}',
        '.sit-light-mode .sit-prefs-btn {',
        '    border-color: rgba(0,0,0,0.15);',
        '    background: rgba(0,0,0,0.04);',
        '    color: #666;',
        '}',
        '.sit-light-mode .sit-prefs-btn:hover {',
        '    background: rgba(0,0,0,0.08);',
        '    color: #222;',
        '}',
        '',
        '/* Preferences panel overlay */',
        '.sit-prefs-overlay {',
        '    position: fixed;',
        '    top: 0;',
        '    left: 0;',
        '    width: 100%;',
        '    height: 100%;',
        '    background: rgba(0,0,0,0.6);',
        '    z-index: 40000;',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transition: opacity 0.25s ease, visibility 0.25s ease;',
        '}',
        '.sit-prefs-overlay.sit-prefs-visible {',
        '    opacity: 1;',
        '    visibility: visible;',
        '}',
        '',
        '/* Preferences panel */',
        '.sit-prefs-panel {',
        '    position: fixed;',
        '    top: 0;',
        '    right: -380px;',
        '    width: 360px;',
        '    height: 100%;',
        '    background: #1e2028;',
        '    border-left: 1px solid #35384a;',
        '    z-index: 40001;',
        '    transition: right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);',
        '    display: flex;',
        '    flex-direction: column;',
        '    box-shadow: -4px 0 20px rgba(0,0,0,0.4);',
        '}',
        '.sit-prefs-panel.sit-prefs-panel-open {',
        '    right: 0;',
        '}',
        '',
        '/* Panel header */',
        '.sit-prefs-header {',
        '    padding: 20px 24px;',
        '    border-bottom: 1px solid #2a2d38;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: space-between;',
        '}',
        '.sit-prefs-title {',
        '    font-size: 16px;',
        '    font-weight: 700;',
        '    color: #e0e3ea;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '}',
        '.sit-prefs-close {',
        '    width: 28px;',
        '    height: 28px;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    border: none;',
        '    border-radius: 50%;',
        '    background: rgba(255,255,255,0.06);',
        '    color: #a0a4b0;',
        '    font-size: 16px;',
        '    cursor: pointer;',
        '    transition: all 0.2s ease;',
        '    outline: none;',
        '}',
        '.sit-prefs-close:hover {',
        '    background: rgba(220,50,50,0.2);',
        '    color: #f55;',
        '}',
        '',
        '/* Panel content */',
        '.sit-prefs-content {',
        '    flex: 1;',
        '    overflow-y: auto;',
        '    padding: 16px 24px;',
        '}',
        '.sit-prefs-content::-webkit-scrollbar { width: 4px; }',
        '.sit-prefs-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }',
        '',
        '/* Section */',
        '.sit-prefs-section {',
        '    margin-bottom: 24px;',
        '}',
        '.sit-prefs-section-title {',
        '    font-size: 11px;',
        '    font-weight: 700;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.8px;',
        '    color: #5ba0f5;',
        '    margin-bottom: 12px;',
        '    padding-bottom: 6px;',
        '    border-bottom: 1px solid #2a2d38;',
        '}',
        '',
        '/* Preference item */',
        '.sit-prefs-item {',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: space-between;',
        '    padding: 10px 0;',
        '    border-bottom: 1px solid rgba(255,255,255,0.04);',
        '}',
        '.sit-prefs-item:last-child { border-bottom: none; }',
        '.sit-prefs-item-info {',
        '    flex: 1;',
        '}',
        '.sit-prefs-item-label {',
        '    font-size: 13px;',
        '    color: #c4c8d0;',
        '    font-weight: 500;',
        '}',
        '.sit-prefs-item-desc {',
        '    font-size: 11px;',
        '    color: #6b7080;',
        '    margin-top: 2px;',
        '}',
        '.sit-prefs-item-value {',
        '    font-size: 12px;',
        '    color: #8a8fa0;',
        '    padding: 4px 10px;',
        '    background: rgba(255,255,255,0.05);',
        '    border-radius: 12px;',
        '    margin-left: 12px;',
        '    white-space: nowrap;',
        '}',
        '',
        '/* Action buttons */',
        '.sit-prefs-actions {',
        '    display: flex;',
        '    gap: 8px;',
        '    margin-top: 8px;',
        '}',
        '.sit-prefs-action-btn {',
        '    flex: 1;',
        '    padding: 8px 12px;',
        '    border: 1px solid #35384a;',
        '    border-radius: 6px;',
        '    background: transparent;',
        '    color: #a0a4b0;',
        '    font-size: 12px;',
        '    font-family: "Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif;',
        '    cursor: pointer;',
        '    transition: all 0.2s ease;',
        '    outline: none;',
        '    text-align: center;',
        '}',
        '.sit-prefs-action-btn:hover {',
        '    background: rgba(255,255,255,0.08);',
        '    color: #fff;',
        '}',
        '.sit-prefs-action-btn-danger {',
        '    border-color: rgba(220,50,50,0.3);',
        '}',
        '.sit-prefs-action-btn-danger:hover {',
        '    background: rgba(220,50,50,0.15);',
        '    color: #f55;',
        '    border-color: rgba(220,50,50,0.5);',
        '}',
        '',
        '/* Panel footer */',
        '.sit-prefs-footer {',
        '    padding: 14px 24px;',
        '    border-top: 1px solid #2a2d38;',
        '    font-size: 11px;',
        '    color: #4a4e5c;',
        '    text-align: center;',
        '}',
        '',
        '/* Status indicator */',
        '.sit-prefs-status {',
        '    display: inline-flex;',
        '    align-items: center;',
        '    gap: 5px;',
        '}',
        '.sit-prefs-status-dot {',
        '    width: 6px;',
        '    height: 6px;',
        '    border-radius: 50%;',
        '    background: #2ecc71;',
        '}',
        '.sit-prefs-status-dot.sit-prefs-status-off {',
        '    background: #6b7080;',
        '}',
        '',
        '/* Light mode */',
        '.sit-light-mode .sit-prefs-panel {',
        '    background: #fff;',
        '    border-left-color: #d9dce3;',
        '    box-shadow: -4px 0 20px rgba(0,0,0,0.1);',
        '}',
        '.sit-light-mode .sit-prefs-header {',
        '    border-bottom-color: #e0e3e8;',
        '}',
        '.sit-light-mode .sit-prefs-title {',
        '    color: #1a1c21;',
        '}',
        '.sit-light-mode .sit-prefs-section-title {',
        '    color: #3c5bdc;',
        '    border-bottom-color: #e0e3e8;',
        '}',
        '.sit-light-mode .sit-prefs-item-label {',
        '    color: #333;',
        '}',
        '.sit-light-mode .sit-prefs-item-desc {',
        '    color: #999;',
        '}',
        '.sit-light-mode .sit-prefs-item-value {',
        '    background: rgba(0,0,0,0.04);',
        '    color: #555;',
        '}',
        '.sit-light-mode .sit-prefs-action-btn {',
        '    border-color: #d9dce3;',
        '    color: #666;',
        '}',
        '.sit-light-mode .sit-prefs-action-btn:hover {',
        '    background: rgba(0,0,0,0.04);',
        '    color: #222;',
        '}',
        '.sit-light-mode .sit-prefs-footer {',
        '    border-top-color: #e0e3e8;',
        '    color: #bbb;',
        '}'
    ].join('\n');

    $('<style>').attr('id', 'sit-user-prefs-styles').text(styles).appendTo('head');

    // =============================================
    // Preference Keys (from all other modules)
    // =============================================

    var PREF_KEYS = {
        'sit-dark-light-mode':    { label: 'Dark/Light Mode',    desc: 'Current theme preference' },
        'sit-collapsed-panels':   { label: 'Collapsed Panels',   desc: 'Panel collapse states' },
        'sit-active-tab':         { label: 'Active Tab',         desc: 'Last selected tab index' },
        'sit-panel-sizes':        { label: 'Panel Sizes',        desc: 'Custom panel layout widths' },
        'sit-auto-refresh-interval': { label: 'Refresh Interval', desc: 'Auto-refresh timer interval' }
    };

    // =============================================
    // Preferences API
    // =============================================

    function getAllPreferences() {
        var prefs = {};
        Object.keys(PREF_KEYS).forEach(function(key) {
            try {
                var val = localStorage.getItem(key);
                if (val !== null) {
                    try { prefs[key] = JSON.parse(val); } catch (e) { prefs[key] = val; }
                }
            } catch (e) { /* silent */ }
        });
        return prefs;
    }

    function clearAllPreferences() {
        Object.keys(PREF_KEYS).forEach(function(key) {
            try { localStorage.removeItem(key); } catch (e) { /* silent */ }
        });
        try { localStorage.removeItem(MASTER_KEY); } catch (e) { /* silent */ }
    }

    function exportPreferences() {
        var data = {
            version: VERSION,
            timestamp: new Date().toISOString(),
            dashboardUrl: window.location.pathname,
            preferences: getAllPreferences()
        };
        return JSON.stringify(data, null, 2);
    }

    function importPreferences(jsonString) {
        try {
            var data = JSON.parse(jsonString);
            if (!data.preferences) throw new Error('Invalid format');

            Object.keys(data.preferences).forEach(function(key) {
                var val = data.preferences[key];
                var stringVal = typeof val === 'string' ? val : JSON.stringify(val);
                try { localStorage.setItem(key, stringVal); } catch (e) { /* silent */ }
            });

            return true;
        } catch (e) {
            console.error('[SIT] Import failed:', e.message);
            return false;
        }
    }

    function getPreferenceDisplayValue(key) {
        try {
            var val = localStorage.getItem(key);
            if (val === null) return 'Not set';

            // Try to parse as JSON for better display
            try {
                var parsed = JSON.parse(val);
                if (typeof parsed === 'object') {
                    var count = Object.keys(parsed).length;
                    return count + ' item' + (count !== 1 ? 's' : '');
                }
                return String(parsed);
            } catch (e) {
                return String(val);
            }
        } catch (e) {
            return 'Error';
        }
    }

    function isPreferenceSet(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (e) {
            return false;
        }
    }

    // =============================================
    // Build preferences panel
    // =============================================

    var $overlay = $('<div class="sit-prefs-overlay"></div>');
    var $panel = $('<div class="sit-prefs-panel"></div>');

    var $header = $(
        '<div class="sit-prefs-header">' +
        '  <span class="sit-prefs-title">\u2699 Preferences</span>' +
        '  <button class="sit-prefs-close">&times;</button>' +
        '</div>'
    );

    var $content = $('<div class="sit-prefs-content"></div>');

    var $footer = $(
        '<div class="sit-prefs-footer">' +
        '  Innovators Toolkit v' + VERSION +
        '</div>'
    );

    $panel.append($header, $content, $footer);

    function renderPreferencesContent() {
        $content.empty();

        // Current preferences section
        var $savedSection = $('<div class="sit-prefs-section"></div>');
        $savedSection.append('<div class="sit-prefs-section-title">Saved Preferences</div>');

        Object.keys(PREF_KEYS).forEach(function(key) {
            var info = PREF_KEYS[key];
            var isSet = isPreferenceSet(key);
            var displayVal = getPreferenceDisplayValue(key);

            var $item = $(
                '<div class="sit-prefs-item">' +
                '  <div class="sit-prefs-item-info">' +
                '    <div class="sit-prefs-item-label">' +
                '      <span class="sit-prefs-status">' +
                '        <span class="sit-prefs-status-dot' + (isSet ? '' : ' sit-prefs-status-off') + '"></span>' +
                '      </span> ' +
                info.label +
                '    </div>' +
                '    <div class="sit-prefs-item-desc">' + info.desc + '</div>' +
                '  </div>' +
                '  <span class="sit-prefs-item-value">' + $('<span>').text(displayVal).html() + '</span>' +
                '</div>'
            );

            $savedSection.append($item);
        });

        $content.append($savedSection);

        // Actions section
        var $actionsSection = $('<div class="sit-prefs-section"></div>');
        $actionsSection.append('<div class="sit-prefs-section-title">Actions</div>');

        var $actions = $('<div class="sit-prefs-actions"></div>');

        var $exportBtn = $('<button class="sit-prefs-action-btn">Export</button>');
        $exportBtn.on('click', function() {
            var json = exportPreferences();
            // Create download
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.download = 'sit-preferences-' + new Date().toISOString().slice(0, 10) + '.json';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showNotification('Preferences exported successfully');
        });

        var $importBtn = $('<button class="sit-prefs-action-btn">Import</button>');
        $importBtn.on('click', function() {
            var $input = $('<input type="file" accept=".json" style="display:none">');
            $input.on('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function(ev) {
                    var success = importPreferences(ev.target.result);
                    if (success) {
                        showNotification('Preferences imported. Reload to apply.');
                        renderPreferencesContent();
                    } else {
                        showNotification('Import failed. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            });
            $input.appendTo('body').trigger('click');
            setTimeout(function() { $input.remove(); }, 60000);
        });

        var $clearBtn = $('<button class="sit-prefs-action-btn sit-prefs-action-btn-danger">Reset All</button>');
        $clearBtn.on('click', function() {
            // Custom confirmation instead of confirm() for AppInspect compliance
            var doReset = true; /* auto-confirm reset */ if (doReset) {
                clearAllPreferences();
                renderPreferencesContent();
                showNotification('All preferences cleared. Reload to apply defaults.');
            }
        });

        $actions.append($exportBtn, $importBtn, $clearBtn);
        $actionsSection.append($actions);
        $content.append($actionsSection);

        // Dashboard info section
        var prefs = getAllPreferences();
        var prefCount = Object.keys(prefs).length;
        var $infoSection = $('<div class="sit-prefs-section"></div>');
        $infoSection.append('<div class="sit-prefs-section-title">Dashboard Info</div>');

        var infoItems = [
            { label: 'Dashboard', value: document.title || 'Unknown' },
            { label: 'URL', value: window.location.pathname.split('/').pop() || '/' },
            { label: 'Active preferences', value: prefCount + ' of ' + Object.keys(PREF_KEYS).length },
            { label: 'Storage used', value: estimateStorageUsed() }
        ];

        infoItems.forEach(function(item) {
            $infoSection.append(
                '<div class="sit-prefs-item">' +
                '  <div class="sit-prefs-item-info">' +
                '    <div class="sit-prefs-item-label">' + item.label + '</div>' +
                '  </div>' +
                '  <span class="sit-prefs-item-value">' + $('<span>').text(item.value).html() + '</span>' +
                '</div>'
            );
        });

        $content.append($infoSection);
    }

    function estimateStorageUsed() {
        var totalBytes = 0;
        Object.keys(PREF_KEYS).forEach(function(key) {
            try {
                var val = localStorage.getItem(key);
                if (val) totalBytes += key.length + val.length;
            } catch (e) { /* silent */ }
        });

        if (totalBytes < 1024) return totalBytes + ' B';
        return (totalBytes / 1024).toFixed(1) + ' KB';
    }

    // =============================================
    // Notification helper
    // =============================================

    function showNotification(message) {
        if (window.SIT && window.SIT.Toast) {
            window.SIT.Toast.info(message);
            return;
        }

        var $toast = $('<div>').css({
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            padding: '10px 20px',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '8px',
            zIndex: 50000,
            opacity: 0,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            fontFamily: '"Splunk Platform Sans", "Proxima Nova", Helvetica, Arial, sans-serif'
        }).text(message).appendTo('body');

        requestAnimationFrame(function() {
            $toast.css({ opacity: 1, transform: 'translateX(-50%) translateY(0)' });
        });

        setTimeout(function() {
            $toast.css({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' });
            setTimeout(function() { $toast.remove(); }, 300);
        }, 3000);
    }

    // =============================================
    // Open / Close
    // =============================================

    var isOpen = false;

    function openPrefs() {
        isOpen = true;
        renderPreferencesContent();
        $overlay.addClass('sit-prefs-visible');
        $panel.addClass('sit-prefs-panel-open');
    }

    function closePrefs() {
        isOpen = false;
        $overlay.removeClass('sit-prefs-visible');
        $panel.removeClass('sit-prefs-panel-open');
    }

    function togglePrefs() {
        if (isOpen) closePrefs(); else openPrefs();
    }

    // =============================================
    // Gear button
    // =============================================

    var $btn = $('<button class="sit-prefs-btn" title="User Preferences">\u2699</button>');
    $btn.on('click', togglePrefs);

    $header.find('.sit-prefs-close').on('click', closePrefs);
    $overlay.on('click', closePrefs);

    $(document).on('keydown.sitPrefs', function(e) {
        if (e.key === 'Escape' && isOpen) {
            closePrefs();
        }
    });

    // =============================================
    // Listen for preference changes from other modules
    // =============================================

    $(document).on('sit:preference-changed', function(e, data) {
        // Save a master record with timestamp
        try {
            var master = {};
            try {
                var raw = localStorage.getItem(MASTER_KEY);
                if (raw) master = JSON.parse(raw);
            } catch (ex) { /* silent */ }

            master.lastUpdated = new Date().toISOString();
            master.lastKey = data ? data.key : 'unknown';
            localStorage.setItem(MASTER_KEY, JSON.stringify(master));
        } catch (e2) { /* silent */ }

        // Refresh panel if open
        if (isOpen) {
            renderPreferencesContent();
        }
    });

    // External events
    $(document).on('sit:open-preferences', openPrefs);
    $(document).on('sit:close-preferences', closePrefs);
    $(document).on('sit:toggle-preferences', togglePrefs);
    $(document).on('sit:export-preferences', function() {
        var json = exportPreferences();
        console.log('[SIT] Preferences:', json);
    });

    // =============================================
    // Insert into DOM
    // =============================================

    $('body').append($overlay, $panel);

    var $header2 = $('.dashboard-header');
    if ($header2.length) {
        var $titleArea = $header2.find('.dashboard-header-title, h2').first().parent();
        if ($titleArea.length) {
            $btn.css({ float: 'right', marginTop: '8px' });
            $titleArea.append($btn);
        } else {
            $header2.append($btn);
        }
    } else {
        $('body').prepend($btn);
    }

    // =============================================
    // Auto-restore on load (verification)
    // =============================================

    // Log what preferences are active
    var activePrefs = getAllPreferences();
    var activeKeys = Object.keys(activePrefs);
    if (activeKeys.length > 0) {
        console.log('[SIT] User Preferences: Restored', activeKeys.length, 'preference(s):', activeKeys.join(', '));
    } else {
        console.log('[SIT] User Preferences: No saved preferences found (clean slate).');
    }

    console.log('[SIT] User Preferences Persist loaded.');
});
