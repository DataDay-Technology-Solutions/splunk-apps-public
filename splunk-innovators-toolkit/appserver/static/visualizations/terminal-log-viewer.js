/**
 * Splunk Innovators Toolkit - Terminal Log Viewer
 * Retro terminal-style log display. Transforms event panels into a terminal
 * look with green-on-black text, monospace font, blinking cursor,
 * auto-scroll, and typewriter effect for new events.
 *
 * Version: 1.0.0
 *
 * USAGE:
 * 1. Add an HTML panel:
 *    <html>
 *      <div id="terminal-log-viewer"
 *           data-title="Security Log Terminal"
 *           data-theme="green"
 *           data-typewriter-speed="30"
 *           data-auto-scroll="true"
 *           data-max-lines="500"
 *           data-logs='[
 *             {"timestamp":"2025-03-01 08:00:01","level":"INFO","message":"System boot sequence initiated"},
 *             {"timestamp":"2025-03-01 08:00:03","level":"INFO","message":"Loading kernel modules..."},
 *             {"timestamp":"2025-03-01 08:00:05","level":"WARN","message":"Deprecated module detected: legacy_auth"},
 *             {"timestamp":"2025-03-01 08:00:08","level":"ERROR","message":"Failed to connect to LDAP server at 10.0.1.50:389"},
 *             {"timestamp":"2025-03-01 08:00:10","level":"INFO","message":"Falling back to local authentication"},
 *             {"timestamp":"2025-03-01 08:00:12","level":"INFO","message":"All services started. System ready."}
 *           ]'
 *           style="width:100%;height:400px;">
 *      </div>
 *    </html>
 *
 * 2. Reference:
 *    <dashboard script="splunk-innovators-toolkit:visualizations/terminal-log-viewer.js">
 *
 * 3. Search binding: data-search-id. Fields: _time (or timestamp), level, _raw (or message)
 *
 * Themes: green, amber, blue, pink, white
 * Levels are color-coded: INFO (theme color), WARN (yellow), ERROR (red), CRITICAL (bright red), DEBUG (gray)
 */

