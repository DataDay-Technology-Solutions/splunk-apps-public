/*
 * ============================================================================
 * Team Status Board Widget
 * Splunk Innovators Toolkit
 * ============================================================================
 *
 * DESCRIPTION:
 *   Creates a team/on-call status board showing team member names with
 *   status indicators (available, busy, offline). Configurable via
 *   HTML data attributes or Splunk dashboard tokens.
 *
 * USAGE:
 *   <dashboard script="splunk-innovators-toolkit:widgets/team-status-board.js">
 *
 *   HTML Panel approach:
 *     <html>
 *       <div class="team-board" data-title="On-Call Team">
 *         <div class="team-member" data-name="Alice Chen" data-role="Lead Engineer" data-status="available"></div>
 *         <div class="team-member" data-name="Bob Smith" data-role="SRE" data-status="busy"></div>
 *         <div class="team-member" data-name="Carol Davis" data-role="DBA" data-status="offline"></div>
 *         <div class="team-member" data-name="Dan Lee" data-role="DevOps" data-status="away"></div>
 *       </div>
 *     </html>
 *
 *   Status values: available, busy, away, offline, oncall, dnd
 *
 *   Optional attributes on .team-board:
 *     - data-title    : Board title
 *     - data-layout   : "grid" (default), "list", "compact"
 *
 *   Optional attributes on .team-member:
 *     - data-name     : Member name
 *     - data-role     : Role/title
 *     - data-status   : Status (see above)
 *     - data-avatar   : URL to avatar image (optional)
 *     - data-since    : When status changed (e.g., "10m ago")
 *
 * ============================================================================
 */

require(['jquery'], function($) {
    'use strict';

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    var STATUS_CONFIG = {
        available: { label: 'Available', color: '#22c55e', icon: '\u2705', glow: 'rgba(34, 197, 94, 0.3)' },
        busy:      { label: 'Busy',      color: '#ef4444', icon: '\u26D4', glow: 'rgba(239, 68, 68, 0.3)' },
        away:      { label: 'Away',      color: '#f59e0b', icon: '\u23F3', glow: 'rgba(245, 158, 11, 0.3)' },
        offline:   { label: 'Offline',   color: '#6b7280', icon: '\u26AA', glow: 'rgba(107, 114, 128, 0.2)' },
        oncall:    { label: 'On-Call',   color: '#8b5cf6', icon: '\uD83D\uDCDE', glow: 'rgba(139, 92, 246, 0.3)' },
        dnd:       { label: 'DND',       color: '#dc2626', icon: '\uD83D\uDEAB', glow: 'rgba(220, 38, 38, 0.3)' }
    };

    // -------------------------------------------------------------------------
    // Inject Styles
    // -------------------------------------------------------------------------
    var styles = [
        '.team-board-container {',
        '    padding: 16px;',
        '}',
        '',
        '.team-board-title {',
        '    font-size: 0.85em;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.12em;',
        '    color: rgba(255, 255, 255, 0.45);',
        '    font-weight: 600;',
        '    margin-bottom: 16px;',
        '    padding-bottom: 8px;',
        '    border-bottom: 1px solid rgba(255, 255, 255, 0.06);',
        '}',
        '',
        '/* Grid layout */',
        '.team-board-grid {',
        '    display: grid;',
        '    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));',
        '    gap: 12px;',
        '}',
        '',
        '/* List layout */',
        '.team-board-list {',
        '    display: flex;',
        '    flex-direction: column;',
        '    gap: 6px;',
        '}',
        '',
        '/* Compact layout */',
        '.team-board-compact {',
        '    display: flex;',
        '    flex-wrap: wrap;',
        '    gap: 8px;',
        '}',
        '',
        '/* ---- Member Card (Grid) ---- */',
        '.team-member-card {',
        '    display: flex;',
        '    align-items: center;',
        '    gap: 12px;',
        '    padding: 12px 14px;',
        '    background: rgba(255, 255, 255, 0.03);',
        '    border-radius: 10px;',
        '    border: 1px solid rgba(255, 255, 255, 0.06);',
        '    transition: all 0.25s ease;',
        '    cursor: default;',
        '}',
        '.team-member-card:hover {',
        '    background: rgba(255, 255, 255, 0.06);',
        '    border-color: rgba(255, 255, 255, 0.1);',
        '    transform: translateY(-1px);',
        '}',
        '',
        '.team-member-avatar {',
        '    width: 38px;',
        '    height: 38px;',
        '    border-radius: 50%;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    font-size: 1em;',
        '    font-weight: 700;',
        '    color: rgba(255, 255, 255, 0.9);',
        '    flex-shrink: 0;',
        '    position: relative;',
        '}',
        '.team-member-avatar img {',
        '    width: 100%;',
        '    height: 100%;',
        '    border-radius: 50%;',
        '    object-fit: cover;',
        '}',
        '',
        '.team-member-status-dot {',
        '    position: absolute;',
        '    bottom: -1px;',
        '    right: -1px;',
        '    width: 12px;',
        '    height: 12px;',
        '    border-radius: 50%;',
        '    border: 2px solid #1a1a24;',
        '}',
        '.team-member-status-dot.pulse {',
        '    animation: statusPulse 2s ease-in-out infinite;',
        '}',
        '@keyframes statusPulse {',
        '    0%, 100% { box-shadow: 0 0 0 0 var(--status-glow); }',
        '    50% { box-shadow: 0 0 0 4px var(--status-glow); }',
        '}',
        '',
        '.team-member-info {',
        '    flex: 1;',
        '    min-width: 0;',
        '}',
        '.team-member-name {',
        '    font-size: 0.85em;',
        '    font-weight: 600;',
        '    color: rgba(255, 255, 255, 0.85);',
        '    white-space: nowrap;',
        '    overflow: hidden;',
        '    text-overflow: ellipsis;',
        '}',
        '.team-member-role {',
        '    font-size: 0.7em;',
        '    color: rgba(255, 255, 255, 0.35);',
        '    margin-top: 2px;',
        '}',
        '.team-member-status-label {',
        '    font-size: 0.65em;',
        '    font-weight: 500;',
        '    text-transform: uppercase;',
        '    letter-spacing: 0.08em;',
        '    margin-top: 3px;',
        '}',
        '',
        '/* ---- List variant ---- */',
        '.team-board-list .team-member-card {',
        '    padding: 8px 12px;',
        '    border-radius: 8px;',
        '}',
        '.team-board-list .team-member-avatar {',
        '    width: 30px;',
        '    height: 30px;',
        '    font-size: 0.8em;',
        '}',
        '.team-board-list .team-member-status-dot {',
        '    width: 10px;',
        '    height: 10px;',
        '}',
        '',
        '/* ---- Compact variant ---- */',
        '.team-board-compact .team-member-card {',
        '    padding: 6px 10px;',
        '    border-radius: 20px;',
        '    gap: 8px;',
        '}',
        '.team-board-compact .team-member-avatar {',
        '    width: 24px;',
        '    height: 24px;',
        '    font-size: 0.65em;',
        '}',
        '.team-board-compact .team-member-status-dot {',
        '    width: 8px;',
        '    height: 8px;',
        '    border-width: 1.5px;',
        '}',
        '.team-board-compact .team-member-role,',
        '.team-board-compact .team-member-status-label {',
        '    display: none;',
        '}',
        '.team-board-compact .team-member-name {',
        '    font-size: 0.75em;',
        '}',
        '',
        '/* Summary bar */',
        '.team-board-summary {',
        '    display: flex;',
        '    gap: 16px;',
        '    margin-top: 14px;',
        '    padding-top: 10px;',
        '    border-top: 1px solid rgba(255, 255, 255, 0.06);',
        '}',
        '.team-board-summary-item {',
        '    display: flex;',
        '    align-items: center;',
        '    gap: 6px;',
        '    font-size: 0.7em;',
        '    color: rgba(255, 255, 255, 0.4);',
        '}',
        '.team-board-summary-dot {',
        '    width: 8px;',
        '    height: 8px;',
        '    border-radius: 50%;',
        '    flex-shrink: 0;',
        '}'
    ].join('\n');

    $('<style>').text(styles).appendTo('head');

    // -------------------------------------------------------------------------
    // Generate Initials from Name
    // -------------------------------------------------------------------------
    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    // -------------------------------------------------------------------------
    // Generate Avatar Color from Name
    // -------------------------------------------------------------------------
    function nameToColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        var hue = Math.abs(hash) % 360;
        return 'hsl(' + hue + ', 45%, 35%)';
    }

    // -------------------------------------------------------------------------
    // Build Member Card
    // -------------------------------------------------------------------------
    function buildMemberCard(member) {
        var statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.offline;
        var initials = getInitials(member.name);
        var bgColor = nameToColor(member.name);
        var isPulse = (member.status === 'available' || member.status === 'oncall');

        var html = '<div class="team-member-card">';

        // Avatar
        html += '<div class="team-member-avatar" style="background: ' + bgColor + ';">';
        if (member.avatar) {
            html += '<img src="' + escapeHtml(member.avatar) + '" alt="' + escapeHtml(member.name) + '">';
        } else {
            html += initials;
        }
        html += '<div class="team-member-status-dot' + (isPulse ? ' pulse' : '') + '"';
        html += ' style="background: ' + statusCfg.color + '; --status-glow: ' + statusCfg.glow + ';"></div>';
        html += '</div>';

        // Info
        html += '<div class="team-member-info">';
        html += '<div class="team-member-name">' + escapeHtml(member.name) + '</div>';
        if (member.role) {
            html += '<div class="team-member-role">' + escapeHtml(member.role) + '</div>';
        }
        html += '<div class="team-member-status-label" style="color: ' + statusCfg.color + ';">';
        html += statusCfg.icon + ' ' + statusCfg.label;
        if (member.since) {
            html += ' &middot; ' + escapeHtml(member.since);
        }
        html += '</div>';
        html += '</div>';

        html += '</div>';
        return html;
    }

    // -------------------------------------------------------------------------
    // Build Summary Bar
    // -------------------------------------------------------------------------
    function buildSummary(members) {
        var counts = {};
        members.forEach(function(m) {
            var status = m.status || 'offline';
            counts[status] = (counts[status] || 0) + 1;
        });

        var html = '<div class="team-board-summary">';
        Object.keys(STATUS_CONFIG).forEach(function(key) {
            if (counts[key]) {
                var cfg = STATUS_CONFIG[key];
                html += '<div class="team-board-summary-item">';
                html += '<div class="team-board-summary-dot" style="background: ' + cfg.color + ';"></div>';
                html += counts[key] + ' ' + cfg.label;
                html += '</div>';
            }
        });
        html += '</div>';
        return html;
    }

    // -------------------------------------------------------------------------
    // Initialize Team Boards
    // -------------------------------------------------------------------------
    function initTeamBoards() {
        $('.team-board').each(function() {
            var $board = $(this);
            if ($board.data('team-initialized')) return;

            var title = $board.attr('data-title') || 'Team Status';
            var layout = $board.attr('data-layout') || 'grid';

            // Collect members
            var members = [];
            $board.find('.team-member').each(function() {
                var $m = $(this);
                members.push({
                    name: $m.attr('data-name') || 'Unknown',
                    role: $m.attr('data-role') || '',
                    status: $m.attr('data-status') || 'offline',
                    avatar: $m.attr('data-avatar') || '',
                    since: $m.attr('data-since') || ''
                });
            });

            if (members.length === 0) return;

            // Build HTML
            var layoutClass = 'team-board-' + layout;
            var html = '<div class="team-board-container">';
            html += '<div class="team-board-title">' + escapeHtml(title) + '</div>';
            html += '<div class="' + layoutClass + '">';

            members.forEach(function(member) {
                html += buildMemberCard(member);
            });

            html += '</div>';
            html += buildSummary(members);
            html += '</div>';

            $board.html(html);
            $board.data('team-initialized', true);
        });
    }

    // -------------------------------------------------------------------------
    // HTML Escape
    // -------------------------------------------------------------------------
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // -------------------------------------------------------------------------
    // MutationObserver
    // -------------------------------------------------------------------------
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = mutations.some(function(m) { return m.addedNodes.length > 0; });
        if (hasChanges) initTeamBoards();
    });

    var dashBody = document.querySelector('.dashboard-body');
    if (dashBody) {
        observer.observe(dashBody, { childList: true, subtree: true });
    }

    // Initial
    setTimeout(initTeamBoards, 300);

    // Public API
    window.splunkTeamBoard = { init: initTeamBoards };
});