require([
    'jquery'
], function($) {
    var mvc = null;
    try { mvc = require('splunkjs/mvc'); } catch(e) {}
    'use strict';

    // ========================================
    // Configuration
    // ========================================

    var THEMES = {
        green: { text: '#33FF33', dim: '#1A8C1A', bg: '#0A0F0A', scanline: 'rgba(51,255,51,0.03)' },
        amber: { text: '#FFB000', dim: '#996600', bg: '#0F0A00', scanline: 'rgba(255,176,0,0.03)' },
        blue:  { text: '#00BFFF', dim: '#006680', bg: '#000A0F', scanline: 'rgba(0,191,255,0.03)' },
        pink:  { text: '#FD1875', dim: '#8C0D41', bg: '#0F000A', scanline: 'rgba(253,24,117,0.03)' },
        white: { text: '#E0E0E0', dim: '#808080', bg: '#0A0A0A', scanline: 'rgba(255,255,255,0.02)' }
    };

    var LEVEL_COLORS = {
        INFO:     null,  // uses theme color
        WARN:     '#F7B500',
        WARNING:  '#F7B500',
        ERROR:    '#DC3545',
        ERR:      '#DC3545',
        CRITICAL: '#FF4444',
        CRIT:     '#FF4444',
        FATAL:    '#FF4444',
        DEBUG:    '#6C757D'
    };

    // ========================================
    // Styles
    // ========================================

    var STYLES = [
        '.sit-terminal { border-radius: 8px; overflow: hidden; font-family: "JetBrains Mono", "Fira Code", "Source Code Pro", "Consolas", "Courier New", monospace; position: relative; display: flex; flex-direction: column; }',
        '.sit-terminal-header { display: flex; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.08); gap: 8px; flex-shrink: 0; }',
        '.sit-terminal-dots { display: flex; gap: 6px; }',
        '.sit-terminal-dot { width: 10px; height: 10px; border-radius: 50%; }',
        '.sit-terminal-title { font-size: 12px; color: rgba(255,255,255,0.5); flex: 1; text-align: center; letter-spacing: 0.05em; }',
        '.sit-terminal-body { flex: 1; overflow-y: auto; padding: 12px 14px; position: relative; line-height: 1.6; font-size: 12px; }',
        '.sit-terminal-body::-webkit-scrollbar { width: 6px; }',
        '.sit-terminal-body::-webkit-scrollbar-track { background: transparent; }',
        '.sit-terminal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }',
        '.sit-terminal-line { white-space: pre-wrap; word-break: break-all; opacity: 0; animation: sit-term-fadein 0.3s forwards; }',
        '.sit-terminal-timestamp { opacity: 0.5; }',
        '.sit-terminal-level { font-weight: 700; padding: 0 2px; }',
        '.sit-terminal-cursor { display: inline-block; width: 8px; height: 14px; animation: sit-term-blink 1s step-end infinite; vertical-align: text-bottom; margin-left: 2px; }',
        '.sit-terminal-scanlines { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--sit-term-scanline) 2px, var(--sit-term-scanline) 4px); z-index: 1; }',
        '.sit-terminal-glow { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; box-shadow: inset 0 0 80px rgba(0,0,0,0.4); z-index: 2; }',
        '.sit-terminal-footer { padding: 6px 14px; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); font-size: 10px; color: rgba(255,255,255,0.3); display: flex; justify-content: space-between; flex-shrink: 0; }',
        '@keyframes sit-term-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }',
        '@keyframes sit-term-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }',
        '.sit-terminal-line:nth-child(n) { animation-delay: 0s; }'
    ].join('\n');

    if (!document.getElementById('sit-terminal-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'sit-terminal-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
    }

    // ========================================
    // TerminalViewer Class
    // ========================================

    function TerminalViewer(container, options) {
        this.$container = $(container);
        this.options = $.extend({
            title: 'Terminal',
            theme: 'green',
            typewriterSpeed: 30,
            autoScroll: true,
            maxLines: 500,
            logs: []
        }, options);

        this.theme = THEMES[this.options.theme] || THEMES.green;
        this.lineCount = 0;
        this.typewriterQueue = [];
        this.isTyping = false;
        this.init();
    }

    TerminalViewer.prototype.init = function() {
        var height = this.$container.height() || 400;

        this.$terminal = $('<div class="sit-terminal"></div>').css({
            background: this.theme.bg,
            height: height,
            '--sit-term-scanline': this.theme.scanline
        });

        // Header with traffic light dots
        var $header = $('<div class="sit-terminal-header"></div>');
        var $dots = $('<div class="sit-terminal-dots"></div>');
        $dots.append($('<div class="sit-terminal-dot"></div>').css('background', '#FF5F56'));
        $dots.append($('<div class="sit-terminal-dot"></div>').css('background', '#FFBD2E'));
        $dots.append($('<div class="sit-terminal-dot"></div>').css('background', '#27C93F'));
        $header.append($dots);
        $header.append($('<div class="sit-terminal-title"></div>').text(this.options.title));
        this.$terminal.append($header);

        // Body
        this.$body = $('<div class="sit-terminal-body"></div>').css('color', this.theme.text);
        this.$terminal.append(this.$body);

        // Scanlines overlay
        this.$terminal.append($('<div class="sit-terminal-scanlines"></div>'));
        this.$terminal.append($('<div class="sit-terminal-glow"></div>'));

        // Footer
        this.$footer = $('<div class="sit-terminal-footer"></div>');
        this.$lineCountEl = $('<span></span>').text('0 lines');
        this.$statusEl = $('<span></span>').text('Ready');
        this.$footer.append(this.$lineCountEl);
        this.$footer.append(this.$statusEl);
        this.$terminal.append(this.$footer);

        this.$container.empty().append(this.$terminal);

        // Render initial logs
        if (this.options.logs.length > 0) {
            this._renderInitialLogs(this.options.logs);
        }

        // Add blinking cursor
        this.$cursor = $('<span class="sit-terminal-cursor"></span>').css('background', this.theme.text);
        this.$body.append(this.$cursor);
    };

    TerminalViewer.prototype._renderInitialLogs = function(logs) {
        var self = this;
        logs.forEach(function(log, idx) {
            setTimeout(function() {
                self._addLine(log);
            }, idx * self.options.typewriterSpeed);
        });
    };

    TerminalViewer.prototype._addLine = function(log) {
        var $line = $('<div class="sit-terminal-line"></div>');

        // Timestamp
        var ts = log.timestamp || log._time || '';
        if (ts) {
            var $ts = $('<span class="sit-terminal-timestamp"></span>').text('[' + ts + '] ');
            $ts.css('color', this.theme.dim);
            $line.append($ts);
        }

        // Level
        var level = (log.level || 'INFO').toUpperCase();
        var levelColor = LEVEL_COLORS[level] || this.theme.text;
        var $level = $('<span class="sit-terminal-level"></span>').text(level);
        $level.css('color', levelColor);
        $line.append($level);

        // Separator
        $line.append($('<span></span>').text(' \u2502 ').css('color', this.theme.dim));

        // Message
        var message = log.message || log._raw || log.msg || '';
        var $msg = $('<span></span>').text(message);

        // Color ERROR/CRITICAL messages
        if (level === 'ERROR' || level === 'ERR') {
            $msg.css('color', '#DC3545');
        } else if (level === 'CRITICAL' || level === 'CRIT' || level === 'FATAL') {
            $msg.css('color', '#FF4444');
        } else if (level === 'WARN' || level === 'WARNING') {
            $msg.css('color', '#F7B500');
        } else if (level === 'DEBUG') {
            $msg.css('color', this.theme.dim);
        }

        $line.append($msg);

        // Insert before cursor
        this.$cursor.before($line);
        this.lineCount++;

        // Enforce max lines
        if (this.lineCount > this.options.maxLines) {
            this.$body.find('.sit-terminal-line:first').remove();
            this.lineCount--;
        }

        // Update footer
        this.$lineCountEl.text(this.lineCount + ' lines');
        this.$statusEl.text('Last update: ' + (ts || 'now'));

        // Auto-scroll
        if (this.options.autoScroll) {
            this.$body.scrollTop(this.$body[0].scrollHeight);
        }
    };

    TerminalViewer.prototype.addLogs = function(logs) {
        var self = this;
        logs.forEach(function(log, idx) {
            setTimeout(function() {
                self._addLine(log);
            }, idx * self.options.typewriterSpeed);
        });
    };

    // ========================================
    // Initialization
    // ========================================

    function initTerminals() {
        $('[id*="terminal-log"], [data-viz="terminal-log"]').each(function() {
            var $el = $(this);
            if ($el.data('sit-terminal-initialized')) return;
            $el.data('sit-terminal-initialized', true);

            var options = {
                title: $el.attr('data-title') || 'Terminal',
                theme: $el.attr('data-theme') || 'green',
                typewriterSpeed: parseInt($el.attr('data-typewriter-speed'), 10) || 30,
                autoScroll: $el.attr('data-auto-scroll') !== 'false',
                maxLines: parseInt($el.attr('data-max-lines'), 10) || 500,
                logs: []
            };

            try {
                options.logs = JSON.parse($el.attr('data-logs') || '[]');
            } catch(e) {
                console.error('[SIT Terminal] Failed to parse logs:', e);
            }

            var viewer = new TerminalViewer($el[0], options);

            // Search binding
            var searchId = $el.attr('data-search-id');
            if (searchId && mvc) {
                try {
                    var sm = mvc.Components.get(searchId);
                    if (sm) {
                        var results = sm.data('results', { count: 0 });
                        results.on('data', function() {
                            var rows = results.data().rows;
                            var fields = results.data().fields;
                            var fi = {};
                            fields.forEach(function(f, i) { fi[f] = i; });
                            var logs = rows.map(function(row) {
                                return {
                                    timestamp: row[fi['_time']] || row[fi['timestamp']] || '',
                                    level: row[fi['level']] || row[fi['log_level']] || 'INFO',
                                    message: row[fi['_raw']] || row[fi['message']] || row[fi['msg']] || ''
                                };
                            });
                            viewer.addLogs(logs);
                        });
                    }
                } catch(e) {
                    console.warn('[SIT Terminal] Could not bind to search:', searchId, e);
                }
            }

            // Store reference for external access
            $el.data('sit-terminal-viewer', viewer);
        });
    }

    var observer = new MutationObserver(function() { initTerminals(); });
    observer.observe(document.body, { childList: true, subtree: true });
    initTerminals();

    console.log('[SIT] Terminal Log Viewer loaded');
});
