/**
 * Splunk Innovators Toolkit - Design Studio
 * ==========================================
 * Visual dashboard builder. Users design layouts, place widgets,
 * configure themes/backgrounds, add SPL searches, and export as
 * complete Simple XML or Dashboard Studio JSON.
 */

require([
    'jquery',
    'underscore',
    
], function($, _) {
    'use strict';

    var TOOLKIT_APP = 'splunk-innovators-toolkit';

    // ========================================
    // Configuration
    // ========================================

    var themes = [
        { value: '', label: 'No theme (default Splunk)' },
        { value: 'soc-command-center', label: 'SOC Command Center' },
        { value: 'executive-boardroom', label: 'Executive Boardroom' },
        { value: 'cyberpunk-neon', label: 'Cyberpunk Neon' },
        { value: 'retro-terminal', label: 'Retro Terminal' },
        { value: 'glass-dashboard', label: 'Glass Dashboard' },
        { value: 'corporate-modern', label: 'Corporate Modern' },
        { value: 'dark-mode-pro', label: 'Dark Mode Pro' },
        { value: 'gradient-luxury', label: 'Gradient Luxury' },
        { value: 'newspaper-editorial', label: 'Newspaper Editorial' },
        { value: 'synthwave-sunset', label: 'Synthwave Sunset' },
        { value: 'arctic-frost', label: 'Arctic Frost' },
        { value: 'splunk-innovator-signature', label: 'Innovator Signature' }
    ];

    // Per-theme whitelisted text color presets
    // Each preset has: title, body, muted colors + a swatch color for the dropdown
    var themeTextPresets = {
        '': [
            { value: '', label: 'Default', swatch: '#d4d4d8' }
        ],
        'soc-command-center': [
            { value: '', label: 'Default (SOC Red)', swatch: '#e8614d' },
            { value: 'soc-bright', label: 'Bright', title: '#ffffff', body: '#e8e8ec', muted: '#a0a8b4', swatch: '#ffffff' },
            { value: 'soc-amber', label: 'Amber Alert', title: '#ff6a00', body: '#ffd4a8', muted: '#c89060', swatch: '#ff6a00' }
        ],
        'executive-boardroom': [
            { value: '', label: 'Default (Navy)', swatch: '#1a3a5c' },
            { value: 'exec-charcoal', label: 'Charcoal', title: '#2d2d2d', body: '#3d3d3d', muted: '#666666', swatch: '#2d2d2d' },
            { value: 'exec-slate', label: 'Warm Slate', title: '#3d3028', body: '#5c5448', muted: '#8a8078', swatch: '#5c5448' }
        ],
        'cyberpunk-neon': [
            { value: '', label: 'Default (Cyan)', swatch: '#00f0ff' },
            { value: 'cyber-pink', label: 'Hot Pink', title: '#ff2d95', body: '#e8b8d0', muted: '#b080a0', swatch: '#ff2d95' },
            { value: 'cyber-green', label: 'Matrix Green', title: '#39ff14', body: '#b8e8b0', muted: '#80b878', swatch: '#39ff14' }
        ],
        'retro-terminal': [
            { value: '', label: 'Default (Green)', swatch: '#33ff33' },
            { value: 'retro-amber', label: 'Amber CRT', title: '#ffb000', body: '#cc8c00', muted: '#997000', swatch: '#ffb000' },
            { value: 'retro-white', label: 'White Phosphor', title: '#e0e0e0', body: '#b0b0b0', muted: '#808080', swatch: '#e0e0e0' }
        ],
        'glass-dashboard': [
            { value: '', label: 'Default (White)', swatch: 'rgba(255,255,255,0.9)' },
            { value: 'glass-blue', label: 'Ice Blue', title: '#a0d4ff', body: '#80b8e8', muted: '#6098c8', swatch: '#a0d4ff' },
            { value: 'glass-violet', label: 'Soft Violet', title: '#c8a8ff', body: '#a888e0', muted: '#8868c0', swatch: '#c8a8ff' }
        ],
        'corporate-modern': [
            { value: '', label: 'Default (Dark Gray)', swatch: '#374151' },
            { value: 'corp-blue', label: 'Brand Blue', title: '#1e40af', body: '#374151', muted: '#6b7280', swatch: '#3b82f6' },
            { value: 'corp-teal', label: 'Teal', title: '#0f766e', body: '#374151', muted: '#6b7280', swatch: '#14b8a6' }
        ],
        'dark-mode-pro': [
            { value: '', label: 'Default (Zinc)', swatch: '#a1a1aa' },
            { value: 'dmp-indigo', label: 'Indigo', title: '#a5b4fc', body: '#c7d2fe', muted: '#818cf8', swatch: '#818cf8' },
            { value: 'dmp-emerald', label: 'Emerald', title: '#6ee7b7', body: '#a7f3d0', muted: '#34d399', swatch: '#34d399' }
        ],
        'gradient-luxury': [
            { value: '', label: 'Default (Gold)', swatch: '#d4af37' },
            { value: 'lux-platinum', label: 'Platinum', title: '#e0e0e0', body: '#c8c0b8', muted: '#9a9088', swatch: '#e0e0e0' },
            { value: 'lux-rose', label: 'Rose Gold', title: '#e8a0a0', body: '#d4888c', muted: '#b06068', swatch: '#e8a0a0' }
        ],
        'newspaper-editorial': [
            { value: '', label: 'Default (Black)', swatch: '#1a1a1a' },
            { value: 'news-sepia', label: 'Sepia', title: '#3d2b1f', body: '#5c4a3a', muted: '#8a7868', swatch: '#5c4a3a' },
            { value: 'news-blue', label: 'Ink Blue', title: '#1a365d', body: '#2d4a7a', muted: '#6b88a8', swatch: '#2d4a7a' }
        ],
        'synthwave-sunset': [
            { value: '', label: 'Default (Pink)', swatch: '#ff5ea2' },
            { value: 'synth-gold', label: 'Neon Gold', title: '#ffe066', body: '#e8c840', muted: '#c8a830', swatch: '#ffe066' },
            { value: 'synth-blue', label: 'Electric Blue', title: '#60a0ff', body: '#80b8ff', muted: '#4080d0', swatch: '#60a0ff' }
        ],
        'arctic-frost': [
            { value: '', label: 'Default (Ice Blue)', swatch: '#b0d4f0' },
            { value: 'arctic-white', label: 'Snow White', title: '#e8f4ff', body: '#d0e8ff', muted: '#90b8d8', swatch: '#e8f4ff' },
            { value: 'arctic-silver', label: 'Silver', title: '#c0c8d0', body: '#a0b0c0', muted: '#7890a0', swatch: '#c0c8d0' }
        ],
        'splunk-innovator-signature': [
            { value: '', label: 'Default (Light Gray)', swatch: '#eaeaf0' },
            { value: 'sig-pink', label: 'Signature Pink', title: '#FD1875', body: '#f0a0c0', muted: '#c06888', swatch: '#FD1875' },
            { value: 'sig-white', label: 'Bright White', title: '#ffffff', body: '#e0e0ea', muted: '#a0a0b0', swatch: '#ffffff' }
        ]
    };

    var backgrounds = [
        { value: '', label: 'No background effect' },
        { value: 'animated-mesh-gradient', label: 'Animated Mesh Gradient' },
        { value: 'particle-network', label: 'Particle Network', type: 'js' },
        { value: 'matrix-data-rain', label: 'Matrix Data Rain', type: 'js' },
        { value: 'gradient-wave-motion', label: 'Gradient Wave Motion' },
        { value: 'cyberpunk-grid-pulse', label: 'Cyberpunk Grid Pulse' },
        { value: 'starfield-parallax', label: 'Starfield Parallax', type: 'js' },
        { value: 'aurora-borealis', label: 'Aurora Borealis' },
        { value: 'radar-sweep', label: 'Radar Sweep' },
        { value: 'blueprint-technical', label: 'Blueprint Technical' },
        { value: 'dark-topography', label: 'Dark Topography' },
        { value: 'circuit-board-trace', label: 'Circuit Board Trace' },
        { value: 'noise-grain-texture', label: 'Noise Grain Texture' },
        { value: 'video-ambient-loop', label: 'Video Ambient Loop', type: 'js' }
    ];

    // Palette items grouped by section
    var paletteGroups = [
        {
            label: 'Splunk Panels',
            items: [
                { type: 'single',  label: 'Single Value', icon: '#',  iconBg: '#FD1875', desc: 'Big number with trend — perfect for KPIs and metrics' },
                { type: 'chart',   label: 'Chart',        icon: '\u2191', iconBg: '#17A2B8', desc: 'Line, bar, area, pie, or column chart from SPL results' },
                { type: 'table',   label: 'Table',        icon: '\u2637', iconBg: '#5CC05C', desc: 'Data table with sortable columns from search results' },
                { type: 'map',     label: 'Map',          icon: '\u2609', iconBg: '#F7B500', desc: 'Geographic map with data points plotted by location' }
            ]
        },
        {
            label: 'Dashboard Widgets',
            items: [
                { type: 'clock',          label: 'Live Clock',          icon: '\u23F0', iconBg: '#818cf8', desc: 'Real-time clock with timezone — great for NOC screens' },
                { type: 'countdown',      label: 'Countdown Timer',    icon: '\u23F3', iconBg: '#ff6ec7', desc: 'Countdown to a deadline with days/hours/minutes display' },
                { type: 'gauge-speed',    label: 'Speedometer Gauge',  icon: '\u2316', iconBg: '#64b4ff', desc: 'Speedometer-style gauge with animated needle' },
                { type: 'gauge-liquid',   label: 'Liquid Fill Gauge',  icon: '\u2B58', iconBg: '#00ffff', desc: 'Animated liquid fill level inside a circle' },
                { type: 'traffic-lights', label: 'Status Lights',      icon: '\u26AB', iconBg: '#DC3545', desc: 'Red/yellow/green status indicators for services' },
                { type: 'qr-code',        label: 'QR Code',            icon: '\u25A3', iconBg: '#6c757d', desc: 'Generate a QR code from any URL or text' }
            ]
        },
        {
            label: 'Content',
            items: [
                { type: 'html',   label: 'Custom HTML',  icon: '</>',  iconBg: '#d4af37', desc: 'Freeform HTML panel for custom content and messaging' },
                { type: 'spacer', label: 'Spacer',       icon: '\u2015', iconBg: '#3c444d', desc: 'Empty space between panels for visual breathing room' }
            ]
        },
        {
            label: 'User Inputs',
            items: [
                { type: 'input-time',     label: 'Time Picker',    icon: '\u231A', iconBg: '#e11d48', desc: 'Let users pick a time range to filter all panels' },
                { type: 'input-dropdown',  label: 'Dropdown Menu',  icon: '\u25BE', iconBg: '#7c3aed', desc: 'Dropdown filter your users can select from' },
                { type: 'input-text',      label: 'Search Box',     icon: 'Aa',     iconBg: '#0ea5e9', desc: 'Free-text search field to filter dashboard data' },
                { type: 'input-multiselect', label: 'Multi-Select', icon: '\u2611', iconBg: '#059669', desc: 'Select multiple values to filter panels at once' }
            ]
        },
        {
            label: 'KPI & Status',
            items: [
                { type: 'kpi-progress',  label: 'Progress Ring',      icon: '\u25CE', iconBg: '#7c3aed', desc: 'Animated circular progress ring around a value' },
                { type: 'kpi-counter',   label: 'Animated Counter',   icon: '\u2116', iconBg: '#06b6d4', desc: 'Number that rolls up from zero on page load' },
                { type: 'kpi-flip',      label: '3D Flip Card',       icon: '\u21C5', iconBg: '#8b5cf6', desc: 'KPI card that flips in 3D to show details on back' },
                { type: 'sparkline',     label: 'Sparkline Trend',    icon: '\u223F', iconBg: '#14b8a6', desc: 'Big number with a tiny trend line underneath' },
                { type: 'team-board',    label: 'Team Status Board',  icon: '\u229E', iconBg: '#0ea5e9', desc: 'Show team members with online/busy/offline status' },
                { type: 'weather',       label: 'Weather Display',    icon: '\u2600', iconBg: '#f59e0b', desc: 'Animated weather card with temperature and conditions' }
            ]
        },
        {
            label: 'Advanced Views',
            items: [
                { type: 'network-map',   label: 'Network Topology',    icon: '\u2B21', iconBg: '#10b981', desc: 'Interactive network diagram showing server connections' },
                { type: 'globe',         label: '3D Globe Map',        icon: '\u25C9', iconBg: '#3b82f6', desc: 'Rotating 3D globe with data points by location' },
                { type: 'heatmap',       label: 'Activity Heatmap',    icon: '\u25A6', iconBg: '#f97316', desc: 'GitHub-style calendar heatmap showing activity over time' },
                { type: 'kanban',        label: 'Kanban Board',        icon: '\u25A4', iconBg: '#8b5cf6', desc: 'Drag-and-drop task board with columns (To Do, In Progress, Done)' },
                { type: 'org-chart',     label: 'Org Chart',           icon: '\u229F', iconBg: '#14b8a6', desc: 'Interactive hierarchy chart for teams or systems' },
                { type: 'terminal',      label: 'Log Viewer',          icon: '\u25B6', iconBg: '#22c55e', desc: 'Retro terminal-style log display with green-on-black text' },
                { type: 'timeline',      label: 'Timeline / Gantt',    icon: '\u2261', iconBg: '#a855f7', desc: 'Horizontal timeline showing events or project tasks' }
            ]
        }
    ];

    // Pre-built dashboard templates
    var dashboardTemplates = [
        {
            name: 'SOC Command Center',
            subtitle: 'KPIs, area chart, and data table for security ops',
            theme: 'soc-command-center',
            background: 'radar-sweep',
            previewColors: { bg: '#0a0a0a', accent: '#ff3c1e', panel: '#111' },
            rows: [
                [
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' }
                ],
                [
                    { type: 'chart', chartType: 'area' },
                    { type: 'table' }
                ]
            ]
        },
        {
            name: 'Executive Report',
            subtitle: 'Clean layout with KPIs, charts, and pie breakdown',
            theme: 'executive-boardroom',
            background: '',
            previewColors: { bg: '#fafafa', accent: '#1a365d', panel: '#fff' },
            rows: [
                [
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' }
                ],
                [
                    { type: 'chart', chartType: 'area' },
                    { type: 'chart', chartType: 'pie' }
                ]
            ]
        },
        {
            name: 'Infrastructure Monitor',
            subtitle: 'Server KPIs, trend line, and log table',
            theme: 'dark-mode-pro',
            background: 'dark-topography',
            previewColors: { bg: '#1a1b1e', accent: '#818cf8', panel: '#222326' },
            rows: [
                [
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' }
                ],
                [
                    { type: 'chart', chartType: 'line' }
                ],
                [
                    { type: 'table' }
                ]
            ]
        },
        {
            name: 'NOC War Room',
            subtitle: 'Live clock, gauges, traffic lights, and weather',
            theme: 'cyberpunk-neon',
            background: 'cyberpunk-grid-pulse',
            previewColors: { bg: '#0a0a1a', accent: '#00ffff', panel: '#0f0f2a' },
            rows: [
                [
                    { type: 'clock' },
                    { type: 'gauge-speed' },
                    { type: 'gauge-speed' },
                    { type: 'weather' }
                ],
                [
                    { type: 'chart', chartType: 'area' },
                    { type: 'traffic-lights' }
                ],
                [
                    { type: 'table' }
                ]
            ]
        },
        {
            name: 'Project Tracker',
            subtitle: 'Kanban board, timeline, and team status',
            theme: 'dark-mode-pro',
            background: '',
            previewColors: { bg: '#1a1b1e', accent: '#818cf8', panel: '#222326' },
            rows: [
                [
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' }
                ],
                [
                    { type: 'kanban' }
                ],
                [
                    { type: 'timeline' },
                    { type: 'team-board' }
                ]
            ]
        },
        {
            name: 'Analytics Deep Dive',
            subtitle: 'KPIs, charts, heatmap, and data table',
            theme: 'gradient-luxury',
            background: 'animated-mesh-gradient',
            previewColors: { bg: '#1a1a2e', accent: '#d4af37', panel: '#1e1428' },
            rows: [
                [
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' },
                    { type: 'single' }
                ],
                [
                    { type: 'chart', chartType: 'area' },
                    { type: 'chart', chartType: 'pie' }
                ],
                [
                    { type: 'heatmap' },
                    { type: 'table' }
                ]
            ]
        },
        {
            name: 'Blank Canvas',
            subtitle: 'Start from scratch with empty panels',
            theme: '',
            background: '',
            previewColors: { bg: '#222629', accent: '#FD1875', panel: '#2b3033' },
            rows: [
                [
                    { type: 'empty' },
                    { type: 'empty' },
                    { type: 'empty' }
                ]
            ]
        }
    ];

    var MAX_COLS = 4;

    // Map panel types to their display labels
    var panelTypeLabels = {
        'single':          'SINGLE VALUE',
        'chart':           'CHART',
        'table':           'TABLE',
        'map':             'MAP',
        'clock':           'CLOCK',
        'countdown':       'COUNTDOWN',
        'gauge-speed':     'SPEEDOMETER',
        'gauge-liquid':    'LIQUID GAUGE',
        'traffic-lights':  'TRAFFIC LIGHTS',
        'qr-code':         'QR CODE',
        'team-board':      'TEAM BOARD',
        'weather':         'WEATHER',
        'kpi-progress':    'CIRCULAR PROGRESS',
        'kpi-counter':     'ANIMATED COUNTER',
        'kpi-flip':        'KPI 3D FLIP',
        'sparkline':       'SPARKLINE',
        'network-map':     'NETWORK MAP',
        'globe':           '3D GLOBE',
        'heatmap':         'HEATMAP',
        'kanban':          'KANBAN',
        'org-chart':       'ORG CHART',
        'terminal':        'TERMINAL LOG',
        'timeline':        'TIMELINE',
        'html':            'HTML',
        'spacer':          'SPACER',
        'empty':           'EMPTY'
    };

    // Which types are "search-based" visualizations
    var searchTypes = ['single', 'chart', 'table', 'map', 'kpi-counter', 'kpi-flip', 'sparkline'];

    // Which types are widgets (rendered as HTML panels in export)
    var widgetTypes = ['clock', 'countdown', 'gauge-speed', 'gauge-liquid', 'traffic-lights', 'qr-code',
        'team-board', 'weather', 'kpi-progress', 'kpi-counter', 'kpi-flip', 'sparkline',
        'network-map', 'globe', 'heatmap', 'kanban', 'org-chart', 'terminal', 'timeline'];

    // Chart sub-types
    var chartTypes = ['line', 'bar', 'area', 'pie', 'column'];

    // Detailed help for each effect (shown in info modal)
    var effectDetails = {
        'panel-entrance-fade': { how: 'Panels start invisible and fade to full opacity on page load. Each panel has a staggered delay for a cascading entrance.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="display:flex;gap:6px;"><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;animation:_demoFade 2s ease infinite;"></div><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;animation:_demoFade 2s ease 0.3s infinite;"></div><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;animation:_demoFade 2s ease 0.6s infinite;"></div></div><style>@keyframes _demoFade{0%,100%{opacity:0}50%{opacity:1}}</style>' },
        'panel-entrance-slide': { how: 'Panels start 30px below their final position and slide up while fading in. Staggered per panel.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="display:flex;gap:6px;"><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;animation:_demoSlide 2s ease infinite;"></div><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;animation:_demoSlide 2s ease 0.3s infinite;"></div></div><style>@keyframes _demoSlide{0%,100%{opacity:0;transform:translateY(15px)}50%{opacity:1;transform:translateY(0)}}</style>' },
        'hover-scale-lift': { how: 'When you hover over a panel, it scales up slightly (1.02x) and lifts with a shadow, giving a 3D floating effect.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="width:120px;height:50px;background:#2b3033;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#6c757d;animation:_demoLift 2s ease infinite;box-shadow:0 2px 4px rgba(0,0,0,0.2);">Hover me</div><style>@keyframes _demoLift{0%,100%{transform:scale(1);box-shadow:0 2px 4px rgba(0,0,0,0.2)}50%{transform:scale(1.04) translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,0.3)}}</style>' },
        'hover-glow-border': { how: 'Panels get a colored glowing border when hovered. The glow color matches the theme accent.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="width:120px;height:50px;background:#2b3033;border-radius:6px;border:1px solid #3c444d;display:flex;align-items:center;justify-content:center;font-size:10px;color:#6c757d;animation:_demoGlow 2s ease infinite;">Panel</div><style>@keyframes _demoGlow{0%,100%{box-shadow:none;border-color:#3c444d}50%{box-shadow:0 0 15px rgba(253,24,117,0.4);border-color:rgba(253,24,117,0.5)}}</style>' },
        'button-ripple-effect': { how: 'When a user clicks any button, a ripple wave radiates from the click point. Adds a Material Design feel.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="position:relative;overflow:hidden;width:100px;height:36px;background:#FD1875;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:600;">Click me<div style="position:absolute;width:30px;height:30px;background:rgba(255,255,255,0.4);border-radius:50%;animation:_demoRipple 1.5s ease infinite;"></div></div><style>@keyframes _demoRipple{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}</style>' },
        'scroll-reveal': { how: 'Panels below the fold start hidden and animate into view as the user scrolls down. Great for long dashboards.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="display:flex;flex-direction:column;gap:4px;"><div style="width:140px;height:20px;background:#2b3033;border-radius:3px;opacity:1;"></div><div style="width:140px;height:20px;background:#2b3033;border-radius:3px;animation:_demoReveal 2s ease infinite;"></div><div style="width:140px;height:20px;background:#2b3033;border-radius:3px;animation:_demoReveal 2s ease 0.3s infinite;"></div></div><style>@keyframes _demoReveal{0%,30%{opacity:0;transform:translateY(10px)}60%,100%{opacity:1;transform:translateY(0)}}</style>' },
        'typewriter-text': { how: 'Text in HTML panels types itself out character by character on load, like a terminal typing effect.', note: 'Requires JS. Add class "sit-typewriter" to your HTML text elements.',
            demo: '<div style="font-family:monospace;font-size:13px;color:#33ff33;overflow:hidden;white-space:nowrap;border-right:2px solid #33ff33;width:fit-content;animation:_demoType 3s steps(20) infinite,_demoBlink 0.5s step-end infinite;">System status: online</div><style>@keyframes _demoType{0%,100%{width:0}50%{width:100%}}@keyframes _demoBlink{50%{border-color:transparent}}</style>' },
        'number-morph': { how: 'Single value numbers smoothly animate (morph) when they change value, instead of jumping to the new number.', note: 'Requires JS. Applies to all single value panels automatically.',
            demo: '<div style="font-size:28px;font-weight:700;color:#FD1875;font-family:monospace;text-align:center;"><span style="display:inline-block;animation:_demoCount 3s ease infinite;">1,247</span></div><style>@keyframes _demoCount{0%{opacity:0.3;transform:translateY(5px)}10%{opacity:1;transform:translateY(0)}90%{opacity:1;transform:translateY(0)}100%{opacity:0.3;transform:translateY(-5px)}}</style>' },
        'pulse-attention': { how: 'Panels pulse with a subtle glow animation to draw the eye. Good for critical KPIs that need attention.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="width:120px;height:50px;background:#2b3033;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#DC3545;animation:_demoPulse 1.5s ease infinite;">ALERT</div><style>@keyframes _demoPulse{0%,100%{box-shadow:0 0 0 rgba(220,53,69,0)}50%{box-shadow:0 0 20px rgba(220,53,69,0.4)}}</style>' },
        'shimmer-loading': { how: 'While data is loading, panels show a shimmering gradient placeholder instead of the default spinner. Looks like a skeleton screen.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="display:flex;flex-direction:column;gap:6px;"><div style="width:140px;height:14px;border-radius:3px;background:linear-gradient(90deg,#2b3033 25%,#3c444d 50%,#2b3033 75%);background-size:200% 100%;animation:_demoShimmer 1.5s infinite;"></div><div style="width:100px;height:14px;border-radius:3px;background:linear-gradient(90deg,#2b3033 25%,#3c444d 50%,#2b3033 75%);background-size:200% 100%;animation:_demoShimmer 1.5s 0.2s infinite;"></div><div style="width:120px;height:14px;border-radius:3px;background:linear-gradient(90deg,#2b3033 25%,#3c444d 50%,#2b3033 75%);background-size:200% 100%;animation:_demoShimmer 1.5s 0.4s infinite;"></div></div><style>@keyframes _demoShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>' },
        'stagger-grid': { how: 'Panels appear one by one in a cascading waterfall pattern, top-left to bottom-right.', note: 'CSS-only. Works in Splunk Cloud.',
            demo: '<div style="display:grid;grid-template-columns:repeat(3,40px);gap:4px;"><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease infinite;"></div><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease 0.2s infinite;"></div><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease 0.4s infinite;"></div><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease 0.6s infinite;"></div><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease 0.8s infinite;"></div><div style="height:30px;background:#2b3033;border-radius:3px;animation:_demoStag 2.5s ease 1s infinite;"></div></div><style>@keyframes _demoStag{0%,100%{opacity:0;transform:scale(0.8)}30%,70%{opacity:1;transform:scale(1)}}</style>' },
        'dark-light-mode': { how: 'Adds a toggle button in the dashboard header. Click it to switch between dark and light color schemes. The preference is saved in the browser.', note: 'Requires JS. Button appears next to Edit/Export.',
            demo: '<div style="display:flex;gap:8px;align-items:center;"><div style="width:100px;height:50px;border-radius:6px;animation:_demoDL 4s ease infinite;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;">Dashboard</div><div style="background:#2b3033;border-radius:12px;padding:4px 10px;font-size:11px;color:#e0e0e0;animation:_demoDLbtn 4s step-end infinite;">&#9790; Dark</div></div><style>@keyframes _demoDL{0%,45%{background:#1a1b1e;color:#e0e0e0}55%,100%{background:#f0f2f5;color:#1a1a1a}}@keyframes _demoDLbtn{0%,45%{background:#2b3033;color:#e0e0e0}55%,100%{background:#e0e0e0;color:#1a1a1a}}</style>' },
        'fullscreen-mode': { how: 'Adds a fullscreen button in the header. Click to expand the dashboard to fill the entire screen. Press ESC or click again to exit. Perfect for NOC/SOC wall displays.', note: 'Requires JS. Uses the browser Fullscreen API.',
            demo: '<div style="position:relative;width:140px;height:60px;background:#1a1b1e;border-radius:6px;border:1px solid #3c444d;animation:_demoFS 3s ease infinite;overflow:hidden;"><div style="position:absolute;top:4px;right:4px;font-size:14px;color:#a0a0a0;">&#x26F6;</div><div style="padding:8px;font-size:8px;color:#6c757d;">Dashboard content</div></div><style>@keyframes _demoFS{0%,100%{transform:scale(1);border-radius:6px}50%{transform:scale(1.15);border-radius:2px}}</style>' },
        'panel-collapse-accordion': { how: 'Adds a collapse/expand arrow to each panel header. Click to toggle. A "Collapse All" button appears in the header. Panel states are saved per dashboard.', note: 'Requires JS. States saved in browser localStorage.',
            demo: '<div style="width:140px;background:#2b3033;border-radius:6px;overflow:hidden;"><div style="padding:6px 8px;font-size:10px;font-weight:600;color:#e0e0e0;border-bottom:1px solid #3c444d;display:flex;justify-content:space-between;">Panel Title <span style="animation:_demoArr 2s step-end infinite;">&#9660;</span></div><div style="animation:_demoCollapse 2s ease infinite;overflow:hidden;"><div style="padding:6px 8px;font-size:9px;color:#6c757d;">Panel content here...</div></div></div><style>@keyframes _demoCollapse{0%,40%{max-height:40px;opacity:1}50%,90%{max-height:0;opacity:0}100%{max-height:40px;opacity:1}}@keyframes _demoArr{0%,40%{transform:rotate(0)}50%,90%{transform:rotate(-90deg)}}</style>' },
        'panel-zoom-focus': { how: 'Click any panel to zoom it full-screen with a dark overlay. Click again or press ESC to close. Great for presenting individual charts.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="position:relative;width:140px;height:50px;"><div style="width:60px;height:40px;background:#2b3033;border-radius:4px;position:absolute;animation:_demoZoom 3s ease infinite;display:flex;align-items:center;justify-content:center;font-size:8px;color:#6c757d;">Click to zoom</div></div><style>@keyframes _demoZoom{0%,100%{width:60px;height:40px;left:0;top:0;z-index:0}40%,60%{width:130px;height:48px;left:5px;top:0;z-index:10;box-shadow:0 8px 32px rgba(0,0,0,0.5)}}</style>' },
        'keyboard-shortcuts': { how: 'Arrow keys navigate between panels. R refreshes data. F toggles fullscreen. 1-9 jump to specific panels. H shows the shortcut help overlay.', note: 'Requires JS. Press H to see all shortcuts.',
            demo: '<div style="display:flex;gap:4px;"><div style="width:28px;height:28px;background:#2b3033;border:1px solid #3c444d;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#a0a0a0;animation:_demoKey 2s ease infinite;">&#8592;</div><div style="width:28px;height:28px;background:#2b3033;border:1px solid #3c444d;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#a0a0a0;animation:_demoKey 2s ease 0.5s infinite;">&#8594;</div><div style="width:28px;height:28px;background:#2b3033;border:1px solid #3c444d;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#FD1875;animation:_demoKey 2s ease 1s infinite;">R</div><div style="width:28px;height:28px;background:#2b3033;border:1px solid #3c444d;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#17A2B8;animation:_demoKey 2s ease 1.5s infinite;">H</div></div><style>@keyframes _demoKey{0%,100%{transform:translateY(0);background:#2b3033}15%{transform:translateY(2px);background:#1a1e22}}</style>' },
        'auto-refresh-countdown': { how: 'Adds a countdown timer in the header showing seconds until next refresh. When it reaches zero, all searches re-run. Default interval: 5 minutes.', note: 'Requires JS. Interval configurable via data attributes.',
            demo: '<div style="display:flex;align-items:center;gap:6px;background:#2b3033;border-radius:6px;padding:6px 12px;"><div style="width:18px;height:18px;border:2px solid #5CC05C;border-radius:50%;border-top-color:transparent;animation:_demoSpin 1s linear infinite;"></div><div style="font-size:13px;font-weight:600;color:#5CC05C;font-family:monospace;animation:_demoTimer 5s linear infinite;">4:58</div><span style="font-size:10px;color:#6c757d;">refresh</span></div><style>@keyframes _demoSpin{to{transform:rotate(360deg)}}@keyframes _demoTimer{0%{content:"5:00"}100%{content:"0:00"}}</style>' },
        'right-click-context-menu': { how: 'Right-click any panel to get a context menu with options: Open in Search, Export CSV, Zoom Panel, Refresh Data, Copy to Clipboard.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="background:#1a1e22;border:1px solid #3c444d;border-radius:6px;padding:4px 0;width:140px;box-shadow:0 4px 12px rgba(0,0,0,0.4);"><div style="padding:4px 12px;font-size:10px;color:#e0e0e0;cursor:default;">Open in Search</div><div style="padding:4px 12px;font-size:10px;color:#e0e0e0;background:rgba(253,24,117,0.1);cursor:default;">Export CSV</div><div style="padding:4px 12px;font-size:10px;color:#e0e0e0;cursor:default;">Zoom Panel</div><div style="padding:4px 12px;font-size:10px;color:#e0e0e0;cursor:default;">Refresh Data</div></div>' },
        'user-preferences-persist': { how: 'Saves all user customizations (dark mode, collapsed panels, filter selections, time range) to the browser. Next visit restores their preferences.', note: 'Requires JS. Data stored in browser localStorage.',
            demo: '<div style="display:flex;gap:6px;align-items:center;"><div style="font-size:20px;">&#128190;</div><div style="font-size:10px;color:#a0a0a0;line-height:1.4;"><div>Dark mode: <span style="color:#5CC05C;">saved</span></div><div>Time range: <span style="color:#5CC05C;">saved</span></div><div>Filters: <span style="color:#5CC05C;">saved</span></div></div></div>' },
        'drag-resize-panels': { how: 'Adds drag handles between panels. Drag left/right to resize panel widths. Minimum width is 15% of the row.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="display:flex;align-items:stretch;height:40px;"><div style="background:#2b3033;border-radius:4px 0 0 4px;animation:_demoDrag 3s ease infinite;display:flex;align-items:center;justify-content:center;font-size:8px;color:#6c757d;">Panel A</div><div style="width:4px;background:#FD1875;cursor:col-resize;flex-shrink:0;"></div><div style="background:#2b3033;border-radius:0 4px 4px 0;flex:1;display:flex;align-items:center;justify-content:center;font-size:8px;color:#6c757d;">Panel B</div></div><style>@keyframes _demoDrag{0%,100%{flex:1}50%{flex:2}}</style>' },
        'filter-chips-tags': { how: 'Converts dropdown form inputs into colorful clickable tag-style pills (chips). More visual and compact than standard Splunk dropdowns.', note: 'Requires JS. Only works when your dashboard has dropdown inputs.',
            demo: '<div style="display:flex;gap:4px;flex-wrap:wrap;"><span style="background:rgba(253,24,117,0.15);color:#FD1875;border:1px solid rgba(253,24,117,0.3);padding:3px 10px;border-radius:12px;font-size:10px;font-weight:500;">All Sources</span><span style="background:rgba(23,162,184,0.15);color:#17A2B8;border:1px solid rgba(23,162,184,0.3);padding:3px 10px;border-radius:12px;font-size:10px;font-weight:500;">web_access</span><span style="background:rgba(92,192,92,0.15);color:#5CC05C;border:1px solid rgba(92,192,92,0.3);padding:3px 10px;border-radius:12px;font-size:10px;font-weight:500;">syslog</span></div>' },
        'sidebar-slide-panel': { how: 'Adds a hidden sidebar that slides in from the right edge. Contains panel details, search info, and quick actions. Toggle with a tab on the edge.', note: 'Requires JS. Classic dashboards only.',
            demo: '<div style="position:relative;width:150px;height:60px;background:#1a1b1e;border-radius:6px;overflow:hidden;"><div style="padding:8px;font-size:8px;color:#6c757d;">Dashboard</div><div style="position:absolute;right:0;top:0;bottom:0;width:60px;background:#0a0e12;border-left:1px solid #FD1875;padding:6px;animation:_demoSlide2 3s ease infinite;"><div style="font-size:7px;color:#FD1875;font-weight:600;">Details</div><div style="font-size:7px;color:#6c757d;margin-top:2px;">Search info</div></div></div><style>@keyframes _demoSlide2{0%,100%{transform:translateX(100%)}30%,70%{transform:translateX(0)}}</style>' },
        'kpi-circular-progress': { how: 'Wraps single value KPI numbers in an animated SVG circular progress ring. The ring fills based on the value relative to a max.', note: 'Requires JS. Set data-progress-max on the panel.',
            demo: '<svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="none" stroke="#2b3033" stroke-width="4"/><circle cx="30" cy="30" r="24" fill="none" stroke="#7c3aed" stroke-width="4" stroke-dasharray="151" stroke-linecap="round" transform="rotate(-90 30 30)" style="animation:_demoRing 2s ease infinite;"><animate attributeName="stroke-dashoffset" values="151;40;151" dur="2s" repeatCount="indefinite"/></circle><text x="30" y="34" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">75%</text></svg>' },
        'kpi-3d-flip': { how: 'Single value panels flip in 3D when hovered, revealing additional detail on the back.', note: 'Requires JS. Add class "flip-card" to target panels.',
            demo: '<div style="perspective:200px;width:100px;height:60px;"><div style="width:100%;height:100%;position:relative;animation:_demoFlip 3s ease infinite;transform-style:preserve-3d;"><div style="position:absolute;width:100%;height:100%;background:linear-gradient(135deg,#1e293b,#334155);border-radius:6px;backface-visibility:hidden;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;">99.9%</div><div style="position:absolute;width:100%;height:100%;background:linear-gradient(135deg,#334155,#1e293b);border-radius:6px;backface-visibility:hidden;transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;text-align:center;">Uptime<br>Last 30d</div></div></div><style>@keyframes _demoFlip{0%,40%{transform:rotateY(0)}50%,90%{transform:rotateY(180deg)}100%{transform:rotateY(360deg)}}</style>' },
        'kpi-animated-counter': { how: 'When the page loads, KPI numbers roll up from 0 to their actual value with an easing animation.', note: 'Requires JS. No configuration needed.',
            demo: '<div style="text-align:center;"><div style="font-size:28px;font-weight:700;color:#06b6d4;font-family:monospace;"><span style="display:inline-block;animation:_demoCnt 2s ease-out infinite;">48,291</span></div><div style="font-size:9px;color:#6c757d;">rolls up from 0</div></div><style>@keyframes _demoCnt{0%{opacity:0;transform:translateY(10px)}20%{opacity:1;transform:translateY(0)}}</style>' },
        'sparkline-inline': { how: 'Adds a tiny SVG trend line below each single value number.', note: 'Requires JS. Provide data via data-sparkline attribute.',
            demo: '<div style="text-align:center;"><div style="font-size:22px;font-weight:700;color:#14b8a6;">3,847</div><svg width="80" height="20" viewBox="0 0 80 20"><polyline points="0,15 10,12 20,14 30,8 40,10 50,5 60,7 70,3 80,6" fill="none" stroke="#14b8a6" stroke-width="1.5"/><polygon points="0,15 10,12 20,14 30,8 40,10 50,5 60,7 70,3 80,6 80,20 0,20" fill="rgba(20,184,166,0.15)"/></svg><div style="font-size:8px;color:#6c757d;">Requests / min</div></div>' },
        'confetti-celebration': { how: 'When a single value KPI crosses a threshold, confetti bursts across the screen.', note: 'Requires JS. Configure threshold via data attributes on the panel.',
            demo: '<div style="position:relative;width:150px;height:60px;overflow:hidden;"><div style="text-align:center;padding-top:10px;"><div style="font-size:20px;font-weight:700;color:#5CC05C;">1,024</div><div style="font-size:8px;color:#6c757d;">Threshold: 1,000</div></div><div style="position:absolute;top:0;left:20%;font-size:14px;animation:_demoCon 1.5s ease infinite;">&#127881;</div><div style="position:absolute;top:0;left:50%;font-size:12px;animation:_demoCon 1.5s ease 0.3s infinite;">&#127882;</div><div style="position:absolute;top:0;left:75%;font-size:14px;animation:_demoCon 1.5s ease 0.6s infinite;">&#10024;</div></div><style>@keyframes _demoCon{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(60px) rotate(180deg);opacity:0}}</style>' },
        'alert-toast-notifications': { how: 'Shows popup toast notifications when data changes or thresholds are hit.', note: 'Requires JS. Add "toast-trigger" class to panels.',
            demo: '<div style="display:flex;flex-direction:column;gap:4px;"><div style="background:#1a1e22;border-left:3px solid #5CC05C;border-radius:4px;padding:6px 10px;font-size:9px;color:#e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:_demoToast 3s ease infinite;">&#9989; KPI exceeded target</div><div style="background:#1a1e22;border-left:3px solid #F7B500;border-radius:4px;padding:6px 10px;font-size:9px;color:#e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:_demoToast 3s ease 0.5s infinite;">&#9888; Warning threshold reached</div><div style="background:#1a1e22;border-left:3px solid #DC3545;border-radius:4px;padding:6px 10px;font-size:9px;color:#e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:_demoToast 3s ease 1s infinite;">&#10060; Error detected</div></div><style>@keyframes _demoToast{0%{transform:translateX(30px);opacity:0}15%,85%{transform:translateX(0);opacity:1}100%{transform:translateX(30px);opacity:0}}</style>' },
        'chart-annotations': { how: 'Adds vertical marker lines and labels to time-series charts. Useful for marking deployments, incidents, or maintenance windows.', note: 'Requires JS. Advanced — requires additional data configuration.',
            demo: '<div style="position:relative;width:150px;height:50px;background:#2b3033;border-radius:4px;padding:4px;"><svg width="100%" height="100%" viewBox="0 0 140 40"><polyline points="0,30 20,25 40,28 60,15 80,20 100,10 120,18 140,14" fill="none" stroke="#17A2B8" stroke-width="1.5"/><line x1="60" y1="0" x2="60" y2="40" stroke="#FD1875" stroke-width="1" stroke-dasharray="3,2"/><line x1="100" y1="0" x2="100" y2="40" stroke="#F7B500" stroke-width="1" stroke-dasharray="3,2"/><text x="62" y="8" fill="#FD1875" font-size="6">Deploy</text><text x="102" y="8" fill="#F7B500" font-size="6">Incident</text></svg></div>' }
    };

    // Show effect info modal
    function showEffectInfo(effectValue) {
        var info = effectDetails[effectValue];
        if (!info) return;
        // Find the effect label from enhancements
        var label = effectValue;
        var desc = '';
        ['animations', 'controls', 'kpiEffects', 'dashExtras'].forEach(function(group) {
            enhancements[group].forEach(function(e) {
                if (e.value === effectValue) { label = e.label; desc = e.desc; }
            });
        });

        var $backdrop = $('<div>').css({ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',zIndex:300000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)' });
        var $modal = $('<div>').css({ background:'#1a1e22',borderRadius:'12px',border:'1px solid #3c444d',padding:'24px',maxWidth:'480px',width:'90%',color:'#e0e0e0',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',boxShadow:'0 16px 48px rgba(0,0,0,0.5)' });

        var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">';
        h += '<h3 style="margin:0;font-size:18px;font-weight:700;color:#fff;">' + esc(label) + '</h3>';
        h += '<button class="ds-info-close" style="background:none;border:none;color:#6c757d;font-size:22px;cursor:pointer;padding:0 4px;">&times;</button>';
        h += '</div>';
        h += '<div style="font-size:13px;color:#FD1875;margin-bottom:12px;font-weight:500;">' + esc(desc) + '</div>';

        // Animated demo preview
        if (info.demo) {
            h += '<div style="background:#111215;border:1px solid #2b3033;border-radius:8px;padding:16px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;min-height:60px;">';
            h += info.demo;
            h += '</div>';
        }

        h += '<div style="font-size:13px;color:#a0a0a0;line-height:1.6;margin-bottom:16px;">' + esc(info.how) + '</div>';
        h += '<div style="font-size:11px;color:#F7B500;background:rgba(247,181,0,0.08);border:1px solid rgba(247,181,0,0.15);border-radius:6px;padding:8px 12px;">' + esc(info.note) + '</div>';

        $modal.html(h);
        $backdrop.append($modal).appendTo('body');
        $backdrop.on('click', '.ds-info-close', function() { $backdrop.remove(); });
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) $backdrop.remove(); });
    }

    // Widget type → JS/CSS file mapping (used by XML gen + preview loader)
    var widgetJsMap = {
        'clock':          'widgets/real-time-clock.js',
        'countdown':      'widgets/countdown-timer.js',
        'gauge-speed':    'widgets/gauge-speedometer.js',
        'gauge-liquid':   'widgets/gauge-liquid-fill.js',
        'traffic-lights': 'widgets/status-traffic-lights.css',
        'qr-code':        'widgets/qr-code-generator.js',
        'team-board':     'widgets/team-status-board.js',
        'weather':        'widgets/weather-widget.js',
        'kpi-progress':   'widgets/kpi-circular-progress.js',
        'kpi-counter':    'widgets/kpi-animated-counter.js',
        'kpi-flip':       'widgets/kpi-3d-flip.js',
        'sparkline':      'widgets/sparkline-inline.js',
        'network-map':    'visualizations/animated-svg-network-map.js',
        'globe':          'visualizations/globe-3d-rotate.js',
        'heatmap':        'visualizations/heatmap-calendar.js',
        'kanban':         'visualizations/kanban-board.js',
        'org-chart':      'visualizations/org-chart-interactive.js',
        'terminal':       'visualizations/terminal-log-viewer.js',
        'timeline':       'visualizations/timeline-gantt.js'
    };

    // ========================================
    // State
    // ========================================

    // Enhancement options (checkboxes)
    var enhancements = {
        animations: [
            { value: 'panel-entrance-fade', label: 'Fade In', desc: 'Panels gently fade in when the page loads' },
            { value: 'panel-entrance-slide', label: 'Slide Up', desc: 'Panels slide up into view on load' },
            { value: 'hover-scale-lift', label: 'Hover Lift', desc: 'Panels grow slightly when you hover over them' },
            { value: 'hover-glow-border', label: 'Hover Glow', desc: 'Panels glow with a colored border on hover' },
            { value: 'button-ripple-effect', label: 'Button Ripple', desc: 'Buttons show a ripple effect when clicked', type: 'js' },
            { value: 'scroll-reveal', label: 'Scroll Reveal', desc: 'Panels animate in as you scroll down', type: 'js' },
            { value: 'typewriter-text', label: 'Typewriter Text', desc: 'Text types itself out letter by letter', type: 'js' },
            { value: 'number-morph', label: 'Number Morph', desc: 'Numbers smoothly animate between values', type: 'js' },
            { value: 'pulse-attention', label: 'Pulse Glow', desc: 'Panels pulse to draw attention to important data' },
            { value: 'shimmer-loading', label: 'Shimmer Loading', desc: 'Show shimmering skeleton placeholders while data loads' },
            { value: 'stagger-grid', label: 'Stagger Cascade', desc: 'Panels appear one by one in a cascading waterfall' }
        ],
        controls: [
            { value: 'dark-light-mode', label: 'Dark / Light Toggle', desc: 'Adds a switch to flip between dark and light mode', type: 'js' },
            { value: 'fullscreen-mode', label: 'Fullscreen Button', desc: 'Adds a button to go fullscreen (great for NOC screens)', type: 'js' },
            { value: 'panel-collapse-accordion', label: 'Collapsible Panels', desc: 'Click panel headers to collapse or expand them', type: 'js' },
            { value: 'panel-zoom-focus', label: 'Panel Zoom', desc: 'Click a panel to zoom it full-screen, click again to close', type: 'js' },
            { value: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', desc: 'Navigate panels with arrow keys, R to refresh', type: 'js' },
            { value: 'auto-refresh-countdown', label: 'Auto-Refresh Timer', desc: 'Shows a countdown bar and auto-refreshes data', type: 'js' },
            // tab-navigation removed from manual controls — it's auto-included
            // only when multiple pages exist. Including it on a single-page
            // dashboard hides all rows except the first, breaking the layout.
            { value: 'right-click-context-menu', label: 'Right-Click Menu', desc: 'Right-click panels for export, zoom, and refresh options', type: 'js' },
            { value: 'user-preferences-persist', label: 'Remember Preferences', desc: 'Saves user choices (filters, time range) across sessions', type: 'js' },
            { value: 'drag-resize-panels', label: 'Drag to Resize', desc: 'Users can drag panel edges to resize them', type: 'js' },
            { value: 'filter-chips-tags', label: 'Filter Chips', desc: 'Clickable tag-style filter buttons above panels', type: 'js' },
            { value: 'sidebar-slide-panel', label: 'Slide-Out Sidebar', desc: 'Adds a hidden sidebar that slides in for details', type: 'js' }
        ],
        kpiEffects: [
            { value: 'kpi-circular-progress', label: 'Progress Rings', desc: 'Wraps KPI numbers in animated circular progress rings', type: 'js' },
            { value: 'kpi-3d-flip', label: '3D Flip Cards', desc: 'KPI panels flip in 3D on hover to show details on the back', type: 'js' },
            { value: 'kpi-animated-counter', label: 'Animated Counters', desc: 'Numbers roll up from 0 to their actual value on load', type: 'js' },
            { value: 'sparkline-inline', label: 'Sparkline Trends', desc: 'Adds a tiny trend line below each KPI number', type: 'js' }
        ],
        dashExtras: [
            { value: 'confetti-celebration', label: 'Confetti Burst', desc: 'Confetti explodes when a KPI crosses a threshold', type: 'js' },
            { value: 'alert-toast-notifications', label: 'Toast Alerts', desc: 'Pop-up notifications when data changes or thresholds are hit', type: 'js' },
            { value: 'chart-annotations', label: 'Chart Markers', desc: 'Adds vertical marker lines and labels to time-series charts', type: 'js' }
        ],
        kpiStyles: [
            { value: '', label: 'Default KPI' },
            { value: 'kpi-glassmorphism', label: 'Glassmorphism' },
            { value: 'kpi-neon-glow', label: 'Neon Glow' },
            { value: 'status-traffic-lights', label: 'Traffic Lights' },
            { value: 'loading-skeleton', label: 'Loading Skeletons' },
            { value: 'news-ticker-scroll', label: 'News Ticker' }
        ],
        tableStyles: [
            { value: '', label: 'Default Tables' },
            { value: 'table-enhanced', label: 'Enhanced Tables' },
            { value: 'print-optimized', label: 'Print Optimized' },
            { value: 'sankey-flow-styled', label: 'Sankey Flow Styled' }
        ],
        uiFramework: [
            { value: 'css/sit-core.css,css/sit-components.css', label: 'Styled UI Components', desc: 'Adds beautiful buttons, cards, badges, alerts, and tabs to your HTML panels', ref: true },
            { value: 'js/sit-toolkit.js', label: 'Interactive Components', desc: 'Enables modals, toast popups, and toggle switches in your HTML panels', ref: true, type: 'js' }
        ]
    };

    var studio = {
        title: 'My Dashboard',
        description: '',
        theme: '',
        background: '',
        kpiStyle: '',
        tableStyle: '',
        animations: [],
        controls: [],
        kpiEffects: [],
        dashExtras: [],
        uiFramework: [],
        formInputs: [],
        textColorPreset: '',
        pages: [{ name: 'Page 1', rows: [] }],
        activePage: 0
    };

    // Helper: get rows for the active page (used everywhere instead of activeRows())
    function activeRows() {
        var page = studio.pages[studio.activePage];
        return page ? page.rows : [];
    }

    // ========================================
    // Undo / Redo History
    // ========================================
    var history = [];
    var historyIndex = -1;
    var MAX_HISTORY = 50;

    function pushHistory() {
        // Discard any redo states ahead of current position
        history = history.slice(0, historyIndex + 1);
        // Deep clone current studio state
        history.push(JSON.parse(JSON.stringify(studio)));
        if (history.length > MAX_HISTORY) history.shift();
        historyIndex = history.length - 1;
    }

    function undo() {
        if (historyIndex <= 0) { showToast('Nothing to undo', 'info'); return; }
        historyIndex--;
        restoreHistory();
        showToast('Undo', 'info');
    }

    function redo() {
        if (historyIndex >= history.length - 1) { showToast('Nothing to redo', 'info'); return; }
        historyIndex++;
        restoreHistory();
        showToast('Redo', 'info');
    }

    function restoreHistory() {
        var snapshot = JSON.parse(JSON.stringify(history[historyIndex]));
        studio.title = snapshot.title;
        studio.description = snapshot.description;
        studio.theme = snapshot.theme;
        studio.background = snapshot.background;
        studio.kpiStyle = snapshot.kpiStyle;
        studio.tableStyle = snapshot.tableStyle;
        studio.textColorPreset = snapshot.textColorPreset || '';
        studio.animations = snapshot.animations;
        studio.controls = snapshot.controls;
        studio.kpiEffects = snapshot.kpiEffects || [];
        studio.dashExtras = snapshot.dashExtras || [];
        studio.uiFramework = snapshot.uiFramework;
        studio.formInputs = snapshot.formInputs || [];
        // Restore pages (backwards compat: old snapshots have .rows instead of .pages)
        if (snapshot.pages) {
            studio.pages = snapshot.pages;
            studio.activePage = snapshot.activePage || 0;
        } else if (snapshot.rows) {
            studio.pages = [{ name: 'Page 1', rows: snapshot.rows }];
            studio.activePage = 0;
        }
        selectedPanel = null;
        render();
        updateCanvasTheme();
    }

    // Track which panel is selected: { rowIdx, colIdx } or null
    var selectedPanel = null;

    // Preview mode — hides all builder chrome, shows clean dashboard
    var previewMode = false;

    // Cloud mode — hides buttons that won't work on Splunk Cloud
    var cloudMode = true;
    try { var stored = localStorage.getItem('sit_ds_cloud_mode'); if (stored !== null) cloudMode = stored === '1'; } catch(e) {}

    // ========================================
    // Render
    // ========================================

    function render() {
        var $container = $('#sit-design-studio');
        if ($container.length === 0) return;

        var html = '<div class="sit-ds' + (previewMode ? ' sit-ds-preview-mode' : '') + '">';

        // --- TOP BAR ---
        html += renderTopBar();

        // --- WORKSPACE (sidebar + canvas) ---
        html += '<div class="sit-ds-workspace">';
        if (!previewMode) {
            html += renderSidebar();
        }
        html += renderCanvas();
        html += '</div>';

        // Watermark
        html += '<div style="text-align:center;padding:8px 0;font-size:10px;border-top:1px solid #2b3033;color:#4a545e;">';
        html += 'Splunk Innovators Network &mdash; <a href="https://www.linkedin.com/groups/16364058/" target="_blank" style="color:#FD1875;text-decoration:none;font-weight:600;">Join Now!</a>';
        html += ' &middot; <a href="#" id="ds-show-tour" style="color:#4a545e;text-decoration:none;font-size:9px;">Show tour</a>';
        html += '</div>';

        html += '</div>';
        $container.html(html);
        bindEvents();
    }

    // ---------- TOP BAR ----------

    function renderTopBar() {
        var h = '<div class="sit-ds-top-bar">';

        // Left: Title
        h += '<div class="sit-ds-top-bar-left">';
        h += '<input class="sit-ds-input" id="ds-title" type="text" value="' + escAttr(studio.title) + '" placeholder="Dashboard title" style="width:160px;font-weight:600;font-size:13px;" />';
        h += '<input class="sit-ds-input" id="ds-description" type="text" value="' + escAttr(studio.description) + '" placeholder="Description" style="width:140px;font-size:11px;color:#6c757d;" />';
        h += '</div>';

        // Right: Core actions only — secondary stuff in a "More" menu
        h += '<div class="sit-ds-top-bar-right">';

        // Cloud Mode toggle — clean pill switch on top bar
        h += '<label id="ds-cloud-toggle" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin-right:8px;" title="Splunk Cloud Mode — hides REST API buttons, shows Download XML">';
        h += '<input type="checkbox" id="ds-cloud-mode" ' + (cloudMode ? 'checked' : '') + ' style="display:none;" />';
        h += '<div style="position:relative;width:32px;height:18px;border-radius:9px;background:' + (cloudMode ? '#17A2B8' : '#3c444d') + ';transition:background 0.2s ease;">';
        h += '<div style="position:absolute;top:2px;' + (cloudMode ? 'left:16px' : 'left:2px') + ';width:14px;height:14px;border-radius:50%;background:#fff;transition:left 0.2s ease;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>';
        h += '</div>';
        h += '<span style="font-size:10px;font-weight:600;color:' + (cloudMode ? '#17A2B8' : '#6c757d') + ';letter-spacing:0.3px;">CLOUD</span>';
        h += '</label>';

        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-undo" title="Undo" style="padding:5px 7px;">' + svgIcon('undo', 12) + '</button>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-redo" title="Redo" style="padding:5px 7px;">' + svgIcon('redo', 12) + '</button>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-clear" title="Clear" style="padding:5px 7px;color:#DC3545 !important;">&times;</button>';

        if (previewMode) {
            h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-toggle-preview" style="background:#5CC05C !important;padding:5px 10px;font-size:11px;">';
            h += svgIcon('eye', 11) + ' Exit Preview</button>';
        } else {
            h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-toggle-preview" style="padding:5px 10px;font-size:11px;">';
            h += svgIcon('eye', 11) + ' Preview</button>';
        }

        if (!cloudMode) {
            h += '<button class="sit-ds-btn" id="ds-preview" title="Open live in Splunk (creates temp dashboard)" style="padding:5px 12px;font-size:11px;font-weight:600;background:#5CC05C !important;color:#fff !important;border:none;border-radius:6px;">' + svgIcon('external-link', 11) + ' Live</button>';
        }

        // "More" dropdown for secondary actions
        h += '<div style="position:relative;display:inline-block;">';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-more-menu" style="padding:5px 10px;font-size:11px;">More &#9662;</button>';
        h += '<div id="ds-more-dropdown" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#1a1e22;border:1px solid #3c444d;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:1000;min-width:180px;padding:4px;">';
        h += '<button class="ds-more-item" id="ds-import" style="width:100%;text-align:left;background:none;border:none;color:#e0e0e0;padding:8px 12px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:4px;">' + svgIcon('upload', 12) + ' Import Dashboard</button>';
        h += '<button class="ds-more-item" id="ds-export" style="width:100%;text-align:left;background:none;border:none;color:#e0e0e0;padding:8px 12px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:4px;">' + svgIcon('download', 12) + ' Export Code</button>';
        h += '<button class="ds-more-item" id="ds-save-template" style="width:100%;text-align:left;background:none;border:none;color:#e0e0e0;padding:8px 12px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:4px;">' + svgIcon('layout', 12) + ' Save as Template</button>';
        h += '<button class="ds-more-item" id="ds-history" style="width:100%;text-align:left;background:none;border:none;color:#e0e0e0;padding:8px 12px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:4px;">' + svgIcon('clock', 12) + ' Version History</button>';
        h += '</div></div>';

        if (cloudMode) {
            // Cloud mode: Download XML is the primary action
            h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-cloud-download" style="padding:6px 16px;font-size:12px;background:#17A2B8 !important;">';
            h += svgIcon('download', 12) + ' Download XML</button>';
        } else {
            h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-save" style="padding:6px 16px;font-size:12px;">';
            h += svgIcon('check-circle', 12) + ' Save</button>';
        }

        h += '</div>';
        h += '</div>';
        return h;
    }

    // ---------- SIDEBAR ----------

    var sidebarTab = 'components'; // 'components' | 'effects' | 'colors' | 'settings'

    function renderSidebar() {
        var h = '<div class="sit-ds-sidebar">';

        // --- TAB BAR ---
        var tabs = [
            { id: 'components', label: 'Components', icon: '\u25A6' },
            { id: 'effects',    label: 'Effects',    icon: '\u2728' },
            { id: 'colors',     label: 'Colors',     icon: '\uD83C\uDFA8' },
            { id: 'settings',   label: 'Settings',   icon: '\u2699' }
        ];
        // Count active effects for badge
        var effectCount = studio.animations.length + studio.controls.length + studio.kpiEffects.length + studio.dashExtras.length + studio.uiFramework.length;

        h += '<div style="display:flex;border-bottom:2px solid #2b3033;margin-bottom:8px;">';
        tabs.forEach(function(tab) {
            var isActive = sidebarTab === tab.id;
            var badge = '';
            if (tab.id === 'effects' && effectCount > 0) {
                badge = '<span style="background:#FD1875;color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:1px 5px;margin-left:4px;">' + effectCount + '</span>';
            }
            h += '<button class="ds-sidebar-tab" data-tab="' + tab.id + '" style="flex:1;padding:8px 4px;border:none;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:all 0.15s ease;border-bottom:2px solid ' + (isActive ? '#FD1875' : 'transparent') + ';margin-bottom:-2px;' +
                'background:' + (isActive ? 'rgba(253,24,117,0.08)' : 'transparent') + ';color:' + (isActive ? '#fff' : '#6c757d') + ';">' +
                tab.label + badge + '</button>';
        });
        h += '</div>';

        // --- TAB CONTENT ---
        if (sidebarTab === 'components') {
            h += renderSidebarComponents();
        } else if (sidebarTab === 'effects') {
            h += renderSidebarEffects();
        } else if (sidebarTab === 'colors') {
            h += renderSidebarColors();
        } else if (sidebarTab === 'settings') {
            h += renderSidebarSettings();
        }

        h += '</div>';
        return h;
    }

    // --- COMPONENTS TAB ---
    function renderSidebarComponents() {
        var h = '';
        // Search box
        h += '<div style="padding:0 2px 8px;">';
        h += '<input type="text" id="ds-component-search" placeholder="Search components..." style="width:100%;padding:7px 10px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:12px;outline:none;box-sizing:border-box;font-family:inherit;" />';
        h += '</div>';

        paletteGroups.forEach(function(group) {
            h += '<div class="sit-ds-palette-section" data-group-label="' + escAttr(group.label) + '">';
            h += '<div style="font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;padding:0 2px;">' + esc(group.label) + '</div>';
            group.items.forEach(function(item) {
                h += '<div class="sit-ds-palette-item" data-type="' + item.type + '" data-label="' + escAttr(item.label) + '" title="' + escAttr(item.desc || 'Click to add ' + item.label) + '">';
                h += '<div class="sit-ds-palette-icon" style="background:' + item.iconBg + ';color:#fff;font-weight:700;">' + item.icon + '</div>';
                h += '<div style="flex:1;min-width:0;">';
                h += '<div style="font-size:11px;line-height:1.2;">' + esc(item.label) + '</div>';
                if (item.desc) h += '<div style="font-size:8px;color:#4a545e;line-height:1.2;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(item.desc) + '</div>';
                h += '</div>';
                h += '</div>';
            });
            h += '</div>';
        });
        return h;
    }

    // --- EFFECTS TAB ---
    function renderSidebarEffects() {
        var h = '';

        // Mini CSS preview indicators for effects
        var effectPreviews = {
            'panel-entrance-fade': 'opacity:0;animation:ds-prev-fade 2s ease infinite;',
            'panel-entrance-slide': 'transform:translateY(4px);opacity:0;animation:ds-prev-slide 2s ease infinite;',
            'hover-scale-lift': 'animation:ds-prev-scale 2s ease infinite;',
            'hover-glow-border': 'animation:ds-prev-glow 2s ease infinite;',
            'pulse-attention': 'animation:ds-prev-pulse 1.5s ease infinite;',
            'shimmer-loading': 'background:linear-gradient(90deg,#2b3033 25%,#3c444d 50%,#2b3033 75%);background-size:200% 100%;animation:ds-prev-shimmer 1.5s infinite;',
            'confetti-celebration': 'background:#f59e0b;animation:ds-prev-confetti 1s ease infinite;',
            'dark-light-mode': 'animation:ds-prev-toggle 3s step-end infinite;'
        };

        function renderCheckGroup(title, subtitle, color, group, items) {
            h += '<div style="margin-bottom:14px;">';
            h += '<div style="font-size:10px;font-weight:700;color:' + color + ';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;padding:0 2px;">' + title + '</div>';
            if (subtitle) h += '<div style="font-size:9px;color:#4a545e;margin-bottom:6px;padding:0 2px;">' + subtitle + '</div>';
            items.forEach(function(item) {
                var checked = studio[group].indexOf(item.value) > -1;
                var preview = effectPreviews[item.value];
                // Make checked items visually POP — colored left border + tinted background
                // All colors use inline style to survive theme CSS overrides
                if (checked) {
                    h += '<label style="display:flex !important;align-items:flex-start !important;gap:6px !important;font-size:11px !important;padding:5px 6px !important;cursor:pointer !important;border-radius:5px !important;margin-bottom:2px !important;background:' + color + '15 !important;border:1px solid ' + color + '40 !important;border-left:3px solid ' + color + ' !important;color:#fff !important;">';
                } else {
                    h += '<label style="display:flex !important;align-items:flex-start !important;gap:6px !important;font-size:11px !important;padding:5px 6px !important;cursor:pointer !important;border-radius:5px !important;margin-bottom:2px !important;border:1px solid transparent !important;border-left:3px solid transparent !important;color:#6c757d !important;">';
                }
                // Custom checkbox visual (no native input = no focus auto-scroll)
                h += '<span class="ds-enh-check" data-group="' + group + '" data-value="' + item.value + '" data-checked="' + (checked ? '1' : '0') + '" style="display:inline-flex !important;width:14px !important;height:14px !important;flex-shrink:0 !important;margin-top:2px !important;align-items:center !important;justify-content:center !important;background:' + (checked ? color : 'transparent') + ' !important;border:2px solid ' + (checked ? color : '#4a545e') + ' !important;border-radius:3px !important;cursor:pointer !important;transition:all 0.1s ease !important;">';
                if (checked) h += '<svg width="10" height="10" viewBox="0 0 16 16" style="pointer-events:none;"><path d="M13 4L6 11L3 8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                h += '</span>';
                h += '<div style="flex:1 !important;min-width:0 !important;">';
                h += '<div style="display:flex !important;align-items:center !important;gap:5px !important;">';
                h += '<span style="color:' + (checked ? '#fff' : '#6c757d') + ' !important;font-weight:' + (checked ? '600' : '400') + ' !important;">' + esc(item.label) + '</span>';
                if (checked) h += '<span style="font-size:8px !important;color:' + color + ' !important;font-weight:700 !important;background:' + color + '20 !important;padding:1px 4px !important;border-radius:3px !important;">ON</span>';
                // Info button
                if (effectDetails[item.value]) h += '<button class="ds-effect-info" data-effect="' + item.value + '" style="background:none !important;border:none !important;color:#4a545e !important;font-size:12px !important;cursor:pointer !important;padding:0 2px !important;flex-shrink:0 !important;line-height:1 !important;" title="Learn more">&#9432;</button>';
                if (preview) h += '<div style="width:12px !important;height:12px !important;border-radius:2px !important;background:' + color + ' !important;flex-shrink:0 !important;' + preview + '"></div>';
                h += '</div>';
                if (item.desc) {
                    var cloudTag = item.type === 'js' ? '<span style="font-size:7px;color:#F7B500;background:rgba(247,181,0,0.1);padding:1px 4px;border-radius:2px;margin-left:3px;">Classic only</span>' : '<span style="font-size:7px;color:#5CC05C;background:rgba(92,192,92,0.1);padding:1px 4px;border-radius:2px;margin-left:3px;">Cloud safe</span>';
                    h += '<div style="font-size:9px !important;color:' + (checked ? '#9a9a9a' : '#4a545e') + ' !important;line-height:1.3 !important;margin-top:1px !important;">' + esc(item.desc) + cloudTag + '</div>';
                }

                // Inline configuration for specific effects (only when checked)
                if (checked && item.value === 'auto-refresh-countdown') {
                    h += '<div style="margin-top:4px !important;display:flex !important;align-items:center !important;gap:4px !important;">';
                    h += '<label style="font-size:9px !important;color:#6c757d !important;white-space:nowrap !important;">Interval:</label>';
                    h += '<select class="ds-effect-config" data-config="refreshInterval" style="background:#0a0e12 !important;border:1px solid #3c444d !important;border-radius:4px !important;color:#fff !important;font-size:10px !important;padding:2px 4px !important;font-family:inherit !important;">';
                    var refreshVal = studio._refreshInterval || '300';
                    ['30:30 sec', '60:1 min', '120:2 min', '300:5 min', '600:10 min'].forEach(function(opt) {
                        var parts = opt.split(':');
                        h += '<option value="' + parts[0] + '"' + (refreshVal === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
                    });
                    h += '</select>';
                    h += '</div>';
                }

                if (checked && item.value === 'alert-toast-notifications') {
                    h += '<div style="margin-top:4px !important;padding:6px !important;background:rgba(0,0,0,0.2) !important;border-radius:4px !important;font-size:9px !important;">';
                    h += '<div style="color:#f59e0b !important;font-weight:600 !important;margin-bottom:3px !important;">Toast Configuration</div>';
                    h += '<div style="display:flex !important;gap:4px !important;margin-bottom:3px !important;">';
                    h += '<label style="color:#6c757d !important;white-space:nowrap !important;">Trigger:</label>';
                    h += '<select class="ds-effect-config" data-config="toastTrigger" style="flex:1 !important;background:#0a0e12 !important;border:1px solid #3c444d !important;border-radius:3px !important;color:#fff !important;font-size:9px !important;padding:2px !important;font-family:inherit !important;">';
                    var toastTrigger = studio._toastTrigger || 'threshold';
                    ['threshold:KPI crosses threshold', 'change:Any data changes', 'load:On panel load', 'error:On search error'].forEach(function(opt) {
                        var parts = opt.split(':');
                        h += '<option value="' + parts[0] + '"' + (toastTrigger === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
                    });
                    h += '</select>';
                    h += '</div>';
                    h += '<div style="display:flex !important;gap:4px !important;margin-bottom:3px !important;">';
                    h += '<label style="color:#6c757d !important;white-space:nowrap !important;">Style:</label>';
                    h += '<select class="ds-effect-config" data-config="toastStyle" style="flex:1 !important;background:#0a0e12 !important;border:1px solid #3c444d !important;border-radius:3px !important;color:#fff !important;font-size:9px !important;padding:2px !important;font-family:inherit !important;">';
                    var toastStyle = studio._toastStyle || 'info';
                    ['info:Info (blue)', 'success:Success (green)', 'warning:Warning (yellow)', 'error:Error (red)'].forEach(function(opt) {
                        var parts = opt.split(':');
                        h += '<option value="' + parts[0] + '"' + (toastStyle === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
                    });
                    h += '</select>';
                    h += '</div>';
                    h += '<div style="display:flex !important;gap:4px !important;">';
                    h += '<label style="color:#6c757d !important;white-space:nowrap !important;">Position:</label>';
                    h += '<select class="ds-effect-config" data-config="toastPosition" style="flex:1 !important;background:#0a0e12 !important;border:1px solid #3c444d !important;border-radius:3px !important;color:#fff !important;font-size:9px !important;padding:2px !important;font-family:inherit !important;">';
                    var toastPos = studio._toastPosition || 'top-right';
                    ['top-right:Top Right', 'top-left:Top Left', 'bottom-right:Bottom Right', 'bottom-left:Bottom Left'].forEach(function(opt) {
                        var parts = opt.split(':');
                        h += '<option value="' + parts[0] + '"' + (toastPos === parts[0] ? ' selected' : '') + '>' + parts[1] + '</option>';
                    });
                    h += '</select>';
                    h += '</div>';
                    h += '</div>';
                }

                if (checked && item.value === 'confetti-celebration') {
                    h += '<div style="margin-top:4px !important;display:flex !important;align-items:center !important;gap:4px !important;">';
                    h += '<label style="font-size:9px !important;color:#6c757d !important;white-space:nowrap !important;">Threshold:</label>';
                    h += '<input class="ds-effect-config" data-config="confettiThreshold" type="number" value="' + (studio._confettiThreshold || '100') + '" style="width:60px !important;background:#0a0e12 !important;border:1px solid #3c444d !important;border-radius:4px !important;color:#fff !important;font-size:10px !important;padding:2px 4px !important;font-family:inherit !important;" />';
                    h += '<span style="font-size:8px !important;color:#4a545e !important;">Trigger when KPI exceeds this value</span>';
                    h += '</div>';
                }

                h += '</div>';
                h += '</label>';
            });
            h += '</div>';
        }

        h += '<div style="padding:4px 0;">';

        renderCheckGroup('Make It Move', 'How panels appear and respond to interaction', '#FD1875', 'animations', enhancements.animations);
        renderCheckGroup('Interactive Controls', 'Features your users can interact with', '#17A2B8', 'controls', enhancements.controls);
        renderCheckGroup('KPI Enhancements', 'Make single-value panels more impressive', '#7c3aed', 'kpiEffects', enhancements.kpiEffects);
        renderCheckGroup('Special Effects', 'Eye-catching extras', '#f59e0b', 'dashExtras', enhancements.dashExtras);
        // UI Framework removed from Effects tab — confusing for target audience.
        // Power users can still add sit-core.css and sit-toolkit.js manually.

        h += '</div>';
        return h;
    }

    // --- COLORS TAB ---
    function renderSidebarColors() {
        var h = '<div style="padding:4px 0;">';

        // Theme
        h += '<div style="margin-bottom:14px;">';
        h += '<label style="display:block;font-size:10px;font-weight:700;color:#FD1875;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Theme</label>';
        h += '<select class="sit-ds-select" id="ds-theme" style="width:100%;font-size:12px;padding:8px 10px;">';
        themes.forEach(function(t) {
            h += '<option value="' + t.value + '"' + (studio.theme === t.value ? ' selected' : '') + '>' + esc(t.label) + '</option>';
        });
        h += '</select>';
        if (studio.theme) {
            var tc = themeColors[studio.theme];
            if (tc) {
                h += '<div style="display:flex;gap:4px;margin-top:6px;">';
                h += '<div style="width:20px;height:20px;border-radius:4px;background:' + tc.bg + ';border:1px solid #3c444d;" title="Background"></div>';
                h += '<div style="width:20px;height:20px;border-radius:4px;background:' + tc.panel + ';border:1px solid #3c444d;" title="Panel"></div>';
                h += '<div style="width:20px;height:20px;border-radius:4px;background:' + tc.accent + ';border:1px solid #3c444d;" title="Accent"></div>';
                h += '<span style="font-size:10px;color:#6c757d;margin-left:4px;align-self:center;">Color preview</span>';
                h += '</div>';
            }
        }
        h += '</div>';

        // Text Color Preset — only shows colors whitelisted for the selected theme
        var presets = themeTextPresets[studio.theme] || themeTextPresets[''];
        h += '<div style="margin-bottom:14px;">';
        h += '<label style="display:block;font-size:10px;font-weight:700;color:#e8a040;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Text Colors</label>';
        if (presets.length <= 1) {
            h += '<div style="font-size:11px;color:#6c757d;padding:8px 10px;background:#0a0e12;border:1px solid #2b3033;border-radius:6px;">Select a theme to see text color options</div>';
        } else {
            h += '<div style="display:flex;flex-direction:column;gap:6px;">';
            presets.forEach(function(p) {
                var isSelected = studio.textColorPreset === p.value;
                h += '<label class="ds-text-preset" data-preset="' + escAttr(p.value) + '" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:' + (isSelected ? 'rgba(232,160,64,0.1)' : '#0a0e12') + ';border:1px solid ' + (isSelected ? 'rgba(232,160,64,0.3)' : '#2b3033') + ';border-radius:6px;cursor:pointer;transition:all 0.15s ease;">';
                h += '<input type="radio" name="ds-text-color" value="' + escAttr(p.value) + '" ' + (isSelected ? 'checked' : '') + ' style="display:none;" />';
                h += '<div style="width:18px;height:18px;border-radius:50%;background:' + p.swatch + ';border:2px solid ' + (isSelected ? '#e8a040' : '#3c444d') + ';flex-shrink:0;"></div>';
                h += '<div>';
                h += '<div style="font-size:11px;font-weight:' + (isSelected ? '700' : '500') + ';color:' + (isSelected ? '#e8a040' : '#e0e0e0') + ';">' + esc(p.label) + '</div>';
                if (p.title) {
                    h += '<div style="display:flex;gap:3px;margin-top:3px;">';
                    h += '<span style="font-size:8px;color:' + p.title + ';background:rgba(255,255,255,0.05);padding:1px 4px;border-radius:2px;">Title</span>';
                    h += '<span style="font-size:8px;color:' + p.body + ';background:rgba(255,255,255,0.05);padding:1px 4px;border-radius:2px;">Body</span>';
                    h += '<span style="font-size:8px;color:' + p.muted + ';background:rgba(255,255,255,0.05);padding:1px 4px;border-radius:2px;">Muted</span>';
                    h += '</div>';
                }
                h += '</div>';
                h += '</label>';
            });
            h += '</div>';
        }
        h += '</div>';

        // Background (moved here from Settings for visual grouping)
        h += '<div style="margin-bottom:14px;">';
        h += '<label style="display:block;font-size:10px;font-weight:700;color:#17A2B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Background</label>';
        h += '<select class="sit-ds-select" id="ds-background" style="width:100%;font-size:12px;padding:8px 10px;">';
        backgrounds.forEach(function(b) {
            h += '<option value="' + b.value + '"' + (studio.background === b.value ? ' selected' : '') + '>' + esc(b.label) + '</option>';
        });
        h += '</select>';
        h += '</div>';

        h += '</div>';
        return h;
    }

    // --- SETTINGS TAB ---
    function renderSidebarSettings() {
        var h = '<div style="padding:4px 0;">';

        // KPI Style
        h += '<div style="margin-bottom:14px;">';
        h += '<label style="display:block;font-size:10px;font-weight:700;color:#5CC05C;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">KPI Style</label>';
        h += '<select class="sit-ds-select ds-enh-select" data-field="kpiStyle" style="width:100%;font-size:12px;padding:8px 10px;">';
        enhancements.kpiStyles.forEach(function(k) {
            h += '<option value="' + k.value + '"' + (studio.kpiStyle === k.value ? ' selected' : '') + '>' + esc(k.label) + '</option>';
        });
        h += '</select>';
        h += '</div>';

        // Table Style
        h += '<div style="margin-bottom:14px;">';
        h += '<label style="display:block;font-size:10px;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Table Style</label>';
        h += '<select class="sit-ds-select ds-enh-select" data-field="tableStyle" style="width:100%;font-size:12px;padding:8px 10px;">';
        enhancements.tableStyles.forEach(function(t) {
            h += '<option value="' + t.value + '"' + (studio.tableStyle === t.value ? ' selected' : '') + '>' + esc(t.label) + '</option>';
        });
        h += '</select>';
        h += '</div>';

        // Cloud Mode toggle moved to top bar

        // Summary
        var totalComponents = 0;
        studio.pages.forEach(function(pg) { pg.rows.forEach(function(r) { r.columns.forEach(function(c) { if (c.type !== 'empty') totalComponents++; }); }); });
        var totalEffects = studio.animations.length + studio.controls.length + studio.kpiEffects.length + studio.dashExtras.length + studio.uiFramework.length;

        h += '<div style="margin-top:16px;padding:12px;background:#0a0e12;border:1px solid #2b3033;border-radius:8px;">';
        h += '<div style="font-size:10px;font-weight:700;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Dashboard Summary</div>';
        h += '<div style="font-size:12px;color:#e0e0e0;line-height:1.8;">';
        h += '<div>Pages: <strong>' + studio.pages.length + '</strong></div>';
        h += '<div>Rows: <strong>' + activeRows().length + '</strong> (this page)</div>';
        h += '<div>Panels: <strong>' + totalComponents + '</strong> (all pages)</div>';
        h += '<div>Form Inputs: <strong>' + studio.formInputs.length + '</strong></div>';
        h += '<div>Effects: <strong style="color:' + (totalEffects > 0 ? '#FD1875' : '#6c757d') + ';">' + totalEffects + '</strong></div>';
        h += '<div>Theme: <strong>' + (studio.theme ? studio.theme.replace(/-/g, ' ') : 'Default') + '</strong></div>';
        h += '<div>Background: <strong>' + (studio.background ? studio.background.replace(/-/g, ' ') : 'None') + '</strong></div>';
        h += '</div>';
        h += '</div>';

        // ---- VERSION HISTORY (expandable) ----
        var versions = getVersionHistory();
        h += '<div style="margin-top:14px;">';
        h += '<button id="ds-toggle-versions" style="width:100%;display:flex;align-items:center;justify-content:space-between;background:#0a0e12;border:1px solid #2b3033;border-radius:8px;padding:10px 12px;cursor:pointer;color:#e0e0e0;font-family:inherit;font-size:12px;font-weight:600;transition:all 0.15s ease;">';
        h += '<span>Version History</span>';
        h += '<span style="display:flex;align-items:center;gap:6px;">';
        if (versions.length > 0) h += '<span style="background:#FD1875;color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;">' + versions.length + '</span>';
        h += '<span class="ds-version-arrow" style="font-size:10px;color:#6c757d;transition:transform 0.2s ease;">&#9660;</span>';
        h += '</span>';
        h += '</button>';

        h += '<div id="ds-version-list" style="display:none;margin-top:4px;background:#0a0e12;border:1px solid #2b3033;border-radius:8px;overflow:hidden;">';

        if (versions.length === 0) {
            h += '<div style="padding:16px;text-align:center;color:#4a545e;font-size:11px;">';
            h += '<div style="font-size:20px;margin-bottom:4px;opacity:0.3;">&#128196;</div>';
            h += '<div>No saved versions yet</div>';
            h += '<div style="margin-top:4px;font-size:10px;">Versions are saved automatically when you update an existing dashboard using the Save button.</div>';
            h += '</div>';
        } else {
            h += '<div style="padding:8px 10px;border-bottom:1px solid #2b3033;font-size:9px;color:#4a545e;">';
            h += 'Stored in your browser. Works on Splunk Cloud and on-prem.';
            h += '</div>';
            versions.forEach(function(v, i) {
                var date = new Date(v.timestamp);
                var ago = getTimeAgo(date);
                h += '<div class="ds-version-row" style="padding:8px 10px;border-bottom:1px solid #1a1e22;transition:background 0.1s ease;">';
                h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">';
                h += '<div style="flex:1;min-width:0;">';
                h += '<div style="font-size:11px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(v.label) + '</div>';
                h += '<div style="font-size:9px;color:#6c757d;">' + ago + ' &middot; ' + Math.round(v.xml.length / 1024) + ' KB</div>';
                h += '</div>';
                h += '<div style="display:flex;gap:4px;flex-shrink:0;">';
                h += '<button class="ds-ver-load" data-idx="' + i + '" style="background:#17A2B8;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:9px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;" title="Load this version into the editor">Edit</button>';
                h += '<button class="ds-ver-restore" data-idx="' + i + '" style="background:#5CC05C;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:9px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;" title="Restore this version back to Splunk">Restore</button>';
                h += '</div>';
                h += '</div>';
                h += '</div>';
            });
        }

        h += '</div>'; // #ds-version-list
        h += '</div>'; // version history wrapper

        h += '</div>';
        return h;
    }

    function getTimeAgo(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';
        var days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ago';
        return date.toLocaleDateString();
    }

    // ---------- CANVAS ----------

    function renderCanvas() {
        var h = '';

        // Page tab bar (shown when multiple pages exist)
        if (studio.pages.length > 1) {
            h += '<div class="sit-ds-page-tabs" style="display:flex;align-items:center;gap:0;background:#0d1117;border:1px solid #2b3033;border-bottom:none;border-radius:8px 8px 0 0;overflow:hidden;">';
            studio.pages.forEach(function(page, pi) {
                var isActive = pi === studio.activePage;
                h += '<button class="ds-page-tab" data-page="' + pi + '" style="padding:8px 16px;border:none;cursor:pointer;font-size:12px;font-weight:' + (isActive ? '700' : '500') + ';font-family:inherit;transition:all 0.15s ease;' +
                    'background:' + (isActive ? '#1a1e22' : 'transparent') + ';color:' + (isActive ? '#FD1875' : '#6c757d') + ';border-bottom:2px solid ' + (isActive ? '#FD1875' : 'transparent') + ';">' +
                    esc(page.name) + '</button>';
            });
            h += '<button id="ds-add-page" style="padding:6px 12px;border:none;cursor:pointer;font-size:14px;font-weight:700;font-family:inherit;background:transparent;color:#3c444d;transition:color 0.1s;" title="Add new page">+</button>';
            h += '</div>';
        }

        h += '<div class="sit-ds-canvas dashboard-body" id="ds-canvas" style="' + (studio.pages.length > 1 ? 'border-radius:0 0 8px 8px;' : '') + '">';

        // In preview mode, show control button mockups
        if (previewMode && studio.controls.length > 0) {
            var controlMockups = {
                'dark-light-mode': '<button style="background:#2b3033;border:1px solid #3c444d;border-radius:16px;padding:4px 12px;color:#e0e0e0;font-size:10px;cursor:default;display:flex;align-items:center;gap:4px;font-family:inherit;">&#9790; Dark</button>',
                'fullscreen-mode': '<button style="background:#2b3033;border:1px solid #3c444d;border-radius:6px;padding:4px 8px;color:#e0e0e0;font-size:12px;cursor:default;font-family:inherit;">&#x26F6;</button>',
                'panel-collapse-accordion': '<span style="font-size:9px;color:#6c757d;background:#2b3033;padding:3px 8px;border-radius:4px;">Collapsible</span>',
                'panel-zoom-focus': '<span style="font-size:9px;color:#6c757d;background:#2b3033;padding:3px 8px;border-radius:4px;">Zoom</span>',
                'auto-refresh-countdown': '<span style="font-size:9px;color:#5CC05C;background:rgba(92,192,92,0.1);padding:3px 8px;border-radius:4px;">Auto-refresh ' + (function(){ var s=parseInt(studio._refreshInterval||'300'); return s>=60?Math.floor(s/60)+'m':s+'s'; })() + '</span>',
                'keyboard-shortcuts': '<span style="font-size:9px;color:#6c757d;background:#2b3033;padding:3px 8px;border-radius:4px;">&#8984; Shortcuts</span>',
                'right-click-context-menu': '<span style="font-size:9px;color:#6c757d;background:#2b3033;padding:3px 8px;border-radius:4px;">Right-click</span>',
                'filter-chips-tags': '<span style="font-size:9px;color:#17A2B8;background:rgba(23,162,184,0.1);padding:3px 8px;border-radius:12px;">Filter A</span><span style="font-size:9px;color:#FD1875;background:rgba(253,24,117,0.1);padding:3px 8px;border-radius:12px;">Filter B</span>'
            };

            h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,255,255,0.06);border-radius:8px 8px 0 0;flex-wrap:wrap;gap:6px;">';
            h += '<div style="font-size:13px;font-weight:600;color:#e0e0e0;">' + esc(studio.title) + '</div>';
            h += '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">';
            studio.controls.forEach(function(c) {
                if (controlMockups[c]) h += controlMockups[c];
            });
            h += '</div>';
            h += '</div>';
        }

        // Classic XML warning — check if any JS widgets or effects are used
        var hasJsFeatures = false;
        studio.pages.forEach(function(pg) {
            pg.rows.forEach(function(row) {
                row.columns.forEach(function(panel) {
                    if (widgetTypes.indexOf(panel.type) !== -1 && panel.type !== 'traffic-lights') hasJsFeatures = true;
                });
            });
        });
        if (studio.controls.length > 0 || studio.kpiEffects.length > 0 || studio.dashExtras.length > 0) hasJsFeatures = true;
        // Check JS animations
        enhancements.animations.forEach(function(a) {
            if (a.type === 'js' && studio.animations.indexOf(a.value) > -1) hasJsFeatures = true;
        });

        if (hasJsFeatures) {
            h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(247,181,0,0.08);border:1px solid rgba(247,181,0,0.2);border-radius:8px;margin-bottom:6px;font-size:10px;color:#F7B500;">';
            h += '<span style="font-size:12px;">&#9888;</span>';
            h += '<span>Classic Simple XML — JS widgets/effects won\'t work in Dashboard Studio.</span>';
            h += '</div>';
        }

        // Active controls preview bar (edit mode)
        if (!previewMode && studio.controls.length > 0) {
            var ctrlLabels = {
                'dark-light-mode': '&#9790; Dark Mode', 'fullscreen-mode': '&#x26F6; Fullscreen',
                'panel-collapse-accordion': 'Collapsible', 'panel-zoom-focus': 'Zoom',
                'auto-refresh-countdown': 'Auto-refresh', 'keyboard-shortcuts': 'Shortcuts',
                'right-click-context-menu': 'Right-click',
                'user-preferences-persist': 'Preferences', 'drag-resize-panels': 'Resize',
                'filter-chips-tags': 'Filters', 'sidebar-slide-panel': 'Sidebar'
            };
            // Show realistic mockups of what controls will look like on the live dashboard
            var controlMockups = {
                'dark-light-mode': '<button style="background:#2b3033;border:1px solid #3c444d;border-radius:16px;padding:5px 14px;color:#e0e0e0;font-size:11px;cursor:default;display:inline-flex;align-items:center;gap:5px;font-family:inherit;">&#9790; Dark</button>',
                'fullscreen-mode': '<button style="background:#2b3033;border:1px solid #3c444d;border-radius:6px;padding:5px 10px;color:#e0e0e0;font-size:13px;cursor:default;font-family:inherit;">&#x26F6; Fullscreen</button>',
                'panel-collapse-accordion': '<button style="background:#2b3033;border:1px solid #3c444d;border-radius:6px;padding:5px 10px;color:#e0e0e0;font-size:11px;cursor:default;font-family:inherit;">&#8597; Collapse All</button>',
                'auto-refresh-countdown': '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#5CC05C;background:rgba(92,192,92,0.1);border:1px solid rgba(92,192,92,0.2);padding:4px 10px;border-radius:6px;"><span style="display:inline-block;width:14px;height:14px;border:2px solid #5CC05C;border-radius:50%;border-top-color:transparent;"></span> ' + (function(){ var s=parseInt(studio._refreshInterval||'300'); var m=Math.floor(s/60); var sec=s%60; return (m>0?m+':':'0:')+(sec<10?'0':'')+sec; })() + ' refresh</span>',
                'keyboard-shortcuts': '<span style="font-size:10px;color:#6c757d;background:#2b3033;padding:3px 8px;border-radius:4px;border:1px solid #3c444d;">&#8984;K Shortcuts</span>',
                'filter-chips-tags': '<span style="font-size:10px;color:#17A2B8;background:rgba(23,162,184,0.1);padding:4px 10px;border-radius:12px;border:1px solid rgba(23,162,184,0.2);margin-right:2px;">All Sources</span><span style="font-size:10px;color:#FD1875;background:rgba(253,24,117,0.1);padding:4px 10px;border-radius:12px;border:1px solid rgba(253,24,117,0.2);">Errors Only</span>'
            };

            h += '<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(23,162,184,0.15);border-radius:8px;margin-bottom:8px;overflow:hidden;">';
            // Header row with title + control buttons
            h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;flex-wrap:wrap;gap:6px;">';
            h += '<div style="font-size:13px;font-weight:600;color:#e0e0e0;">' + esc(studio.title) + '</div>';
            h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">';
            studio.controls.forEach(function(c) {
                if (controlMockups[c]) h += controlMockups[c];
            });
            h += '</div>';
            h += '</div>';
            // Label
            h += '<div style="padding:4px 16px 6px;font-size:9px;color:#4a545e;border-top:1px solid rgba(255,255,255,0.04);">These controls will appear in the dashboard header when saved. Click <strong style="color:#17A2B8;">Live</strong> to test them.</div>';
            h += '</div>';
        }

        // Form inputs bar (above rows)
        if (studio.formInputs.length > 0) {
            h += '<div class="sit-ds-form-bar" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid #2b3033;border-radius:8px;margin-bottom:8px;align-items:flex-end;">';
            studio.formInputs.forEach(function(inp, fi) {
                h += '<div class="sit-ds-form-input" data-fi="' + fi + '" style="position:relative;min-width:120px;">';
                h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">';
                h += '<label style="font-size:10px;font-weight:600;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.3px;">' + esc(inp.label || 'Input') + '</label>';
                h += '<button class="ds-delete-input" data-fi="' + fi + '" style="background:none;border:none;color:#6c757d;cursor:pointer;font-size:14px;padding:0 2px;line-height:1;" title="Remove">&times;</button>';
                h += '</div>';
                if (inp.type === 'input-time') {
                    h += '<div style="display:flex;gap:4px;">';
                    h += '<div style="flex:1;background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:6px 8px;font-size:11px;color:#a0a0a0;white-space:nowrap;">Last 24 hours</div>';
                    h += '</div>';
                } else if (inp.type === 'input-dropdown') {
                    h += '<div style="background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:6px 8px;font-size:11px;color:#a0a0a0;display:flex;justify-content:space-between;">';
                    h += '<span>Select...</span><span style="color:#6c757d;">&#9662;</span></div>';
                } else if (inp.type === 'input-text') {
                    h += '<div style="background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:6px 8px;font-size:11px;color:#6c757d;">Type to search...</div>';
                } else if (inp.type === 'input-multiselect') {
                    h += '<div style="background:#1f2527;border:1px solid #3c444d;border-radius:4px;padding:6px 8px;font-size:11px;color:#a0a0a0;display:flex;justify-content:space-between;">';
                    h += '<span>Select multiple...</span><span style="color:#6c757d;">&#9662;</span></div>';
                }
                h += '</div>';
            });
            h += '</div>';
        }

        if (activeRows().length === 0 && studio.formInputs.length === 0) {
            h += renderEmptyCanvasWithTemplates();
        } else if (activeRows().length === 0) {
            h += '<div style="text-align:center;padding:20px;color:#6c757d;font-size:12px;">Add rows below to build your layout</div>';
        } else {
            activeRows().forEach(function(row, ri) {
                h += renderRow(row, ri);
            });
        }

        // Add Row button + column picker + templates — edit mode only
        if (previewMode) {
            h += '</div>'; // close canvas
            return h;
        }
        h += '<div id="ds-add-row-area" style="margin-top:8px;padding:8px 0;display:flex;gap:6px;justify-content:center;align-items:center;border-top:1px dashed #2b3033;">';
        h += '<button class="sit-ds-add-row" id="ds-add-row" style="font-size:11px;padding:6px 14px;">' + svgIcon('plus', 12) + ' Row</button>';
        h += '<button class="sit-ds-add-row" id="ds-show-templates" style="border-color:#FD1875;color:#FD1875;font-size:11px;padding:6px 14px;">' + svgIcon('layout', 12) + ' Templates</button>';
        h += '<div id="ds-col-picker" style="display:none;margin-left:8px;">';
        h += '<span style="font-size:10px;color:#4a545e;margin-right:4px;">Columns:</span>';
        for (var c = 1; c <= 4; c++) {
            h += '<button class="sit-ds-btn sit-ds-btn-secondary ds-col-btn" data-cols="' + c + '" style="margin:0 2px;min-width:28px;padding:4px 8px;font-size:11px;">' + c + '</button>';
        }
        h += '</div>';
        h += '</div>';

        h += '</div>';
        return h;
    }

    function renderEmptyCanvasWithTemplates() {
        var h = '<div class="sit-ds-canvas-empty">';
        h += '<div class="sit-ds-canvas-empty-icon">' + svgIcon('layout', 48) + '</div>';
        h += '<div class="sit-ds-canvas-empty-text">Add polish to your Classic Simple XML dashboards</div>';

        // Import CTA — the primary action for the target audience
        h += '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;">';
        h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-empty-import" style="padding:12px 28px;font-size:14px;border-radius:10px;">' + svgIcon('upload', 16) + ' Import Existing Dashboard</button>';
        h += '</div>';
        h += '<div style="font-size:12px;color:#6c757d;margin-bottom:20px;">Already have a dashboard? Import it and add themes, effects, and polish. Your SPL queries stay intact.</div>';

        // Divider
        h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;color:#3c444d;font-size:11px;"><div style="flex:1;border-top:1px solid #2b3033;"></div>or start fresh<div style="flex:1;border-top:1px solid #2b3033;"></div></div>';

        // Guided steps (secondary)
        h += '<div class="sit-ds-guided-steps">';
        h += '<div class="sit-ds-step"><div class="sit-ds-step-num">1</div><div class="sit-ds-step-label">Pick a template below</div></div>';
        h += '<div class="sit-ds-step"><div class="sit-ds-step-num">2</div><div class="sit-ds-step-label">Use <strong>Colors</strong> for theme, text &amp; background</div></div>';
        h += '<div class="sit-ds-step"><div class="sit-ds-step-num">3</div><div class="sit-ds-step-label">Use <strong>Effects</strong> for animations &amp; controls</div></div>';
        h += '<div class="sit-ds-step"><div class="sit-ds-step-num">4</div><div class="sit-ds-step-label">Click <strong>' + (cloudMode ? 'Download XML' : 'Save') + '</strong> when ready</div></div>';
        h += '</div>';

        // Template picker
        h += '<div class="sit-ds-template-picker">';
        dashboardTemplates.forEach(function(tmpl, ti) {
            h += '<div class="sit-ds-template-card" data-template="' + ti + '">';
            h += '<div class="sit-ds-template-preview" style="background:' + tmpl.previewColors.bg + ';">';
            // Mini layout preview
            tmpl.rows.forEach(function(row) {
                h += '<div style="display:flex;gap:2px;margin-bottom:2px;">';
                row.forEach(function(col) {
                    var color = tmpl.previewColors.accent;
                    if (col.type === 'chart') color = '#17A2B8';
                    else if (col.type === 'table') color = '#5CC05C';
                    else if (col.type === 'empty') color = tmpl.previewColors.panel;
                    h += '<div style="flex:1;height:' + (col.type === 'single' ? '10' : '18') + 'px;background:' + color + ';border-radius:2px;opacity:0.7;"></div>';
                });
                h += '</div>';
            });
            h += '</div>';
            h += '<div class="sit-ds-template-name">' + esc(tmpl.name) + '</div>';
            if (tmpl.subtitle) h += '<div style="font-size:9px;color:#6c757d;margin-top:2px;text-align:center;line-height:1.2;max-width:140px;margin-left:auto;margin-right:auto;">' + esc(tmpl.subtitle) + '</div>';
            h += '</div>';
        });

        // Custom templates from localStorage
        var customs = getCustomTemplates();
        if (customs.length > 0) {
            h += '<div style="width:100%;font-size:10px;font-weight:600;color:#FD1875;text-transform:uppercase;letter-spacing:0.5px;margin-top:12px;text-align:center;">Your Saved Templates</div>';
            customs.forEach(function(ct, ci) {
                h += '<div class="sit-ds-template-card ds-custom-tmpl" data-custom="' + ci + '" style="cursor:pointer;">';
                h += '<div class="sit-ds-template-preview" style="background:#1a1e22;display:flex;align-items:center;justify-content:center;">';
                h += '<div style="font-size:20px;opacity:0.4;">&#9733;</div>';
                h += '</div>';
                h += '<div class="sit-ds-template-name">' + esc(ct.name) + '</div>';
                h += '<div style="font-size:9px;color:#6c757d;text-align:center;">' + (ct.theme || 'custom') + '</div>';
                h += '</div>';
            });
        }

        h += '</div>';

        h += '</div>';
        return h;
    }

    function applyTemplate(index) {
        var tmpl = dashboardTemplates[index];
        if (!tmpl) return;
        pushHistory();

        studio.theme = tmpl.theme;
        studio.background = tmpl.background;
        studio.pages[studio.activePage].rows = [];

        tmpl.rows.forEach(function(row) {
            var columns = [];
            row.forEach(function(col) {
                var panel = createPanel(col.type);
                if (col.chartType) panel.chartType = col.chartType;
                columns.push(panel);
            });
            activeRows().push({ columns: columns });
        });

        render();
        updateCanvasTheme();
        showToast('Template applied! Try the Effects tab to add animations and interactivity.', 'success');
    }

    function renderRow(row, ri) {
        var h = '<div class="sit-ds-row dashboard-row" data-row="' + ri + '">';

        if (!previewMode) {
            h += '<div class="sit-ds-row-drag-handle" title="Drag to reorder row" style="cursor:grab;color:#3c444d;font-size:14px;padding:4px 2px;user-select:none;display:flex;align-items:center;">&#x2630;</div>';
        }

        row.columns.forEach(function(panel, ci) {
            var isSelected = !previewMode && selectedPanel && selectedPanel.rowIdx === ri && selectedPanel.colIdx === ci;
            h += '<div class="sit-ds-panel dashboard-cell' + (isSelected ? ' sit-ds-panel-selected' : '') + '" data-row="' + ri + '" data-col="' + ci + '">';
            h += '<div class="dashboard-panel">';

            if (!previewMode) {
                // Panel actions (delete) — edit mode only
                h += '<div class="sit-ds-panel-actions">';
                if (panel.depends || panel.rejects) {
                    h += '<span style="font-size:9px;color:#F7B500;margin-right:4px;" title="Conditional: ' + escAttr(panel.depends ? 'depends=' + panel.depends : '') + (panel.rejects ? ' rejects=' + panel.rejects : '') + '">&#9888;</span>';
                }
                if (panel.hideCondField) {
                    var _opL = {'equals':'=','not_equals':'≠','less_than':'<','greater_than':'>','less_equal':'≤','greater_equal':'≥','contains':'∋','is_empty':'∅'};
                    h += '<span style="font-size:8px;color:#17A2B8;margin-right:4px;background:rgba(23,162,184,0.1);padding:1px 4px;border-radius:3px;" title="Hide when ' + escAttr(panel.hideCondField) + ' ' + escAttr(panel.hideCondOp || '') + ' ' + escAttr(panel.hideCondValue || '') + '">&#128065; ' + esc(panel.hideCondField) + ' ' + (_opL[panel.hideCondOp] || '') + ' ' + esc(panel.hideCondValue || '') + '</span>';
                }
                h += '<button class="sit-ds-panel-action-btn ds-delete-panel" data-row="' + ri + '" data-col="' + ci + '" title="Remove panel">&times;</button>';
                h += '</div>';
            }

            // Panel header
            h += '<div class="sit-ds-panel-header panel-head">';
            if (!previewMode) {
                h += '<span class="sit-ds-drag-handle" title="Drag to reorder" style="cursor:grab;color:#4a545e;font-size:16px;margin-right:6px;user-select:none;">&#x2630;</span>';
                h += '<input class="sit-ds-panel-title-input" data-row="' + ri + '" data-col="' + ci + '" value="' + escAttr(panel.title) + '" placeholder="Panel title" />';
                if (panel.type === 'empty') {
                    h += '<span class="sit-ds-panel-type" style="background:rgba(108,117,125,0.12);color:#4a545e;font-style:italic;">EMPTY</span>';
                } else {
                    h += '<span class="sit-ds-panel-type">' + (panelTypeLabels[panel.type] || panel.type.toUpperCase()) + '</span>';
                }
            } else {
                // Preview mode — clean title only
                if (panel.title) {
                    h += '<h3 style="margin:0;font-size:14px;font-weight:600;padding:8px 12px;">' + esc(panel.title) + '</h3>';
                }
            }
            h += '</div>';

            // Panel body
            if (previewMode) {
                // PREVIEW MODE — render ACTUAL widget HTML that the JS files can initialize
                var liveWidgetHtml = getLiveWidgetHTML(panel);
                if (panel.type === 'empty') {
                    h += '<div class="panel-body" style="min-height:60px;display:flex;align-items:center;justify-content:center;color:#3c444d;font-style:italic;font-size:12px;">Empty Panel</div>';
                } else if (liveWidgetHtml) {
                    h += '<div class="panel-body" style="padding:8px;">' + liveWidgetHtml + '</div>';
                } else if (panel.type === 'html') {
                    h += '<div class="panel-body" style="padding:12px;">' + (panel.htmlContent ? panel.htmlContent : '<p style="color:#6c757d;">Custom HTML content</p>') + '</div>';
                } else if (panel.type === 'spacer') {
                    h += '<div class="panel-body" style="height:40px;"></div>';
                } else {
                    // Search-based panels — show the visual mockup
                    h += '<div class="panel-body">' + renderPanelTypePreview(panel.type, panel.chartType) + '</div>';
                }
            } else {
            // EDIT MODE — full builder chrome
            if (panel.type === 'empty') {
                h += '<div class="sit-ds-panel-body" style="text-align:center;padding:12px 8px;">';
                h += '<div style="font-size:10px;color:#6c757d;margin-bottom:6px;">Quick add:</div>';
                h += '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">';
                var quickItems = [
                    { type: 'single', label: 'KPI', bg: '#FD1875' },
                    { type: 'chart', label: 'Chart', bg: '#17A2B8' },
                    { type: 'table', label: 'Table', bg: '#5CC05C' },
                    { type: 'gauge-speed', label: 'Gauge', bg: '#64b4ff' },
                    { type: 'clock', label: 'Clock', bg: '#818cf8' },
                    { type: 'html', label: 'HTML', bg: '#d4af37' }
                ];
                quickItems.forEach(function(qi) {
                    h += '<button class="ds-quick-add" data-type="' + qi.type + '" data-row="' + ri + '" data-col="' + ci + '" style="background:' + qi.bg + ';color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:9px;font-weight:600;cursor:pointer;font-family:inherit;opacity:0.8;transition:opacity 0.1s;">' + qi.label + '</button>';
                });
                h += '</div>';
                h += '<div style="font-size:9px;color:#4a545e;margin-top:6px;">or use sidebar / drag here</div>';
                h += '</div>';
            } else if (widgetTypes.indexOf(panel.type) !== -1 && searchTypes.indexOf(panel.type) !== -1) {
                // Search-based widgets (kpi-counter, kpi-flip, sparkline) — show icon + search input
                h += renderWidgetPreview(panel);
                h += '<div style="margin-bottom:4px;">';
                h += '<textarea class="sit-ds-search-input ds-search-input" data-row="' + ri + '" data-col="' + ci + '" placeholder="index=_internal | stats count" rows="2">' + esc(panel.search || '') + '</textarea>';
                h += '</div>';
            } else if (widgetTypes.indexOf(panel.type) !== -1) {
                h += renderWidgetPreview(panel);
            } else if (panel.type === 'html') {
                h += '<div style="margin-bottom:6px;">';
                h += '<textarea class="sit-ds-search-input ds-html-input" data-row="' + ri + '" data-col="' + ci + '" placeholder="Enter HTML content..." rows="3">' + esc(panel.htmlContent || '') + '</textarea>';
                h += '</div>';
            } else if (panel.type === 'spacer') {
                h += '<div class="sit-ds-panel-body" style="min-height:30px;color:#3c444d;font-style:italic;">Spacer</div>';
            } else {
                // Search-based panel
                if (panel.type === 'chart') {
                    h += '<div style="margin-bottom:6px;">';
                    h += '<select class="sit-ds-select ds-chart-type" data-row="' + ri + '" data-col="' + ci + '" style="width:100%;padding:5px 8px;font-size:11px;">';
                    chartTypes.forEach(function(ct) {
                        h += '<option value="' + ct + '"' + (panel.chartType === ct ? ' selected' : '') + '>' + ct.charAt(0).toUpperCase() + ct.slice(1) + '</option>';
                    });
                    h += '</select>';
                    h += '</div>';
                }
                // Visual preview when no search query
                h += renderPanelTypePreview(panel.type, panel.chartType);
                if (!panel.search) {
                    h += '<div style="font-size:9px;color:#F7B500;text-align:center;padding:2px 0;opacity:0.8;">&#9660; Add your SPL query below to power this panel</div>';
                }
                h += '<div style="margin-bottom:4px;">';
                h += '<textarea class="sit-ds-search-input ds-search-input" data-row="' + ri + '" data-col="' + ci + '" placeholder="index=_internal | stats count by sourcetype" rows="2">' + esc(panel.search || '') + '</textarea>';
                h += '</div>';
            }
            } // end edit mode else

            h += '</div>'; // .dashboard-panel
            h += '</div>'; // .sit-ds-panel / .dashboard-cell
        });

        // Add empty panel slot button (if row has room) — edit mode only
        if (!previewMode && row.columns.length < MAX_COLS) {
            h += '<div class="sit-ds-panel-add ds-add-panel-to-row" data-row="' + ri + '" style="flex:0 0 60px;min-height:80px;border:2px dashed #3c444d;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;color:#6c757d;font-size:24px;" title="Add empty panel to this row">';
            h += '+';
            h += '</div>';
        }

        // Row delete button (appears on right side) — edit mode only
        if (!previewMode) {
            h += '<div class="sit-ds-row-controls">';
            h += '<button class="sit-ds-panel-action-btn ds-delete-row" data-row="' + ri + '" title="Delete row">&times;</button>';
            h += '</div>';
        }

        h += '</div>'; // .sit-ds-row
        return h;
    }

    function renderWidgetPreview(panel) {
        var mockups = {
            'clock': '<div style="text-align:center;padding:10px 6px;font-family:monospace;">' +
                '<div style="font-size:8px;color:#6c757d;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">UTC-5 Eastern</div>' +
                '<div style="font-size:28px;font-weight:700;color:#64b4ff;letter-spacing:2px;">14:32</div>' +
                '<div style="font-size:10px;color:#4a545e;margin-top:2px;">Wednesday</div></div>',
            'countdown': '<div style="text-align:center;padding:8px 4px;">' +
                '<div style="font-size:8px;color:#ff6ec7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Time Remaining</div>' +
                '<div style="display:flex;justify-content:center;gap:4px;">' +
                '<div style="background:#1a1b1e;border-radius:4px;padding:4px 6px;min-width:28px;text-align:center;border:1px solid #2b3033;">' +
                '<div style="font-size:16px;font-weight:700;color:#fff;">02</div><div style="font-size:7px;color:#6c757d;">DAYS</div></div>' +
                '<div style="background:#1a1b1e;border-radius:4px;padding:4px 6px;min-width:28px;text-align:center;border:1px solid #2b3033;">' +
                '<div style="font-size:16px;font-weight:700;color:#fff;">14</div><div style="font-size:7px;color:#6c757d;">HRS</div></div>' +
                '<div style="background:#1a1b1e;border-radius:4px;padding:4px 6px;min-width:28px;text-align:center;border:1px solid #2b3033;">' +
                '<div style="font-size:16px;font-weight:700;color:#fff;">37</div><div style="font-size:7px;color:#6c757d;">MIN</div></div>' +
                '</div></div>',
            'gauge-speed': '<div style="text-align:center;padding:6px;">' +
                '<svg style="width:100%;max-width:120px;height:auto;" viewBox="0 0 100 60"><path d="M10,55 A45,45 0 0,1 90,55" fill="none" stroke="#2b3033" stroke-width="6" stroke-linecap="round"/>' +
                '<path d="M10,55 A45,45 0 0,1 72,18" fill="none" stroke="#FD1875" stroke-width="6" stroke-linecap="round"/>' +
                '<line x1="50" y1="52" x2="65" y2="25" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
                '<circle cx="50" cy="52" r="3" fill="#fff"/></svg>' +
                '<div style="font-size:14px;font-weight:700;color:#FD1875;margin-top:-2px;">72%</div></div>',
            'gauge-liquid': '<div style="text-align:center;padding:6px;">' +
                '<svg style="width:100%;max-width:80px;height:auto;" viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="none" stroke="#2b3033" stroke-width="2"/>' +
                '<clipPath id="lq"><circle cx="30" cy="30" r="26"/></clipPath>' +
                '<rect x="0" y="22" width="60" height="40" fill="rgba(0,255,255,0.15)" clip-path="url(#lq)"/>' +
                '<path d="M0,24 Q15,20 30,24 T60,24 V60 H0 Z" fill="rgba(0,255,255,0.25)" clip-path="url(#lq)"/></svg>' +
                '<div style="font-size:12px;font-weight:700;color:#00ffff;margin-top:2px;">65%</div></div>',
            'traffic-lights': '<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 6px;">' +
                '<div style="text-align:center;"><div style="width:18px;height:18px;border-radius:50%;background:#5CC05C;box-shadow:0 0 8px rgba(92,192,92,0.6);margin:0 auto 3px;"></div><div style="font-size:7px;color:#6c757d;">API</div></div>' +
                '<div style="text-align:center;"><div style="width:18px;height:18px;border-radius:50%;background:#F7B500;box-shadow:0 0 8px rgba(247,181,0,0.6);margin:0 auto 3px;"></div><div style="font-size:7px;color:#6c757d;">DB</div></div>' +
                '<div style="text-align:center;"><div style="width:18px;height:18px;border-radius:50%;background:#5CC05C;box-shadow:0 0 8px rgba(92,192,92,0.6);margin:0 auto 3px;"></div><div style="font-size:7px;color:#6c757d;">Web</div></div></div>',
            'qr-code': '<div style="text-align:center;padding:8px;">' +
                '<div style="display:inline-grid;grid-template-columns:repeat(7,5px);gap:1px;">' +
                '<div style="background:#fff;width:5px;height:5px;"></div><div style="background:#fff;width:5px;height:5px;"></div><div style="background:#fff;width:5px;height:5px;"></div><div style="background:transparent;"></div><div style="background:#fff;width:5px;height:5px;"></div><div style="background:transparent;"></div><div style="background:#fff;width:5px;height:5px;"></div>' +
                '<div style="background:#fff;"></div><div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:#fff;"></div>' +
                '<div style="background:#fff;"></div><div style="background:#fff;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div>' +
                '<div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div><div style="background:#fff;"></div><div style="background:transparent;"></div>' +
                '</div><div style="font-size:8px;color:#6c757d;margin-top:4px;">Scan Me</div></div>',
            'team-board': '<div style="padding:6px;">' +
                '<div style="display:flex;gap:4px;margin-bottom:4px;">' +
                '<div style="flex:1;background:#1a1b1e;border-radius:4px;padding:5px;border:1px solid #2b3033;display:flex;align-items:center;gap:4px;">' +
                '<div style="width:16px;height:16px;border-radius:50%;background:#5CC05C;flex-shrink:0;font-size:8px;color:#fff;display:flex;align-items:center;justify-content:center;">A</div>' +
                '<div><div style="font-size:8px;font-weight:600;color:#e0e0e0;">Alice</div><div style="font-size:7px;color:#5CC05C;">Online</div></div></div>' +
                '<div style="flex:1;background:#1a1b1e;border-radius:4px;padding:5px;border:1px solid #2b3033;display:flex;align-items:center;gap:4px;">' +
                '<div style="width:16px;height:16px;border-radius:50%;background:#F7B500;flex-shrink:0;font-size:8px;color:#fff;display:flex;align-items:center;justify-content:center;">B</div>' +
                '<div><div style="font-size:8px;font-weight:600;color:#e0e0e0;">Bob</div><div style="font-size:7px;color:#F7B500;">Busy</div></div></div>' +
                '</div></div>',
            'weather': '<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;background:linear-gradient(180deg,rgba(26,58,92,0.3),transparent);border-radius:6px;">' +
                '<div style="font-size:28px;">&#9728;</div>' +
                '<div><div style="font-size:20px;font-weight:700;color:#fff;">72&deg;F</div>' +
                '<div style="font-size:8px;color:rgba(255,255,255,0.6);">Partly Cloudy</div></div></div>',
            'kpi-progress': '<div style="text-align:center;padding:6px;">' +
                '<svg style="width:100%;max-width:80px;height:auto;" viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" fill="none" stroke="#2b3033" stroke-width="4"/>' +
                '<circle cx="28" cy="28" r="24" fill="none" stroke="#7c3aed" stroke-width="4" stroke-dasharray="113 151" stroke-dashoffset="-37.7" stroke-linecap="round" transform="rotate(-90 28 28)"/>' +
                '<text x="28" y="31" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">75%</text></svg></div>',
            'kpi-counter': '<div style="text-align:center;padding:10px 6px;">' +
                '<div style="font-size:8px;color:#6c757d;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Total Events</div>' +
                '<div style="font-size:28px;font-weight:700;color:#06b6d4;letter-spacing:-0.5px;">48,291</div>' +
                '<div style="font-size:9px;color:#5CC05C;margin-top:2px;">&#9650; 8.4% from yesterday</div></div>',
            'kpi-flip': '<div style="text-align:center;padding:8px;perspective:200px;">' +
                '<div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:8px;padding:10px;border:1px solid #475569;">' +
                '<div style="font-size:20px;font-weight:700;color:#fff;">99.9%</div>' +
                '<div style="font-size:8px;color:#94a3b8;margin-top:2px;">Uptime (hover to flip)</div></div></div>',
            'sparkline': '<div style="text-align:center;padding:8px 6px;">' +
                '<div style="font-size:22px;font-weight:700;color:#14b8a6;">3,847</div>' +
                '<svg style="width:100%;max-width:120px;height:auto;margin-top:2px;" viewBox="0 0 80 20"><polyline points="0,15 10,12 20,14 30,8 40,10 50,5 60,7 70,3 80,6" fill="none" stroke="#14b8a6" stroke-width="1.5"/>' +
                '<polygon points="0,15 10,12 20,14 30,8 40,10 50,5 60,7 70,3 80,6 80,20 0,20" fill="rgba(20,184,166,0.15)"/></svg>' +
                '<div style="font-size:8px;color:#6c757d;">Requests / min</div></div>',
            'network-map': '<div style="padding:8px;position:relative;min-height:60px;">' +
                '<svg style="width:100%;max-height:100px;height:auto;" viewBox="0 0 120 60">' +
                '<line x1="20" y1="15" x2="60" y2="30" stroke="#10b981" stroke-width="1" opacity="0.4"/>' +
                '<line x1="60" y1="30" x2="100" y2="15" stroke="#10b981" stroke-width="1" opacity="0.4"/>' +
                '<line x1="60" y1="30" x2="40" y2="50" stroke="#10b981" stroke-width="1" opacity="0.4"/>' +
                '<line x1="60" y1="30" x2="90" y2="50" stroke="#10b981" stroke-width="1" opacity="0.4"/>' +
                '<circle cx="20" cy="15" r="6" fill="#10b981" opacity="0.8"/><text x="20" y="18" text-anchor="middle" fill="#fff" font-size="7">S</text>' +
                '<circle cx="60" cy="30" r="8" fill="#3b82f6" opacity="0.8"/><text x="60" y="33" text-anchor="middle" fill="#fff" font-size="7">R</text>' +
                '<circle cx="100" cy="15" r="6" fill="#10b981" opacity="0.8"/><text x="100" y="18" text-anchor="middle" fill="#fff" font-size="7">D</text>' +
                '<circle cx="40" cy="50" r="5" fill="#f59e0b" opacity="0.8"/><text x="40" y="53" text-anchor="middle" fill="#fff" font-size="6">W</text>' +
                '<circle cx="90" cy="50" r="5" fill="#f59e0b" opacity="0.8"/><text x="90" y="53" text-anchor="middle" fill="#fff" font-size="6">A</text>' +
                '</svg></div>',
            'globe': '<div style="text-align:center;padding:6px;">' +
                '<svg style="width:100%;max-width:90px;height:auto;" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.3"/>' +
                '<ellipse cx="32" cy="32" rx="14" ry="28" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.2"/>' +
                '<line x1="4" y1="22" x2="60" y2="22" stroke="#3b82f6" stroke-width="0.5" opacity="0.2"/>' +
                '<line x1="4" y1="42" x2="60" y2="42" stroke="#3b82f6" stroke-width="0.5" opacity="0.2"/>' +
                '<circle cx="22" cy="20" r="3" fill="#FD1875" opacity="0.8"/><circle cx="42" cy="35" r="3" fill="#5CC05C" opacity="0.8"/>' +
                '<circle cx="28" cy="45" r="2" fill="#F7B500" opacity="0.8"/></svg></div>',
            'heatmap': '<div style="padding:6px;text-align:center;">' +
                '<div style="display:inline-grid;grid-template-columns:repeat(12,8px);gap:2px;">' +
                (function() {
                    var cells = '';
                    var vals = [0,1,2,0,1,3,2,1,0,2,3,1, 1,2,3,1,0,2,3,2,1,3,2,0, 0,1,1,2,3,3,2,1,2,1,0,1];
                    var colors = ['rgba(34,197,94,0.1)','rgba(34,197,94,0.3)','rgba(34,197,94,0.5)','rgba(34,197,94,0.8)'];
                    for (var i = 0; i < 36; i++) cells += '<div style="width:8px;height:8px;border-radius:1px;background:' + colors[vals[i]] + ';"></div>';
                    return cells;
                })() +
                '</div><div style="font-size:7px;color:#6c757d;margin-top:3px;">Activity Heatmap</div></div>',
            'kanban': '<div style="display:flex;gap:3px;padding:6px;">' +
                '<div style="flex:1;background:#1a1b1e;border-radius:4px;padding:4px;border-top:2px solid #3b82f6;">' +
                '<div style="font-size:7px;font-weight:600;color:#6c757d;margin-bottom:3px;">TO DO</div>' +
                '<div style="background:#222326;border-radius:2px;padding:3px;margin-bottom:2px;font-size:7px;color:#e0e0e0;">Task A</div>' +
                '<div style="background:#222326;border-radius:2px;padding:3px;font-size:7px;color:#e0e0e0;">Task B</div></div>' +
                '<div style="flex:1;background:#1a1b1e;border-radius:4px;padding:4px;border-top:2px solid #f59e0b;">' +
                '<div style="font-size:7px;font-weight:600;color:#6c757d;margin-bottom:3px;">IN PROGRESS</div>' +
                '<div style="background:#222326;border-radius:2px;padding:3px;font-size:7px;color:#e0e0e0;">Task C</div></div>' +
                '<div style="flex:1;background:#1a1b1e;border-radius:4px;padding:4px;border-top:2px solid #5CC05C;">' +
                '<div style="font-size:7px;font-weight:600;color:#6c757d;margin-bottom:3px;">DONE</div>' +
                '<div style="background:#222326;border-radius:2px;padding:3px;font-size:7px;color:#e0e0e0;">Task D</div></div></div>',
            'org-chart': '<div style="text-align:center;padding:6px;">' +
                '<div style="display:inline-block;background:#14b8a6;border-radius:4px;padding:3px 8px;font-size:8px;color:#fff;font-weight:600;">CEO</div>' +
                '<div style="width:1px;height:8px;background:#3c444d;margin:0 auto;"></div>' +
                '<div style="display:flex;justify-content:center;gap:12px;">' +
                '<div><div style="width:1px;height:8px;background:#3c444d;margin:0 auto;"></div><div style="background:#3b82f6;border-radius:3px;padding:2px 6px;font-size:7px;color:#fff;">VP Eng</div></div>' +
                '<div><div style="width:1px;height:8px;background:#3c444d;margin:0 auto;"></div><div style="background:#3b82f6;border-radius:3px;padding:2px 6px;font-size:7px;color:#fff;">VP Ops</div></div>' +
                '</div></div>',
            'terminal': '<div style="background:#0a0a0a;border-radius:4px;padding:6px 8px;font-family:monospace;font-size:8px;line-height:1.5;min-height:50px;border:1px solid #1a1a1a;">' +
                '<div style="color:#6c757d;">$ tail -f /var/log/syslog</div>' +
                '<div style="color:#00ff41;">2024-01-15 14:32:01 INFO Service started</div>' +
                '<div style="color:#00ff41;">2024-01-15 14:32:05 INFO Connected to DB</div>' +
                '<div style="color:#F7B500;">2024-01-15 14:32:08 WARN High latency</div>' +
                '<div style="color:#00ff41;opacity:0.6;">_</div></div>',
            'timeline': '<div style="padding:6px 8px;">' +
                '<div style="font-size:7px;color:#6c757d;margin-bottom:4px;">Project Timeline</div>' +
                '<div style="margin-bottom:3px;"><div style="font-size:7px;color:#e0e0e0;margin-bottom:1px;">Design</div><div style="height:8px;background:linear-gradient(90deg,#a855f7,#7c3aed);border-radius:2px;width:60%;"></div></div>' +
                '<div style="margin-bottom:3px;"><div style="font-size:7px;color:#e0e0e0;margin-bottom:1px;">Dev</div><div style="height:8px;background:linear-gradient(90deg,#3b82f6,#2563eb);border-radius:2px;width:80%;margin-left:15%;"></div></div>' +
                '<div><div style="font-size:7px;color:#e0e0e0;margin-bottom:1px;">QA</div><div style="height:8px;background:linear-gradient(90deg,#10b981,#059669);border-radius:2px;width:40%;margin-left:55%;"></div></div></div>'
        };

        var html = mockups[panel.type];
        if (html) return '<div class="sit-ds-panel-body" style="min-height:50px;">' + html + '</div>';

        // Fallback for unknown widget types
        return '<div class="sit-ds-panel-body" style="flex-direction:column;gap:4px;min-height:50px;">' +
            '<span style="font-size:20px;opacity:0.5;">?</span>' +
            '<span style="font-size:10px;color:#a0a0a0;">' + esc(panel.type) + '</span></div>';
    }

    function renderPanelTypePreview(type, chartType) {
        var h = '<div class="sit-ds-panel-preview">';
        if (type === 'single' || type === 'kpi-counter' || type === 'kpi-flip' || type === 'sparkline') {
            h += '<div style="text-align:center;padding:10px 6px;">';
            h += '<div style="font-size:8px;color:#6c757d;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Events</div>';
            h += '<div style="font-size:28px;font-weight:700;color:#FD1875;letter-spacing:-0.5px;">1,247</div>';
            h += '<div style="font-size:9px;color:#5CC05C;margin-top:2px;">&#9650; 12.3%</div>';
            h += '</div>';
        } else if (type === 'chart') {
            h += '<div style="padding:4px;">';
            h += '<svg style="width:100%;max-height:120px;" viewBox="0 0 140 56" preserveAspectRatio="xMidYMid meet">';
            if (chartType === 'pie') {
                h += '<circle cx="70" cy="28" r="22" fill="none" stroke="#17A2B8" stroke-width="8" stroke-dasharray="55 83" stroke-dashoffset="0" opacity="0.8"/>';
                h += '<circle cx="70" cy="28" r="22" fill="none" stroke="#FD1875" stroke-width="8" stroke-dasharray="35 103" stroke-dashoffset="-55" opacity="0.8"/>';
                h += '<circle cx="70" cy="28" r="22" fill="none" stroke="#5CC05C" stroke-width="8" stroke-dasharray="20 118" stroke-dashoffset="-90" opacity="0.8"/>';
                h += '<circle cx="70" cy="28" r="22" fill="none" stroke="#F7B500" stroke-width="8" stroke-dasharray="10 128" stroke-dashoffset="-110" opacity="0.8"/>';
                h += '<text x="70" y="26" text-anchor="middle" fill="#fff" font-size="8" opacity="0.6">40%</text>';
                h += '<text x="70" y="34" text-anchor="middle" fill="#6c757d" font-size="6">Events</text>';
            } else if (chartType === 'bar' || chartType === 'column') {
                var barHeights = [28,42,35,50,38,45,30,48,32,44];
                for (var b = 0; b < barHeights.length; b++) {
                    h += '<rect x="' + (b * 14 + 2) + '" y="' + (56 - barHeights[b]) + '" width="10" height="' + barHeights[b] + '" fill="#17A2B8" rx="1" opacity="0.7"/>';
                }
            } else {
                // line / area
                h += '<line x1="0" y1="52" x2="140" y2="52" stroke="#2b3033" stroke-width="0.5"/>';
                for (var g = 0; g < 5; g++) { h += '<line x1="0" y1="' + (g * 12 + 4) + '" x2="140" y2="' + (g * 12 + 4) + '" stroke="#2b3033" stroke-width="0.3"/>'; }
                h += '<polyline points="0,45 14,38 28,42 42,28 56,32 70,18 84,22 98,14 112,18 126,10 140,16" fill="none" stroke="#17A2B8" stroke-width="2"/>';
                if (chartType === 'area') {
                    h += '<polygon points="0,45 14,38 28,42 42,28 56,32 70,18 84,22 98,14 112,18 126,10 140,16 140,56 0,56" fill="url(#areaGrad)" opacity="0.3"/>';
                    h += '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#17A2B8"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>';
                }
                h += '<polyline points="0,40 20,35 40,38 60,24 80,28 100,16 120,22 140,20" fill="none" stroke="#FD1875" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.5"/>';
            }
            h += '</svg></div>';
        } else if (type === 'table') {
            var headers = ['Source', 'Count', 'Status'];
            var rows = [['web_access.log', '12,847', '<span style="color:#5CC05C;">&#9679;</span> OK'], ['error.log', '342', '<span style="color:#DC3545;">&#9679;</span> Error'], ['auth.log', '1,205', '<span style="color:#5CC05C;">&#9679;</span> OK']];
            h += '<div style="padding:2px 4px;font-size:8px;">';
            h += '<div style="display:flex;gap:4px;padding:3px 4px;background:rgba(253,24,117,0.1);border-radius:2px;margin-bottom:1px;font-weight:600;color:#a0a0a0;">';
            headers.forEach(function(hdr) { h += '<div style="flex:1;">' + hdr + '</div>'; });
            h += '</div>';
            rows.forEach(function(row, i) {
                h += '<div style="display:flex;gap:4px;padding:3px 4px;border-radius:2px;color:#e0e0e0;' + (i % 2 === 0 ? 'background:rgba(255,255,255,0.02);' : '') + '">';
                row.forEach(function(cell) { h += '<div style="flex:1;">' + cell + '</div>'; });
                h += '</div>';
            });
            h += '</div>';
        } else if (type === 'map') {
            h += '<div style="padding:4px;position:relative;min-height:60px;background:rgba(26,58,92,0.2);border-radius:4px;">';
            h += '<svg style="width:100%;max-height:120px;" viewBox="0 0 140 56">';
            // Simplified continent shapes
            h += '<path d="M30,15 Q35,12 42,14 L48,18 Q45,25 40,28 L32,24 Z" fill="#1a365d" opacity="0.4"/>';
            h += '<path d="M65,20 Q72,16 80,18 L85,25 Q82,32 75,34 L68,30 Z" fill="#1a365d" opacity="0.4"/>';
            h += '<path d="M95,22 Q100,18 108,20 L112,28 Q108,35 100,36 L96,30 Z" fill="#1a365d" opacity="0.4"/>';
            // Data points
            h += '<circle cx="38" cy="20" r="3" fill="#FD1875" opacity="0.8"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle>';
            h += '<circle cx="75" cy="25" r="4" fill="#17A2B8" opacity="0.8"><animate attributeName="r" values="4;6;4" dur="2.5s" repeatCount="indefinite"/></circle>';
            h += '<circle cx="105" cy="26" r="3" fill="#5CC05C" opacity="0.8"><animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite"/></circle>';
            h += '</svg></div>';
        }
        h += '</div>';
        return h;
    }

    // ========================================
    // Event Binding
    // ========================================

    // Theme preview colors
    var themeColors = {
        '':                        { bg: '#1a1e22', panel: '#222629', text: '#e0e0e0', border: '#3c444d', accent: '#FD1875' },
        'soc-command-center':      { bg: '#0a0a0a', panel: '#111111', text: '#e0e0e0', border: 'rgba(255,60,30,0.3)', accent: '#ff3c1e' },
        'executive-boardroom':     { bg: '#fafafa', panel: '#ffffff', text: '#2c2c2c', border: '#e2e8f0', accent: '#1a365d' },
        'cyberpunk-neon':          { bg: '#0a0a1a', panel: '#0f0f2a', text: '#e0e0ff', border: 'rgba(0,255,255,0.3)', accent: '#00ffff' },
        'retro-terminal':          { bg: '#0a0a0a', panel: '#0d0d0d', text: '#00ff00', border: 'rgba(0,255,0,0.2)', accent: '#00ff00' },
        'glass-dashboard':         { bg: '#1a1a2e', panel: 'rgba(255,255,255,0.05)', text: '#ffffff', border: 'rgba(255,255,255,0.1)', accent: '#7c3aed' },
        'corporate-modern':        { bg: '#f5f7fa', panel: '#ffffff', text: '#1a202c', border: '#e2e8f0', accent: '#3182ce' },
        'dark-mode-pro':           { bg: '#1a1b1e', panel: '#222326', text: '#e4e4e7', border: '#2a2b2e', accent: '#818cf8' },
        'gradient-luxury':         { bg: '#1a1a2e', panel: '#1e1428', text: '#f0e6d3', border: 'rgba(212,175,55,0.2)', accent: '#d4af37' },
        'newspaper-editorial':     { bg: '#f8f5f0', panel: '#ffffff', text: '#2c2c2c', border: '#e8e4de', accent: '#c41e3a' },
        'synthwave-sunset':        { bg: '#1a0533', panel: '#2b1055', text: '#f0d0ff', border: 'rgba(255,110,199,0.2)', accent: '#ff6ec7' },
        'arctic-frost':            { bg: '#0a1628', panel: '#0f1d32', text: '#d0e8ff', border: 'rgba(100,180,255,0.2)', accent: '#64b4ff' },
        'splunk-innovator-signature': { bg: '#111215', panel: '#1a1b1e', text: '#ffffff', border: 'rgba(253,24,117,0.2)', accent: '#FD1875' }
    };

    var bgPreviewColors = {
        '': null,
        'animated-mesh-gradient': { bg: 'linear-gradient(45deg, #0a0a2e, #1a0a3e, #0a2a3e, #0a0a2e)', size: '400% 400%', anim: 'sit-ds-bg-mesh 40s ease infinite' },
        'particle-network': { bg: 'radial-gradient(circle at 30% 40%, rgba(253,24,117,0.2), transparent 50%), radial-gradient(circle at 70% 60%, rgba(23,162,184,0.2), transparent 50%), #0a0e17' },
        'matrix-data-rain': { bg: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,255,65,0.03) 20px, rgba(0,255,65,0.03) 21px), linear-gradient(180deg, #000500, #000a00)' },
        'gradient-wave-motion': { bg: 'linear-gradient(180deg, #0a0e27 0%, #1a1040 30%, #0d1933 60%, #0a0e27 100%)' },
        'cyberpunk-grid-pulse': { bg: 'linear-gradient(180deg, #0a001a 0%, #1a0033 50%, #330044 100%)' },
        'starfield-parallax': { bg: 'radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent), radial-gradient(1px 1px at 50% 60%, #fff 50%, transparent), radial-gradient(1px 1px at 80% 20%, #aaf 50%, transparent), radial-gradient(ellipse at center, #0a0e2a 0%, #000005 100%)' },
        'aurora-borealis': { bg: 'linear-gradient(180deg, #020111 0%, #031b34 30%, #0a3d2e 60%, #041428 80%, #020111 100%)', anim: 'sit-ds-bg-aurora 30s ease-in-out infinite alternate' },
        'radar-sweep': { bg: 'radial-gradient(circle, rgba(0,255,0,0.05) 0%, transparent 70%), radial-gradient(circle, #001a00 0%, #000a00 50%, #000500 100%)' },
        'blueprint-technical': { bg: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(80,144,210,0.15) 19px, rgba(80,144,210,0.15) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(80,144,210,0.15) 19px, rgba(80,144,210,0.15) 20px), #0a1628' },
        'dark-topography': { bg: '#1a1a2e' },
        'circuit-board-trace': { bg: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(64,200,176,0.08) 30px, rgba(64,200,176,0.08) 31px), #0a0f1a' },
        'noise-grain-texture': { bg: '#1a1a1a' },
        'video-ambient-loop': { bg: 'linear-gradient(135deg, #0a0e17, #1a1040, #0a1628)' }
    };

    // ========================================
    // Dynamic CSS Loading (True WYSIWYG)
    // ========================================

    function loadLiveCSS(id, path) {
        // Remove existing
        $('#' + id).remove();
        if (!path) return;
        var href = '/en-US/static/app/' + TOOLKIT_APP + '/' + path;
        $('<link>').attr({ id: id, rel: 'stylesheet', type: 'text/css', href: href }).appendTo('head');
    }

    function updateLiveCSS() {
        // Load actual theme CSS
        if (studio.theme) {
            loadLiveCSS('sit-live-theme', 'themes/' + studio.theme + '.css');
        } else {
            loadLiveCSS('sit-live-theme', '');
        }

        // Load actual background CSS (for CSS-only backgrounds)
        var bgConf = backgrounds.filter(function(b) { return b.value === studio.background; })[0];
        if (studio.background && (!bgConf || !bgConf.type)) {
            // CSS background
            loadLiveCSS('sit-live-bg', 'backgrounds/' + studio.background + '.css');
        } else {
            loadLiveCSS('sit-live-bg', '');
        }
    }

    function updateCanvasTheme() {
        updateLiveCSS();
        var colors = themeColors[studio.theme] || themeColors[''];
        var $canvas = $('.sit-ds-canvas');
        var $panels = $('.sit-ds-panel');

        // Apply background
        var canvasBg = colors.bg;
        var bgSize = 'auto';
        var bgAnim = 'none';

        if (studio.background && bgPreviewColors[studio.background]) {
            var bgConf = bgPreviewColors[studio.background];
            if (typeof bgConf === 'string') {
                canvasBg = bgConf;
            } else if (bgConf) {
                canvasBg = bgConf.bg || colors.bg;
                bgSize = bgConf.size || 'auto';
                bgAnim = bgConf.anim || 'none';
            }
        }

        $canvas.css({
            'background': canvasBg,
            'background-size': bgSize,
            'animation': bgAnim,
            'border-color': colors.border,
            'border-style': 'solid',
            'transition': 'background 0.5s ease, border-color 0.3s ease'
        });

        // Panels: semi-transparent so background shows through edges
        var panelBg = colors.panel;
        if (studio.background) {
            // When a background is active, make panels slightly transparent
            panelBg = panelBg.replace('rgb(', 'rgba(').replace(')', ',0.92)');
            if (panelBg.indexOf('rgba') === -1) {
                panelBg = colors.panel; // fallback if replace didn't work
            }
        }

        $panels.css({
            'background': panelBg,
            'border-color': colors.border,
            'color': colors.text,
            'transition': 'all 0.3s ease',
            'backdrop-filter': studio.background ? 'blur(12px)' : 'none'
        });

        // Text color presets are applied below alongside theme defaults (see "Resolve text colors")

        // Live background preview — render actual animated effects
        var $bgCanvas = $canvas.find('.sit-ds-bg-canvas');
        if (studio.background === 'matrix-data-rain' || studio.background === 'particle-network' || studio.background === 'starfield-parallax') {
            if ($bgCanvas.length === 0) {
                $bgCanvas = $('<canvas class="sit-ds-bg-canvas"></canvas>').css({
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 0, pointerEvents: 'none', borderRadius: '12px', opacity: 0.5
                });
                $canvas.css('position', 'relative').prepend($bgCanvas);
            }
            var cvs = $bgCanvas[0];
            cvs.width = $canvas.width();
            cvs.height = $canvas.height();

            // Clear any existing animation
            if (window._dsBgAnimId) cancelAnimationFrame(window._dsBgAnimId);

            if (studio.background === 'matrix-data-rain') {
                startMatrixPreview(cvs);
            } else if (studio.background === 'particle-network') {
                startParticlePreview(cvs);
            } else if (studio.background === 'starfield-parallax') {
                startStarfieldPreview(cvs);
            }
        } else {
            // Remove canvas for non-animated backgrounds
            if (window._dsBgAnimId) { cancelAnimationFrame(window._dsBgAnimId); window._dsBgAnimId = null; }
            $canvas.find('.sit-ds-bg-canvas').remove();
        }

        // Ensure panels sit above the background canvas
        $panels.css('position', 'relative').css('z-index', '2');
        $('.sit-ds-add-row, #ds-add-row-area, .sit-ds-canvas-empty').css({ position: 'relative', zIndex: 2 });

        // Background label
        var $bgLabel = $canvas.find('.sit-ds-bg-label');
        if (studio.background) {
            var bgName = studio.background.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            if ($bgLabel.length === 0) {
                $bgLabel = $('<div class="sit-ds-bg-label"></div>').css({
                    position: 'absolute', top: '8px', right: '8px', zIndex: 5,
                    background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 12px',
                    borderRadius: '12px', fontSize: '10px', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    backdropFilter: 'blur(4px)', pointerEvents: 'none'
                });
                $canvas.css('position', 'relative').append($bgLabel);
            }
            $bgLabel.text(bgName).show();
        } else if ($bgLabel.length) {
            $bgLabel.hide();
        }

        // Theme label
        var $themeLabel = $canvas.find('.sit-ds-theme-label');
        if (studio.theme) {
            var themeName = studio.theme.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            if ($themeLabel.length === 0) {
                $themeLabel = $('<div class="sit-ds-theme-label"></div>').css({
                    position: 'absolute', top: '8px', left: '8px', zIndex: 5,
                    background: 'rgba(253,24,117,0.8)', color: '#fff', padding: '4px 12px',
                    borderRadius: '12px', fontSize: '10px', fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    pointerEvents: 'none'
                });
                $canvas.css('position', 'relative').append($themeLabel);
            }
            $themeLabel.text(themeName).show();
        } else if ($themeLabel.length) {
            $themeLabel.hide();
        }

        // Resolve text colors — preset overrides theme defaults
        var textTitle = colors.text;
        var textBody = colors.text;
        var textMuted = colors.border;
        var textAccent = colors.accent;
        if (studio.textColorPreset) {
            var _presets = themeTextPresets[studio.theme] || [];
            var _preset = _presets.filter(function(p) { return p.value === studio.textColorPreset; })[0];
            if (_preset && _preset.title) {
                textTitle = _preset.title;
                textBody = _preset.body;
                textMuted = _preset.muted;
                textAccent = _preset.title;
            }
        }

        // Override CSS custom properties on canvas so !important rules pick them up
        // Scoped to canvas only — sidebar keeps its default accent
        var canvasEl = document.querySelector('.sit-ds-canvas');
        if (canvasEl) {
            canvasEl.style.setProperty('--ds-text-white', textTitle);
            canvasEl.style.setProperty('--ds-text-primary', textBody);
            canvasEl.style.setProperty('--ds-text-secondary', textBody);
            canvasEl.style.setProperty('--ds-text-muted', textMuted);
        }
        // Set accent on each panel individually (not globally)
        $panels.each(function() {
            this.style.setProperty('--ds-accent', textAccent);
        });

        // Panel title inputs
        $('.sit-ds-panel-title-input').css({ 'color': textTitle });

        // Panel type labels
        $('.sit-ds-panel-type').css({ 'color': textAccent });

        // Panel body (search areas)
        $('.sit-ds-panel-body').css({
            'border-color': colors.border,
            'color': textBody
        });

        // Panel preview content
        $('.sit-ds-panel-preview').css({ 'color': textBody });
        // Drag handles
        $('.sit-ds-drag-handle').css({ 'color': textMuted });
        // Preview mode titles
        $('.sit-ds-canvas .panel-head h3').css({ 'color': textTitle });

        // Search inputs
        $('.sit-ds-search-input').css({
            'background': colors.bg,
            'color': colors.text,
            'border-color': colors.border
        });

        // Add row button
        $('.sit-ds-add-row').css({
            'border-color': colors.border,
            'color': colors.text
        });

        // Canvas empty state
        $('.sit-ds-canvas-empty').css({ 'color': colors.text });
    }

    // ========================================
    // Live Background Previews
    // ========================================

    function startMatrixPreview(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var fontSize = 14;
        var cols = Math.floor(w / fontSize);
        var drops = [];
        for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*<>{}[]|アイウエオカキクケコ';
        var frame = 0;

        function draw() {
            frame++;
            // Only update every 5th frame (80% slower)
            if (frame % 5 === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                ctx.fillRect(0, 0, w, h);
                ctx.font = fontSize + 'px monospace';
                for (var i = 0; i < cols; i++) {
                    var ch = chars[Math.floor(Math.random() * chars.length)];
                    var x = i * fontSize;
                    var y = drops[i] * fontSize;
                    // Bright head character
                    ctx.fillStyle = '#aaffaa';
                    ctx.globalAlpha = 0.9;
                    ctx.fillText(ch, x, y);
                    // Trail
                    if (drops[i] > 1) {
                        ctx.fillStyle = '#00ff41';
                        ctx.globalAlpha = 0.5;
                        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
                    }
                    if (drops[i] > 2) {
                        ctx.fillStyle = '#00ff41';
                        ctx.globalAlpha = 0.2;
                        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize * 2);
                    }
                    ctx.globalAlpha = 1;
                    if (y > h && Math.random() > 0.98) drops[i] = 0;
                    drops[i]++;
                }
            }
            window._dsBgAnimId = requestAnimationFrame(draw);
        }
        draw();
    }

    function startParticlePreview(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var particles = [];
        for (var i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.08,  // 80% slower
                vy: (Math.random() - 0.5) * 0.08,
                r: 2 + Math.random() * 2
            });
        }
        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    var dy = particles[i].y - particles[j].y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.strokeStyle = 'rgba(253,24,117,' + (1 - dist / 150) * 0.2 + ')';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                ctx.fillStyle = 'rgba(23,162,184,0.6)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = 'rgba(23,162,184,0.15)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }
            window._dsBgAnimId = requestAnimationFrame(draw);
        }
        draw();
    }

    function startStarfieldPreview(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var stars = [];
        for (var i = 0; i < 120; i++) {
            stars.push({
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * 1.5 + 0.3,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.3  // very slow twinkle
            });
        }
        function draw() {
            ctx.clearRect(0, 0, w, h);
            var time = Date.now() * 0.0002; // 80% slower (was 0.001)
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = 0.2 + 0.8 * Math.abs(Math.sin(time * s.speed + s.twinkle));
                ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            window._dsBgAnimId = requestAnimationFrame(draw);
        }
        draw();
    }

    function bindEvents() {
        var $c = $('#sit-design-studio');
        // Clean old handlers to prevent duplicates
        $c.off('click input change mousedown');

        // Top bar inputs
        $c.on('focus', '#ds-title, #ds-description', function() {
            pushHistory();
        });
        $c.on('input', '#ds-title', function() {
            studio.title = $(this).val();
        });
        $c.on('input', '#ds-description', function() {
            studio.description = $(this).val();
        });

        // Sidebar tab switching — only rebuild sidebar, not entire page
        $c.on('click', '.ds-sidebar-tab', function() {
            sidebarTab = $(this).data('tab');
            var $sidebar = $c.find('.sit-ds-sidebar');
            if ($sidebar.length) {
                var newSidebar = renderSidebar();
                $sidebar.replaceWith(newSidebar);
                // Re-init palette drag sources if on components tab
                if (sidebarTab === 'components') initDragDrop();
            } else {
                render();
                updateCanvasTheme();
            }
        });

        // Component search (live filter)
        $c.on('input', '#ds-component-search', function() {
            var query = $(this).val().toLowerCase();
            if (!query) {
                $('.sit-ds-palette-item').show();
                $('.sit-ds-palette-section').show();
                return;
            }
            $('.sit-ds-palette-item').each(function() {
                var label = ($(this).data('label') || '').toLowerCase();
                var type = ($(this).data('type') || '').toLowerCase();
                $(this).toggle(label.indexOf(query) > -1 || type.indexOf(query) > -1);
            });
            // Hide empty sections
            $('.sit-ds-palette-section').each(function() {
                var hasVisible = $(this).find('.sit-ds-palette-item:visible').length > 0;
                $(this).toggle(hasVisible);
            });
        });

        // Theme & Background (now in Settings tab)
        $c.on('change', '#ds-theme', function() {
            pushHistory();
            studio.theme = $(this).val();
            studio.textColorPreset = ''; // Reset text color when theme changes
            updateCanvasTheme();
            // Re-render sidebar to show new text color options
            var $sidebar = $c.find('.sit-ds-sidebar');
            if ($sidebar.length && sidebarTab === 'colors') {
                $sidebar.replaceWith(renderSidebar());
            }
        });
        $c.on('change', '#ds-background', function() {
            pushHistory();
            studio.background = $(this).val();
            updateCanvasTheme();
        });
        // Text color preset selection
        $c.on('click', '.ds-text-preset', function() {
            var val = $(this).data('preset');
            if (typeof val === 'undefined') return;
            pushHistory();
            studio.textColorPreset = val;
            updateCanvasTheme();
            // Re-render sidebar to update selection styling
            var scrollTop = $c.find('.sit-ds-sidebar').scrollTop();
            var $sidebar = $c.find('.sit-ds-sidebar');
            if ($sidebar.length) {
                $sidebar.replaceWith(renderSidebar());
                $c.find('.sit-ds-sidebar').scrollTop(scrollTop);
            }
            var preset = (themeTextPresets[studio.theme] || []).filter(function(p) { return p.value === val; })[0];
            showToast(preset ? 'Text: ' + preset.label : 'Text colors reset', 'info');
        });

        // Enhancement dropdowns
        $c.on('change', '.ds-enh-select', function() {
            var field = $(this).data('field');
            studio[field] = $(this).val();
            var label = $(this).find('option:selected').text();
            if (label && label !== 'Default KPI' && label !== 'Default Tables' && label !== 'Default table style' && label !== 'Default KPI style') {
                showToast('Style: ' + label, 'success');
            }
        });

        // Enhancement checkboxes — with visual feedback
        // Effect toggle — uses custom span (not native checkbox) so no focus auto-scroll
        $c.on('click', '.ds-enh-check', function(e) {
            e.stopPropagation();
            var $this = $(this);
            var group = $this.data('group');
            var value = $this.data('value');
            var wasChecked = $this.attr('data-checked') === '1';
            var checked = !wasChecked;
            var label = $this.closest('label').text().trim();

            // Update visual state of this checkbox inline (no re-render = no scroll jump)
            $this.attr('data-checked', checked ? '1' : '0');
            // Find color from existing style
            var currentStyle = $this.attr('style') || '';
            var colorMatch = currentStyle.match(/border:2px solid (#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/);
            var color = colorMatch ? colorMatch[1] : '#FD1875';
            if (checked) {
                $this.css({ 'background': color, 'border-color': color });
                $this.html('<svg width="10" height="10" viewBox="0 0 16 16" style="pointer-events:none;"><path d="M13 4L6 11L3 8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>');
            } else {
                $this.css({ 'background': 'transparent', 'border-color': '#4a545e' });
                $this.html('');
            }

            if (checked) {
                if (studio[group].indexOf(value) === -1) studio[group].push(value);
            } else {
                studio[group] = studio[group].filter(function(v) { return v !== value; });
            }

            // Show toast feedback
            showToast((checked ? '+ ' : '- ') + label, checked ? 'success' : 'info');

            // Save sidebar scroll (not strictly needed now since no focus, but safety belt)
            var $sidebar = $c.find('.sit-ds-sidebar');
            var sidebarScroll = $sidebar.length ? $sidebar.scrollTop() : 0;

            // Rebuild canvas content
            var $canvasWrapper = $c.find('.sit-ds-workspace');
            if ($canvasWrapper.length) {
                $canvasWrapper.find('.sit-ds-canvas, .sit-ds-page-tabs').remove();
                $canvasWrapper.append(renderCanvas());
                updateCanvasTheme();
                initDragDrop();
            }

            // Re-render sidebar to show/hide inline config dropdowns (e.g. refresh interval)
            // and update Dashboard Summary counts on Settings tab
            if (sidebarTab === 'effects' || sidebarTab === 'settings') {
                var $sidebarNow = $c.find('.sit-ds-sidebar');
                var savedScroll = $sidebarNow.length ? $sidebarNow.scrollTop() : 0;
                $sidebarNow.replaceWith(renderSidebar());
                // Restore scroll after re-render (custom checkboxes don't auto-scroll)
                $c.find('.sit-ds-sidebar').scrollTop(savedScroll);
            }

            // Preview animation effect on canvas panels
            if (checked && group === 'animations') {
                var $panels = $('.sit-ds-panel');
                if (value === 'panel-entrance-fade' || value === 'stagger-grid') {
                    $panels.css('opacity', '0');
                    $panels.each(function(i) {
                        var $p = $(this);
                        setTimeout(function() { $p.css({ opacity: 1, transition: 'opacity 0.5s ease' }); }, i * 100);
                    });
                } else if (value === 'panel-entrance-slide') {
                    $panels.css({ transform: 'translateY(20px)', opacity: 0 });
                    $panels.each(function(i) {
                        var $p = $(this);
                        setTimeout(function() { $p.css({ transform: 'translateY(0)', opacity: 1, transition: 'all 0.5s ease' }); }, i * 100);
                    });
                } else if (value === 'hover-glow-border') {
                    $panels.css({ boxShadow: '0 0 15px rgba(253,24,117,0.4)', transition: 'box-shadow 0.3s ease' });
                    setTimeout(function() { $panels.css('box-shadow', ''); }, 1500);
                } else if (value === 'pulse-attention') {
                    $panels.css({ animation: 'sit-ds-pulse-preview 1s ease-in-out 2' });
                    setTimeout(function() { $panels.css('animation', ''); }, 2000);
                }
            }
        });

        // ---- COMPONENT PLACEMENT (mouse-based drag + click) ----
        //
        // TWO WAYS TO PLACE COMPONENTS:
        // 1. CLICK sidebar item → fills next empty panel or creates new row
        // 2. DRAG sidebar item → floating ghost follows mouse → drop on panel
        //
        // SWAP PANELS: click panel → click another panel → they swap

        // Empty-state Import button
        $c.on('click', '#ds-empty-import', function() { showImportModal(); });

        // Custom template click
        $c.on('click', '.ds-custom-tmpl', function(e) {
            e.stopPropagation();
            var ci = parseInt($(this).data('custom'));
            loadCustomTemplate(ci);
        });

        // Built-in template card click
        $c.on('click', '.sit-ds-template-card:not(.ds-custom-tmpl)', function() {
            var idx = parseInt($(this).data('template'));
            applyTemplate(idx);
        });

        // Click palette item → add to next empty slot
        $c.on('click', '.sit-ds-palette-item', function(e) {
            // Don't fire if a drag just happened
            if (window._dsDragHappened) return;
            if ($(this).hasClass('ui-draggable-dragging')) return;
            if (window._dsDragType) return;
            addComponent($(this).data('type'));
            updateCanvasTheme();
        });

        // Click panel → select and show config
        $c.on('click', '.sit-ds-panel', function(e) {
            if ($(e.target).is('input, textarea, select, button') || $(e.target).closest('button').length) return;

            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));

            if (selectedPanel && selectedPanel.rowIdx === ri && selectedPanel.colIdx === ci) {
                // Deselect
                selectedPanel = null;
                $('.sit-ds-config-popover').remove();
            } else if (selectedPanel) {
                // Swap panels
                pushHistory();
                var sr = selectedPanel.rowIdx, sc = selectedPanel.colIdx;
                if (activeRows()[sr] && activeRows()[ri]) {
                    var tmp = activeRows()[sr].columns[sc];
                    activeRows()[sr].columns[sc] = activeRows()[ri].columns[ci];
                    activeRows()[ri].columns[ci] = tmp;
                }
                selectedPanel = null;
                $('.sit-ds-config-popover').remove();
            } else {
                selectedPanel = { rowIdx: ri, colIdx: ci };
            }
            render();
            updateCanvasTheme();
            // Show config popover for selected panel
            if (selectedPanel) {
                showPanelConfig(selectedPanel.rowIdx, selectedPanel.colIdx);
            }
        });

        // Config popover close button
        $c.on('click', '.ds-config-close', function(e) {
            e.stopPropagation();
            selectedPanel = null;
            $('.sit-ds-config-popover').remove();
            $('.sit-ds-panel-selected').removeClass('sit-ds-panel-selected');
        });

        // Config popover changes
        $c.on('change input', '.ds-config-field', function() {
            if (!selectedPanel) return;
            var panel = activeRows()[selectedPanel.rowIdx] && activeRows()[selectedPanel.rowIdx].columns[selectedPanel.colIdx];
            if (!panel) return;
            var field = $(this).data('field');
            panel[field] = $(this).val();
            // Re-render config if drilldown type or condition operator changed
            if (field === 'drilldownType' || field === 'hideCondOp' || field === 'hideCondField' || field === 'hideCondValue') {
                showPanelConfig(selectedPanel.rowIdx, selectedPanel.colIdx);
            }
        });

        // Hide-by-value enable/disable toggle
        $c.on('change', '.ds-cond-enable', function() {
            if (!selectedPanel) return;
            var panel = activeRows()[selectedPanel.rowIdx] && activeRows()[selectedPanel.rowIdx].columns[selectedPanel.colIdx];
            if (!panel) return;
            var enabled = $(this).is(':checked');
            if (!enabled) {
                panel.hideCondField = '';
                panel.hideCondOp = '';
                panel.hideCondValue = '';
            }
            showPanelConfig(selectedPanel.rowIdx, selectedPanel.colIdx);
        });

        // Advanced section toggle
        $c.on('click', '.ds-toggle-advanced', function(e) {
            e.stopPropagation();
            var $body = $(this).siblings('.ds-advanced-body');
            var $arrow = $(this).find('.ds-adv-arrow');
            $body.toggle();
            $arrow.html($body.is(':visible') ? '&#9660;' : '&#9654;');
        });

        // ---- DRAG AND DROP via jQuery UI (bundled in Splunk 10.2) ----
        initDragDrop();

        // Add Row button
        $c.on('click', '#ds-add-row', function() {
            $('#ds-col-picker').toggle();
        });

        // Column picker
        $c.on('click', '.ds-col-btn', function() {
            var cols = parseInt($(this).data('cols'));
            addRow(cols);
            $('#ds-col-picker').hide();
        });

        // Templates button (show/hide template picker inline)
        $c.on('click', '#ds-show-templates', function() {
            var $existing = $('#ds-template-inline');
            if ($existing.length) {
                $existing.remove();
                return;
            }
            var th = '<div id="ds-template-inline" style="margin-top:12px;padding:16px;background:rgba(0,0,0,0.3);border:1px solid #3c444d;border-radius:10px;">';
            th += '<div style="font-size:11px;font-weight:600;color:#FD1875;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Choose a Template</div>';
            th += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">';
            dashboardTemplates.forEach(function(tmpl, ti) {
                th += '<div class="sit-ds-template-card" data-template="' + ti + '" style="cursor:pointer;">';
                th += '<div class="sit-ds-template-preview" style="background:' + tmpl.previewColors.bg + ';width:100px;height:60px;border-radius:6px;padding:6px;box-sizing:border-box;">';
                tmpl.rows.forEach(function(row) {
                    th += '<div style="display:flex;gap:2px;margin-bottom:2px;">';
                    row.forEach(function(col) {
                        var color = tmpl.previewColors.accent;
                        if (col.type === 'chart') color = '#17A2B8';
                        else if (col.type === 'table') color = '#5CC05C';
                        else if (col.type === 'empty') color = tmpl.previewColors.panel;
                        th += '<div style="flex:1;height:' + (col.type === 'single' ? '8' : '12') + 'px;background:' + color + ';border-radius:2px;opacity:0.7;"></div>';
                    });
                    th += '</div>';
                });
                th += '</div>';
                th += '<div style="font-size:10px;color:#a0a0a0;text-align:center;margin-top:4px;">' + esc(tmpl.name) + '</div>';
                if (tmpl.subtitle) th += '<div style="font-size:8px;color:#4a545e;text-align:center;max-width:100px;line-height:1.2;margin-top:1px;">' + esc(tmpl.subtitle) + '</div>';
                th += '</div>';
            });
            th += '</div></div>';
            $('#ds-add-row-area').after(th);
        });

        // Delete panel
        $c.on('click', '.ds-delete-panel', function(e) {
            e.stopPropagation();
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            deletePanel(ri, ci);
        });

        // Move panel left/right
        $c.on('click', '.ds-move-panel', function(e) {
            e.stopPropagation();
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            var dir = $(this).data('dir');
            var newCi = dir === 'left' ? ci - 1 : ci + 1;
            if (activeRows()[ri] && activeRows()[ri].columns[newCi] !== undefined) {
                var tmp = activeRows()[ri].columns[ci];
                activeRows()[ri].columns[ci] = activeRows()[ri].columns[newCi];
                activeRows()[ri].columns[newCi] = tmp;
                refreshCanvas();
                updateCanvasTheme();
            }
        });

        // Delete row
        $c.on('click', '.ds-delete-row', function(e) {
            e.stopPropagation();
            var ri = parseInt($(this).data('row'));
            deleteRow(ri);
        });

        // Add empty panel to row (the "+" button)
        $c.on('click', '.ds-add-panel-to-row', function(e) {
            e.stopPropagation();
            var ri = parseInt($(this).data('row'));
            if (activeRows()[ri] && activeRows()[ri].columns.length < MAX_COLS) {
                activeRows()[ri].columns.push({ type: 'empty', title: '', search: '', chartType: 'line', htmlContent: '' });
                render();
                updateCanvasTheme();
            }
        });

        // Hover effect on add-panel button
        $c.on('mouseenter', '.ds-add-panel-to-row', function() {
            $(this).css({ 'border-color': '#FD1875', 'color': '#FD1875', 'background': 'rgba(253,24,117,0.05)' });
        }).on('mouseleave', '.ds-add-panel-to-row', function() {
            $(this).css({ 'border-color': '#3c444d', 'color': '#6c757d', 'background': 'transparent' });
        });

        // Panel title input
        $c.on('input', '.sit-ds-panel-title-input', function() {
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
                activeRows()[ri].columns[ci].title = $(this).val();
            }
        });

        // Search input
        $c.on('input', '.ds-search-input', function() {
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
                activeRows()[ri].columns[ci].search = $(this).val();
            }
        });

        // HTML content input
        $c.on('input', '.ds-html-input', function() {
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
                activeRows()[ri].columns[ci].htmlContent = $(this).val();
            }
        });

        // Chart type change
        $c.on('change', '.ds-chart-type', function() {
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
                activeRows()[ri].columns[ci].chartType = $(this).val();
            }
        });

        // Quick-add buttons inside empty panels
        $c.on('click', '.ds-quick-add', function(e) {
            e.stopPropagation();
            var type = $(this).data('type');
            var ri = parseInt($(this).data('row'));
            var ci = parseInt($(this).data('col'));
            if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
                pushHistory();
                activeRows()[ri].columns[ci] = createPanel(type);
                refreshCanvas();
                updateCanvasTheme();
            }
        });

        // Page tabs — switch page
        $c.on('click', '.ds-page-tab', function() {
            var pi = parseInt($(this).data('page'));
            if (pi !== studio.activePage && studio.pages[pi]) {
                studio.activePage = pi;
                selectedPanel = null;
                render();
                updateCanvasTheme();
            }
        });

        // Page tabs — add new page
        $c.on('click', '#ds-add-page', function() {
            pushHistory();
            var pageNum = studio.pages.length + 1;
            studio.pages.push({ name: 'Page ' + pageNum, rows: [] });
            studio.activePage = studio.pages.length - 1;
            render();
            updateCanvasTheme();
            showToast('Added Page ' + pageNum + '. Each page becomes a tab in the final dashboard.', 'success');
        });

        // Page tabs — double-click to rename
        $c.on('dblclick', '.ds-page-tab', function() {
            var pi = parseInt($(this).data('page'));
            var page = studio.pages[pi];
            if (!page) return;
            var $btn = $(this);
            var current = page.name;
            var $input = $('<input type="text" style="width:80px;padding:4px 8px;background:#0a0e12;border:1px solid #FD1875;border-radius:4px;color:#fff;font-size:12px;font-family:inherit;outline:none;" />').val(current);
            $btn.html('').append($input);
            $input.focus().select();
            $input.on('blur keydown', function(e) {
                if (e.type === 'keydown' && e.key !== 'Enter') return;
                var newName = $input.val().trim() || current;
                page.name = newName;
                render();
                updateCanvasTheme();
            });
        });

        // Page tabs — right-click to delete (if more than 1 page)
        $c.on('contextmenu', '.ds-page-tab', function(e) {
            e.preventDefault();
            var pi = parseInt($(this).data('page'));
            if (studio.pages.length <= 1) {
                showToast('Cannot delete the only page', 'warning');
                return;
            }
            pushHistory();
            studio.pages.splice(pi, 1);
            if (studio.activePage >= studio.pages.length) studio.activePage = studio.pages.length - 1;
            render();
            updateCanvasTheme();
            showToast('Page deleted', 'info');
        });

        // Delete form input
        $c.on('click', '.ds-delete-input', function(e) {
            e.stopPropagation();
            var fi = parseInt($(this).data('fi'));
            if (fi >= 0 && fi < studio.formInputs.length) {
                pushHistory();
                studio.formInputs.splice(fi, 1);
                // Rebuild only canvas to avoid scroll-to-top
                var $sidebar2 = $c.find('.sit-ds-sidebar');
                var scroll2 = $sidebar2.length ? $sidebar2.scrollTop() : 0;
                var $wrap2 = $c.find('.sit-ds-workspace');
                if ($wrap2.length) {
                    $wrap2.find('.sit-ds-canvas, .sit-ds-page-tabs').remove();
                    $wrap2.append(renderCanvas());
                    updateCanvasTheme();
                    initDragDrop();
                }
                if ($sidebar2.length) {
                    $sidebar2.replaceWith(renderSidebar());
                    $c.find('.sit-ds-sidebar').scrollTop(scroll2);
                }
            }
        });

        // Undo / Redo buttons
        $c.on('click', '#ds-undo', function() { undo(); });
        $c.on('click', '#ds-redo', function() { redo(); });

        // Keyboard shortcuts for undo/redo
        $(document).off('keydown.ds-undo').on('keydown.ds-undo', function(e) {
            // Ctrl+Z / Cmd+Z = undo
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                // Don't hijack when typing in inputs
                if ($(e.target).is('input, textarea, select')) return;
                e.preventDefault();
                undo();
            }
            // Ctrl+Y / Cmd+Shift+Z = redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z') || (e.shiftKey && e.key === 'Z'))) {
                if ($(e.target).is('input, textarea, select')) return;
                e.preventDefault();
                redo();
            }
        });

        // Clear canvas
        $c.on('click', '#ds-clear', function() {
            var panelCount = 0;
            studio.pages.forEach(function(pg) { pg.rows.forEach(function(r) { panelCount += r.columns.length; }); });
            if (panelCount === 0 && studio.formInputs.length === 0) {
                showToast('Canvas is already empty', 'info');
                return;
            }
            // Safety confirmation via custom modal (no confirm() — fails AppInspect)
            var msg = 'Clear everything? This will remove ' + panelCount + ' panel' + (panelCount !== 1 ? 's' : '') +
                (studio.pages.length > 1 ? ' across ' + studio.pages.length + ' pages' : '') +
                (studio.formInputs.length > 0 ? ' and ' + studio.formInputs.length + ' form input' + (studio.formInputs.length !== 1 ? 's' : '') : '') +
                '. This can be undone with Ctrl+Z.';
            var $confirmBackdrop = $('<div>').css({ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:300000,display:'flex',alignItems:'center',justifyContent:'center' });
            var $confirmModal = $('<div>').css({ background:'#1a1e22',borderRadius:'12px',border:'1px solid #DC3545',padding:'24px',maxWidth:'400px',color:'#e0e0e0',textAlign:'center',fontFamily:'inherit' });
            $confirmModal.html('<div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#DC3545;">Clear Canvas?</div>' +
                '<div style="font-size:13px;margin-bottom:20px;color:#a0a0a0;">' + esc(msg) + '</div>' +
                '<div style="display:flex;gap:8px;justify-content:center;">' +
                '<button class="ds-confirm-cancel sit-ds-btn sit-ds-btn-secondary" style="padding:8px 20px;">Cancel</button>' +
                '<button class="ds-confirm-ok sit-ds-btn sit-ds-btn-primary" style="padding:8px 20px;background:#DC3545;">Clear</button></div>');
            $confirmBackdrop.append($confirmModal).appendTo('body');
            $confirmBackdrop.on('click', '.ds-confirm-cancel', function() { $confirmBackdrop.remove(); });
            $confirmBackdrop.on('click', function(e) { if ($(e.target).is($confirmBackdrop)) $confirmBackdrop.remove(); });
            $confirmBackdrop.on('click', '.ds-confirm-ok', function() {
                $confirmBackdrop.remove();
                pushHistory();
                studio.title = 'My Dashboard';
                studio.description = '';
                studio.theme = '';
                studio.background = '';
                studio.kpiStyle = '';
                studio.tableStyle = '';
                studio.animations = [];
                studio.controls = [];
                studio.kpiEffects = [];
                studio.dashExtras = [];
                studio.uiFramework = [];
                studio.formInputs = [];
                studio.pages = [{ name: 'Page 1', rows: [] }];
                studio.activePage = 0;
                sidebarTab = 'components';
                previewMode = false;
                selectedPanel = null;
                render();
                updateCanvasTheme();
                $('#sit-live-theme').remove();
                $('#sit-live-bg').remove();
                showToast('Canvas cleared. Ctrl+Z to undo.', 'info');
            });
        });

        // Preview mode toggle
        $c.on('click', '#ds-toggle-preview', function() {
            previewMode = !previewMode;
            selectedPanel = null;
            $('.sit-ds-config-popover').remove();
            render();
            updateCanvasTheme();
            // Load real widget JS in preview mode
            if (previewMode) {
                setTimeout(function() { loadPreviewWidgets(); }, 300);
            }
        });

        // More dropdown toggle
        $c.on('click', '#ds-more-menu', function(e) {
            e.stopPropagation();
            var $dd = $('#ds-more-dropdown');
            $dd.toggle();
        });
        // Close dropdown on outside click
        $(document).off('click.ds-more').on('click.ds-more', function() { $('#ds-more-dropdown').hide(); });
        // Hover effect on dropdown items
        $c.on('mouseenter', '.ds-more-item', function() { $(this).css('background', 'rgba(253,24,117,0.1)'); });
        $c.on('mouseleave', '.ds-more-item', function() { $(this).css('background', 'none'); });

        // Cloud Download button (primary action in cloud mode)
        $c.on('click', '#ds-cloud-download', function() {
            if (activeRows().length === 0) { showToast('Add panels first', 'warning'); return; }
            var xml = generateSimpleXML();
            var filename = studio.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.xml';
            var blob = new Blob([xml], { type: 'text/xml' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Downloaded ' + filename + '. Upload via Splunk Dashboards > Create > Source Editor.', 'success');
        });

        // Cloud mode toggle
        $c.on('change', '#ds-cloud-mode', function() {
            cloudMode = $(this).is(':checked');
            try { localStorage.setItem('sit_ds_cloud_mode', cloudMode ? '1' : '0'); } catch(e) {}
            render();
            updateCanvasTheme();
            showToast(cloudMode ? 'Cloud Mode ON — REST write buttons hidden' : 'Cloud Mode OFF — all buttons visible', 'info');
        });

        // Effect configuration fields — stop propagation so clicks don't toggle parent checkbox
        $c.on('click mousedown', '.ds-effect-config', function(e) {
            e.stopPropagation();
        });
        $c.on('change input', '.ds-effect-config', function(e) {
            e.stopPropagation();
            var key = '_' + $(this).data('config');
            studio[key] = $(this).val();
        });

        // Effect info modal
        $c.on('click', '.ds-effect-info', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showEffectInfo($(this).data('effect'));
        });

        // Show tour
        $c.on('click', '#ds-show-tour', function(e) { e.preventDefault(); showWalkthrough(); });

        // Save as Template
        $c.on('click', '#ds-save-template', function() { $('#ds-more-dropdown').hide(); showSaveTemplateModal(); });

        // Import and History
        $c.on('click', '#ds-import', function() { showImportModal(); });
        $c.on('click', '#ds-history', function() { showVersionHistoryModal(); });

        // Expandable version history in Settings tab
        $c.on('click', '#ds-toggle-versions', function() {
            var $list = $('#ds-version-list');
            var $arrow = $(this).find('.ds-version-arrow');
            if ($list.is(':visible')) {
                $list.slideUp(200);
                $arrow.css('transform', 'rotate(0deg)');
            } else {
                $list.slideDown(200);
                $arrow.css('transform', 'rotate(180deg)');
            }
        });

        // Inline version Edit button (load into editor)
        $c.on('click', '.ds-ver-load', function(e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('idx'));
            var versions = getVersionHistory();
            var v = versions[idx];
            if (v) {
                try {
                    parseAndLoadXML(v.xml);
                    render();
                    updateCanvasTheme();
                    showToast('Loaded version from ' + getTimeAgo(new Date(v.timestamp)), 'success');
                } catch (err) {
                    showToast('Failed to parse: ' + err.message, 'error');
                }
            }
        });

        // Inline version Restore button (write back to Splunk)
        $c.on('click', '.ds-ver-restore', function(e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('idx'));
            var versions = getVersionHistory();
            var v = versions[idx];
            if (!v) return;
            var $btn = $(this);
            $btn.text('...');
            var csrfToken = getCsrfToken();
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(v.app) + '/data/ui/views/' + encodeURIComponent(v.dashboard) + '?output_mode=json',
                type: 'POST',
                data: { 'eai:data': v.xml },
                headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
                success: function() {
                    $btn.css('background', '#d4af37').text('Done!');
                    showToast('Restored ' + v.label + ' to previous version', 'success');
                },
                error: function() {
                    $btn.css('background', '#DC3545').text('Failed');
                    showToast('Could not restore. Dashboard may have been deleted.', 'error');
                }
            });
        });

        // Hover on version rows
        $c.on('mouseenter', '.ds-version-row', function() { $(this).css('background', 'rgba(255,255,255,0.03)'); });
        $c.on('mouseleave', '.ds-version-row', function() { $(this).css('background', 'transparent'); });

        // Preview
        $c.on('click', '#ds-preview', function() { previewDashboard(); });

        // Export
        $c.on('click', '#ds-export', function() {
            showExportModal();
        });

        // Save to Dashboard
        $c.on('click', '#ds-save', function() {
            showSaveModal();
        });

        // Legacy apply (from export modal)
        $c.on('click', '#ds-apply', function() {
            showSaveModal();
        });
    }

    // ========================================
    // State Manipulation
    // ========================================

    // ========================================
    // Live Widget HTML (for Preview Mode)
    // ========================================

    // Returns the actual HTML that the widget JS expects to find, or null for search-based panels
    function getLiveWidgetHTML(panel) {
        var uid = 'prev_' + Math.random().toString(36).substr(2, 6);
        var map = {
            'clock':          '<div class="world-clock" data-format="12h" data-timezone="local"></div>',
            'countdown':      '<div class="countdown-widget" data-countdown-date="' + getDefaultCountdownTarget() + '" data-label="Countdown"></div>',
            'gauge-speed':    '<div class="gauge-speedometer" data-value="72" data-max="100" data-label="Speed"></div>',
            'gauge-liquid':   '<div class="gauge-liquid-fill" data-value="65" data-label="Capacity"></div>',
            'traffic-lights': '<div style="display:flex;align-items:center;justify-content:center;gap:16px;padding:12px;"><div class="sit-traffic-light" data-status="green" data-label="API"></div><div class="sit-traffic-light" data-status="yellow" data-label="DB"></div><div class="sit-traffic-light" data-status="green" data-label="Web"></div></div>',
            'qr-code':        '<div class="qr-inline" data-value="https://splunk.com" data-label="Scan Me"></div>',
            'team-board':     '<div class="team-board" data-title="Team Status" data-layout="grid"><div class="team-member" data-name="Alice" data-role="Lead" data-status="online"></div><div class="team-member" data-name="Bob" data-role="Engineer" data-status="busy"></div></div>',
            'weather':        '<div class="weather-widget" data-city="San Francisco" data-condition="sunny" data-temp="72" data-unit="F"></div>',
            'network-map':    '<div id="network-map-' + uid + '" data-viz="network-map" style="width:100%;height:300px;"></div>',
            'globe':          '<div id="globe-3d-' + uid + '" data-viz="globe-3d" data-auto-rotate="true" style="width:100%;height:300px;"></div>',
            'heatmap':        '<div id="heatmap-calendar-' + uid + '" data-viz="heatmap-calendar" data-color-scheme="green" data-label="Activity" style="width:100%;height:200px;"></div>',
            'kanban':         '<div id="kanban-board-' + uid + '" data-viz="kanban-board" style="width:100%;min-height:300px;"></div>',
            'org-chart':      '<div id="org-chart-' + uid + '" data-viz="org-chart" style="width:100%;height:300px;"></div>',
            'terminal':       '<div id="terminal-log-' + uid + '" data-viz="terminal-log" data-title="System Logs" data-theme="green" data-auto-scroll="true" style="width:100%;height:250px;"></div>',
            'timeline':       '<div id="timeline-gantt-' + uid + '" data-viz="timeline-gantt" style="width:100%;height:250px;"></div>'
        };
        return map[panel.type] || null;
    }

    // Load widget + effect JS files dynamically in preview mode
    function loadPreviewWidgets() {
        if (!previewMode) return;
        var basePath = '../app/' + TOOLKIT_APP + '/';
        var toLoad = {};

        // 1. Widget JS for panel types used in the design
        studio.pages.forEach(function(pg) {
            pg.rows.forEach(function(row) {
                row.columns.forEach(function(panel) {
                    var ref = widgetJsMap[panel.type];
                    if (ref && ref.indexOf('.js') !== -1) {
                        toLoad[panel.type] = ref;
                    }
                });
            });
        });

        // 2. Interactive controls (toggles)
        studio.controls.forEach(function(c) {
            toLoad['ctrl_' + c] = 'toggles/' + c + '.js';
        });

        // 3. JS animations
        enhancements.animations.forEach(function(a) {
            if (a.type === 'js' && studio.animations.indexOf(a.value) > -1) {
                toLoad['anim_' + a.value] = 'animations/' + a.value + '.js';
            }
        });

        // 4. KPI effects
        studio.kpiEffects.forEach(function(k) {
            toLoad['kpi_' + k] = 'widgets/' + k + '.js';
        });

        // 5. Dashboard extras
        studio.dashExtras.forEach(function(d) {
            toLoad['extra_' + d] = 'widgets/' + d + '.js';
        });

        // 6. Background JS
        var bgConf = backgrounds.filter(function(b) { return b.value === studio.background; })[0];
        if (bgConf && bgConf.type === 'js') {
            toLoad['bg'] = 'backgrounds/' + studio.background + '.js';
            toLoad['bg_helper'] = 'backgrounds/background-helper.js';
        }

        // Load each via RequireJS
        Object.keys(toLoad).forEach(function(key) {
            var jsPath = toLoad[key].replace('.js', '');
            var modName = 'sit_prev_' + key.replace(/[-\/]/g, '_');
            var paths = {};
            paths[modName] = basePath + jsPath;
            require.config({ paths: paths });
            require([modName], function() {
                console.log('SIT Preview: loaded ' + jsPath);
            }, function(err) {
                console.warn('SIT Preview: failed to load ' + jsPath, err);
            });
        });
    }

    // ========================================
    // Panel Configuration Popover
    // ========================================

    function showPanelConfig(ri, ci) {
        $('.sit-ds-config-popover').remove();
        var panel = activeRows()[ri] && activeRows()[ri].columns[ci];
        if (!panel || panel.type === 'empty') return;

        var $panelEl = $('.sit-ds-panel[data-row="' + ri + '"][data-col="' + ci + '"]');
        if (!$panelEl.length) return;

        // Position the popover as a fixed floating card near the panel
        var panelRect = $panelEl[0].getBoundingClientRect();
        var popTop = Math.max(80, Math.min(panelRect.top, window.innerHeight - 500));
        var h = '<div class="sit-ds-config-popover" style="position:fixed;top:' + popTop + 'px;right:20px;width:280px;max-height:' + (window.innerHeight - popTop - 20) + 'px;overflow-y:auto;background:#0d1117;border:1px solid #FD1875;border-radius:8px;padding:10px 12px;font-size:11px;box-shadow:0 8px 32px rgba(0,0,0,0.6);z-index:10000;">';
        h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
        h += '<div style="font-size:10px;font-weight:700;color:#FD1875;text-transform:uppercase;letter-spacing:0.5px;">Configure: ' + (panelTypeLabels[panel.type] || panel.type) + '</div>';
        h += '<button class="ds-config-close" style="background:none;border:none;color:#6c757d;font-size:16px;cursor:pointer;padding:0 4px;line-height:1;">&times;</button>';
        h += '</div>';

        // Title
        h += '<label style="display:block;font-size:9px;color:#6c757d;margin-bottom:2px;">Panel Title</label>';
        h += '<input class="ds-config-field" data-field="title" value="' + escAttr(panel.title) + '" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:11px;margin-bottom:6px;box-sizing:border-box;" />';

        // Type-specific options
        if (panel.type === 'chart') {
            h += '<label style="display:block;font-size:9px;color:#6c757d;margin-bottom:2px;">Chart Type</label>';
            h += '<select class="ds-config-field" data-field="chartType" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:11px;margin-bottom:6px;">';
            chartTypes.forEach(function(ct) {
                h += '<option value="' + ct + '"' + (panel.chartType === ct ? ' selected' : '') + '>' + ct.charAt(0).toUpperCase() + ct.slice(1) + '</option>';
            });
            h += '</select>';
        }

        if (searchTypes.indexOf(panel.type) !== -1) {
            h += '<label style="display:block;font-size:9px;color:#6c757d;margin-bottom:2px;">SPL Query</label>';
            h += '<textarea class="ds-config-field" data-field="search" rows="3" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;margin-bottom:6px;box-sizing:border-box;resize:vertical;">' + esc(panel.search || '') + '</textarea>';
        }

        if (panel.type === 'html') {
            h += '<label style="display:block;font-size:9px;color:#6c757d;margin-bottom:2px;">HTML Content</label>';
            h += '<textarea class="ds-config-field" data-field="htmlContent" rows="4" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;margin-bottom:6px;box-sizing:border-box;resize:vertical;">' + esc(panel.htmlContent || '') + '</textarea>';
        }

        // Hide by Value — prominent, right after SPL query
        if (searchTypes.indexOf(panel.type) !== -1) {
            h += '<div style="margin-top:6px;padding:8px 10px;background:rgba(23,162,184,0.05);border:1px solid rgba(23,162,184,0.2);border-radius:8px;">';
            h += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:' + (panel.hideCondField ? '8' : '0') + 'px;">';
            h += '<input type="checkbox" class="ds-cond-enable" ' + (panel.hideCondField ? 'checked' : '') + ' style="accent-color:#17A2B8;width:14px;height:14px;" />';
            h += '<span style="font-size:10px;font-weight:700;color:#17A2B8;">Hide by Value</span>';
            h += '<span style="font-size:8px;color:#4a545e;margin-left:auto;">Hide panel based on search results</span>';
            h += '</label>';

            h += '<div class="ds-cond-fields" style="' + (panel.hideCondField ? '' : 'display:none;') + '">';
            h += '<div style="margin-bottom:4px;">';
            h += '<label style="font-size:8px;color:#6c757d;">Field name</label>';
            h += '<input class="ds-config-field" data-field="hideCondField" value="' + escAttr(panel.hideCondField || '') + '" placeholder="e.g. count, cpu_pct, status" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;box-sizing:border-box;font-family:monospace;" />';
            h += '</div>';
            h += '<div style="display:flex;gap:4px;margin-bottom:4px;">';
            h += '<div style="flex:1;">';
            h += '<label style="font-size:8px;color:#6c757d;">Condition</label>';
            h += '<select class="ds-config-field" data-field="hideCondOp" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;">';
            var ops = [
                { v: 'equals', l: 'equals' },
                { v: 'not_equals', l: 'not equals' },
                { v: 'less_than', l: 'less than' },
                { v: 'greater_than', l: 'greater than' },
                { v: 'less_equal', l: 'less or equal' },
                { v: 'greater_equal', l: 'greater or equal' },
                { v: 'contains', l: 'contains' },
                { v: 'is_empty', l: 'is empty / no results' }
            ];
            ops.forEach(function(op) {
                h += '<option value="' + op.v + '"' + ((panel.hideCondOp || 'less_than') === op.v ? ' selected' : '') + '>' + op.l + '</option>';
            });
            h += '</select>';
            h += '</div>';
            h += '<div style="flex:1;">';
            h += '<label style="font-size:8px;color:#6c757d;">Value</label>';
            h += '<input class="ds-config-field" data-field="hideCondValue" value="' + escAttr(panel.hideCondValue || '') + '" placeholder="e.g. 0, critical, 100" style="width:100%;padding:5px 8px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;box-sizing:border-box;" />';
            h += '</div>';
            h += '</div>';
            if (panel.hideCondField) {
                var opLabel = (ops.filter(function(o) { return o.v === (panel.hideCondOp || 'less_than'); })[0] || {}).l || 'less than';
                if (panel.hideCondOp === 'is_empty') {
                    h += '<div style="font-size:9px;color:#17A2B8;padding:4px 8px;background:rgba(23,162,184,0.12);border-radius:4px;">Hide when <strong>' + esc(panel.hideCondField) + '</strong> is empty or no results</div>';
                } else {
                    h += '<div style="font-size:9px;color:#17A2B8;padding:4px 8px;background:rgba(23,162,184,0.12);border-radius:4px;">Hide when <strong>' + esc(panel.hideCondField) + '</strong> ' + opLabel + ' <strong>' + esc(panel.hideCondValue || '?') + '</strong></div>';
                }
            }
            h += '</div>'; // close ds-cond-fields
            h += '</div>'; // close hide-by-value card
        }

        // Advanced section — collapsible
        var hasAdvanced = panel.drilldownType || panel.depends || panel.rejects || panel.cssClass;
        h += '<div style="margin-top:8px;border-top:1px solid #2b3033;padding-top:6px;">';
        h += '<button class="ds-toggle-advanced" style="background:none;border:none;color:#6c757d;font-size:9px;cursor:pointer;padding:2px 0;font-family:inherit;display:flex;align-items:center;gap:4px;">';
        h += '<span class="ds-adv-arrow" style="font-size:7px;transition:transform 0.15s;">' + (hasAdvanced ? '&#9660;' : '&#9654;') + '</span>';
        h += 'Advanced' + (hasAdvanced ? ' (configured)' : '');
        h += '</button>';
        h += '<div class="ds-advanced-body" style="' + (hasAdvanced ? '' : 'display:none;') + 'margin-top:6px;">';

        // Drilldown
        h += '<label style="display:block;font-size:9px;font-weight:600;color:#17A2B8;margin-bottom:4px;">Drilldown (click action)</label>';
        h += '<select class="ds-config-field" data-field="drilldownType" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;margin-bottom:4px;">';
        h += '<option value=""' + (!panel.drilldownType ? ' selected' : '') + '>None</option>';
        h += '<option value="dashboard"' + (panel.drilldownType === 'dashboard' ? ' selected' : '') + '>Link to dashboard</option>';
        h += '<option value="url"' + (panel.drilldownType === 'url' ? ' selected' : '') + '>Link to URL</option>';
        h += '<option value="token"' + (panel.drilldownType === 'token' ? ' selected' : '') + '>Set token</option>';
        h += '</select>';
        if (panel.drilldownType === 'dashboard') {
            h += '<input class="ds-config-field" data-field="drilldownTarget" value="' + escAttr(panel.drilldownTarget || '') + '" placeholder="app_name/dashboard_name" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;box-sizing:border-box;margin-bottom:2px;" />';
        } else if (panel.drilldownType === 'url') {
            h += '<input class="ds-config-field" data-field="drilldownTarget" value="' + escAttr(panel.drilldownTarget || '') + '" placeholder="https://example.com?q=$click.value$" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;box-sizing:border-box;margin-bottom:2px;" />';
        } else if (panel.drilldownType === 'token') {
            h += '<div style="display:flex;gap:4px;">';
            h += '<input class="ds-config-field" data-field="drilldownToken" value="' + escAttr(panel.drilldownToken || '') + '" placeholder="token_name" style="flex:1;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;box-sizing:border-box;" />';
            h += '<input class="ds-config-field" data-field="drilldownTokenValue" value="' + escAttr(panel.drilldownTokenValue || '$click.value$') + '" placeholder="$click.value$" style="flex:1;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;font-family:monospace;box-sizing:border-box;" />';
            h += '</div>';
        }

        // Token-based visibility
        h += '<div style="margin-top:6px;">';
        h += '<label style="display:block;font-size:9px;font-weight:600;color:#F7B500;margin-bottom:4px;">Token Visibility</label>';
        h += '<div style="display:flex;gap:4px;">';
        h += '<div style="flex:1;"><label style="font-size:8px;color:#4a545e;">Show when set</label>';
        h += '<input class="ds-config-field" data-field="depends" value="' + escAttr(panel.depends || '') + '" placeholder="$token$" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;box-sizing:border-box;font-family:monospace;" /></div>';
        h += '<div style="flex:1;"><label style="font-size:8px;color:#4a545e;">Hide when set</label>';
        h += '<input class="ds-config-field" data-field="rejects" value="' + escAttr(panel.rejects || '') + '" placeholder="$token$" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;box-sizing:border-box;font-family:monospace;" /></div>';
        h += '</div>';
        h += '</div>';

        // CSS class
        h += '<div style="margin-top:6px;">';
        h += '<label style="font-size:8px;color:#4a545e;">CSS Class</label>';
        h += '<input class="ds-config-field" data-field="cssClass" value="' + escAttr(panel.cssClass || '') + '" placeholder="my-custom-panel" style="width:100%;padding:4px 6px;background:#0a0e12;border:1px solid #3c444d;border-radius:4px;color:#fff;font-size:10px;box-sizing:border-box;" />';
        h += '</div>';

        h += '</div>'; // close advanced body
        h += '</div>'; // close advanced section

        h += '<div style="font-size:9px;color:#4a545e;margin-top:6px;">Click another panel to swap. Click again to deselect.</div>';
        h += '</div>';

        // Append to body so it floats independently of the panel
        $('body').append(h);
    }

    // ========================================
    // jQuery UI Drag and Drop
    // ========================================

    function initDragDrop() {
        // Load SortableJS via RequireJS (Splunk's UMD detection routes it through AMD)
        if (window.Sortable) {
            initDragDropSortable();
        } else {
            require.config({
                paths: {
                    'sortablejs': '../app/' + TOOLKIT_APP + '/vendor/sortablejs'
                }
            });
            require(['sortablejs'], function(SortableModule) {
                window.Sortable = SortableModule;
                console.log('SIT: SortableJS loaded via RequireJS, version:', SortableModule.version);
                initDragDropSortable();
            }, function(err) {
                console.error('SIT: Failed to load SortableJS:', err);
            });
        }
    }

    function initDragDropSortable() {
        var S = window.Sortable;
        if (!S) return;

        // 1. Destroy ALL existing Sortable instances cleanly
        document.querySelectorAll('[data-sortable-id]').forEach(function(el) {
            if (el._sortableInstance) {
                el._sortableInstance.destroy();
                el._sortableInstance = null;
            }
        });

        // Refresh pending flag — defers refreshCanvas until drag fully completes
        var _refreshPending = false;

        // 2. PALETTE SECTIONS — drag items OUT as clones
        document.querySelectorAll('.sit-ds-palette-section').forEach(function(section) {
            section.setAttribute('data-sortable-id', 'palette');
            section._sortableInstance = S.create(section, {
                group: {
                    name: 'design-studio',
                    pull: 'clone',
                    put: false
                },
                sort: false,
                draggable: '.sit-ds-palette-item',
                animation: 200,
                delay: 50,
                delayOnTouchOnly: true,
                ghostClass: 'sit-ds-drag-ghost',
                chosenClass: 'sit-ds-drag-chosen',
                dragClass: 'sit-ds-drag-active',
                forceFallback: true,
                fallbackClass: 'sit-ds-drag-fallback',
                fallbackOnBody: true,
                fallbackTolerance: 3,
                onStart: function() {
                    window._dsDragHappened = true;
                    // FIX #1: Disable sidebar scroll during drag
                    var sidebar = document.querySelector('.sit-ds-sidebar');
                    if (sidebar) sidebar.style.overflowY = 'hidden';
                    // Highlight drop targets
                    document.querySelectorAll('.sit-ds-panel').forEach(function(p) {
                        p.style.outline = '2px dashed rgba(253,24,117,0.4)';
                        p.style.outlineOffset = '-2px';
                    });
                    // Highlight canvas if empty
                    var canvas = document.querySelector('.sit-ds-canvas');
                    if (canvas) canvas.style.outline = '2px dashed rgba(253,24,117,0.3)';
                },
                onEnd: function() {
                    // Restore sidebar scroll
                    var sidebar = document.querySelector('.sit-ds-sidebar');
                    if (sidebar) sidebar.style.overflowY = 'auto';
                    // Clear highlights
                    document.querySelectorAll('.sit-ds-panel').forEach(function(p) {
                        p.style.outline = '';
                        p.style.outlineOffset = '';
                    });
                    var canvas = document.querySelector('.sit-ds-canvas');
                    if (canvas) canvas.style.outline = '';
                    setTimeout(function() { window._dsDragHappened = false; }, 300);
                    // Process deferred refresh
                    if (_refreshPending) {
                        _refreshPending = false;
                        setTimeout(function() { refreshCanvas(); updateCanvasTheme(); }, 50);
                    }
                },
                onClone: function(evt) {
                    evt.clone.style.opacity = '0.3';
                }
            });
        });

        // 3. ROWS — accept drops from palette + allow panel reorder
        document.querySelectorAll('.sit-ds-row').forEach(function(row) {
            row.setAttribute('data-sortable-id', 'row');
            row._sortableInstance = S.create(row, {
                group: {
                    name: 'design-studio',
                    pull: true,
                    put: true
                },
                animation: 250,
                ghostClass: 'sit-ds-sort-placeholder',
                chosenClass: 'sit-ds-panel-dragging',
                // No handle — grab anywhere on panel to drag (filter blocks inputs)
                // handle removed so incoming palette clones aren't rejected
                draggable: '.sit-ds-panel, .sit-ds-palette-item',
                filter: 'input, textarea, select, button, .ds-delete-panel, .ds-move-panel, .ds-add-panel-to-row, .sit-ds-panel-add',
                preventOnFilter: false,
                forceFallback: true,
                fallbackOnBody: true,
                fallbackClass: 'sit-ds-drag-fallback',
                fallbackTolerance: 3,
                swapThreshold: 0.5,

                onAdd: function(evt) {
                    pushHistory();
                    var droppedEl = evt.item;
                    var type = droppedEl.getAttribute('data-type');
                    var ri = parseInt(row.getAttribute('data-row'));

                    // Use newDraggableIndex — counts only draggable children
                    // (excludes drag-handle, add-button, row-controls)
                    var dropIdx = typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : evt.newIndex;
                    console.log('SIT onAdd: dstRow=' + ri + ' dropIdx=' + dropIdx + ' type=' + type + ' isPanel=' + droppedEl.classList.contains('sit-ds-panel') + ' (raw newIndex=' + evt.newIndex + ')');

                    if (type && !droppedEl.classList.contains('sit-ds-panel')) {
                        if (droppedEl.parentNode) droppedEl.parentNode.removeChild(droppedEl);
                        if (activeRows()[ri]) {
                            var ci = Math.min(dropIdx, activeRows()[ri].columns.length);
                            if (ci < activeRows()[ri].columns.length) {
                                activeRows()[ri].columns[ci] = createPanel(type);
                            } else if (activeRows()[ri].columns.length < MAX_COLS) {
                                activeRows()[ri].columns.push(createPanel(type));
                            }
                        }
                    } else {
                        // Cross-row panel move
                        var srcRow = parseInt(droppedEl.getAttribute('data-row'));
                        var srcCol = parseInt(droppedEl.getAttribute('data-col'));
                        var dstRow = ri;
                        var dstCol = dropIdx;
                        console.log('SIT cross-row: src=' + srcRow + ':' + srcCol + ' dst=' + dstRow + ':' + dstCol + ' panel=' + (activeRows()[srcRow] && activeRows()[srcRow].columns[srcCol] ? activeRows()[srcRow].columns[srcCol].type : 'N/A'));
                        if (droppedEl.parentNode) droppedEl.parentNode.removeChild(droppedEl);

                        if (activeRows()[srcRow] && activeRows()[dstRow]) {
                            // Save reference to the panel
                            var panel = activeRows()[srcRow].columns[srcCol];
                            if (panel) {
                                // Remove from source
                                activeRows()[srcRow].columns.splice(srcCol, 1);

                                // Adjust destination row index if source row was before it
                                // and source row will be deleted (empty after splice)
                                var adjustedDstRow = dstRow;
                                if (activeRows()[srcRow].columns.length === 0 && srcRow < dstRow) {
                                    adjustedDstRow = dstRow - 1;
                                }

                                // Remove empty source row
                                if (activeRows()[srcRow].columns.length === 0) {
                                    activeRows().splice(srcRow, 1);
                                }

                                // Insert into destination (using adjusted index)
                                if (activeRows()[adjustedDstRow]) {
                                    activeRows()[adjustedDstRow].columns.splice(dstCol, 0, panel);
                                } else {
                                    // Destination row gone — create new row with this panel
                                    activeRows().push({ columns: [panel] });
                                }
                            }
                        }
                    }
                    // FIX #4: Defer refresh until after SortableJS cleanup
                    _refreshPending = true;
                },

                onUpdate: function(evt) {
                    pushHistory();
                    var ri = parseInt(row.getAttribute('data-row'));
                    if (!activeRows()[ri]) return;
                    var cols = activeRows()[ri].columns;
                    // Use oldDraggableIndex/newDraggableIndex — counts only draggable
                    // children (excludes drag-handle, add-button, row-controls)
                    var oldIdx = typeof evt.oldDraggableIndex === 'number' ? evt.oldDraggableIndex : evt.oldIndex;
                    var newIdx = typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : evt.newIndex;
                    console.log('SIT onUpdate: row=' + ri + ' oldDraggable=' + oldIdx + ' newDraggable=' + newIdx + ' cols=' + cols.length + ' (raw old=' + evt.oldIndex + ' new=' + evt.newIndex + ')');
                    if (oldIdx < 0 || oldIdx >= cols.length) {
                        console.warn('SIT onUpdate: index out of range, skipping');
                        return;
                    }
                    var moved = cols.splice(oldIdx, 1)[0];
                    if (moved) {
                        cols.splice(newIdx, 0, moved);
                        console.log('SIT onUpdate: moved panel type=' + moved.type + ' from col ' + oldIdx + ' to col ' + newIdx);
                    }
                    _refreshPending = true;
                },

                onEnd: function() {
                    // Process deferred refresh after drag fully completes
                    if (_refreshPending) {
                        _refreshPending = false;
                        setTimeout(function() { refreshCanvas(); updateCanvasTheme(); }, 50);
                    }
                }
            });
        });

        // 4. ROW CONTAINER — allow row reordering + accept palette drops on empty canvas
        var canvasEl = document.getElementById('ds-canvas');
        if (canvasEl) {
            canvasEl.setAttribute('data-sortable-id', 'canvas');
            if (canvasEl._sortableInstance) canvasEl._sortableInstance.destroy();
            canvasEl._sortableInstance = S.create(canvasEl, {
                // Only accept palette items on canvas — panels must land in rows
                group: {
                    name: 'design-studio',
                    put: function(to, from, dragEl) {
                        // Accept palette items; reject panels (they belong in rows)
                        return !dragEl.classList.contains('sit-ds-panel');
                    }
                },
                animation: 300,
                handle: '.sit-ds-row-drag-handle',
                draggable: '.sit-ds-row, .sit-ds-palette-item',  // accept rows and palette clones
                ghostClass: 'sit-ds-row-ghost',
                filter: '.sit-ds-add-row, #ds-add-row-area, #ds-col-picker, .ds-col-btn',
                preventOnFilter: false,
                forceFallback: true,
                fallbackOnBody: true,
                onAdd: function(evt) {
                    var droppedEl = evt.item;
                    var type = droppedEl.getAttribute('data-type');

                    // Safety net: if a panel somehow lands on canvas, rescue it
                    if (droppedEl.classList.contains('sit-ds-panel')) {
                        console.log('SIT canvas safety: panel landed on canvas, rescuing');
                        var srcRow = parseInt(droppedEl.getAttribute('data-row'));
                        var srcCol = parseInt(droppedEl.getAttribute('data-col'));
                        if (droppedEl.parentNode) droppedEl.parentNode.removeChild(droppedEl);

                        if (activeRows()[srcRow] && activeRows()[srcRow].columns[srcCol]) {
                            pushHistory();
                            var panel = activeRows()[srcRow].columns[srcCol];
                            activeRows()[srcRow].columns.splice(srcCol, 1);
                            // If source row is now empty, remove it
                            if (activeRows()[srcRow].columns.length === 0) {
                                activeRows().splice(srcRow, 1);
                            }
                            // Place panel in a new row at the drop position
                            var insertAt = Math.min(
                                typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : activeRows().length,
                                activeRows().length
                            );
                            activeRows().splice(insertAt, 0, { columns: [panel] });
                        }
                        _refreshPending = true;
                        return;
                    }

                    // Palette item drop on canvas
                    if (droppedEl.parentNode) droppedEl.parentNode.removeChild(droppedEl);
                    if (type) {
                        pushHistory();
                        activeRows().push({ columns: [createPanel(type)] });
                        _refreshPending = true;
                    }
                },
                onUpdate: function(evt) {
                    pushHistory();
                    var oldIdx = typeof evt.oldDraggableIndex === 'number' ? evt.oldDraggableIndex : evt.oldIndex;
                    var newIdx = typeof evt.newDraggableIndex === 'number' ? evt.newDraggableIndex : evt.newIndex;
                    var moved = activeRows().splice(oldIdx, 1)[0];
                    if (moved) activeRows().splice(newIdx, 0, moved);
                    _refreshPending = true;
                },
                onEnd: function() {
                    if (_refreshPending) {
                        _refreshPending = false;
                        setTimeout(function() { refreshCanvas(); updateCanvasTheme(); }, 50);
                    }
                }
            });
        }

        console.log('SIT Drag: ' +
            document.querySelectorAll('.sit-ds-palette-section').length + ' palettes, ' +
            document.querySelectorAll('.sit-ds-row').length + ' rows');
    }

    var defaultSearches = {
        'single':      'index=_internal | stats count',
        'chart':       'index=_internal | timechart span=1h count by sourcetype',
        'table':       'index=_internal | head 20 | table _time, sourcetype, source, host',
        'map':         'index=_internal | iplocation clientip | geostats count by sourcetype',
        'kpi-counter': 'index=_internal | stats count',
        'kpi-flip':    'index=_internal | stats count',
        'sparkline':   'index=_internal | stats count'
    };

    function createPanel(type) {
        var panel = {
            type: type || 'empty',
            title: '',
            search: defaultSearches[type] || '',
            chartType: 'line',
            htmlContent: ''
        };
        return panel;
    }

    function addRow(colCount) {
        pushHistory();
        var columns = [];
        for (var i = 0; i < colCount; i++) {
            columns.push(createPanel('empty'));
        }
        activeRows().push({ columns: columns });
        refreshCanvas();
    }

    function deleteRow(ri) {
        if (ri >= 0 && ri < activeRows().length) {
            pushHistory();
            activeRows().splice(ri, 1);
            selectedPanel = null;
            refreshCanvas();
        }
    }

    function deletePanel(ri, ci) {
        if (activeRows()[ri] && activeRows()[ri].columns[ci]) {
            pushHistory();
            // If row has more than one column, remove the panel
            if (activeRows()[ri].columns.length > 1) {
                activeRows()[ri].columns.splice(ci, 1);
            } else {
                // Last panel in row: remove the whole row
                activeRows().splice(ri, 1);
            }
            selectedPanel = null;
            refreshCanvas();
        }
    }

    var inputTypes = ['input-time', 'input-dropdown', 'input-text', 'input-multiselect'];

    function addComponent(type) {
        pushHistory();

        // Form inputs go to the form bar, not rows
        if (inputTypes.indexOf(type) !== -1) {
            var labelMap = { 'input-time': 'Time Range', 'input-dropdown': 'Filter', 'input-text': 'Search', 'input-multiselect': 'Select' };
            var tokenMap = { 'input-time': 'time', 'input-dropdown': 'filter_' + (studio.formInputs.length + 1), 'input-text': 'search_' + (studio.formInputs.length + 1), 'input-multiselect': 'multi_' + (studio.formInputs.length + 1) };
            studio.formInputs.push({ type: type, label: labelMap[type] || 'Input', token: tokenMap[type] || 'token_' + studio.formInputs.length });
            // Rebuild only canvas (not sidebar) to avoid scroll-to-top
            var $sidebar = $('#sit-design-studio .sit-ds-sidebar');
            var sidebarScroll = $sidebar.length ? $sidebar.scrollTop() : 0;
            var $canvasWrapper = $('#sit-design-studio .sit-ds-workspace');
            if ($canvasWrapper.length) {
                $canvasWrapper.find('.sit-ds-canvas, .sit-ds-page-tabs').remove();
                $canvasWrapper.append(renderCanvas());
                updateCanvasTheme();
                initDragDrop();
            }
            if ($sidebar.length) {
                $sidebar.replaceWith(renderSidebar());
                $('#sit-design-studio .sit-ds-sidebar').scrollTop(sidebarScroll);
            }
            showToast('Added ' + (labelMap[type] || type), 'success');
            return;
        }

        // 1. If a panel is selected and it's empty, replace it
        if (selectedPanel) {
            var sp = activeRows()[selectedPanel.rowIdx];
            if (sp && sp.columns[selectedPanel.colIdx] && sp.columns[selectedPanel.colIdx].type === 'empty') {
                sp.columns[selectedPanel.colIdx] = createPanel(type);
                selectedPanel = null;
                refreshCanvas();
                return;
            }
        }

        // 2. Find the first empty panel in any row
        for (var r = 0; r < activeRows().length; r++) {
            for (var c = 0; c < activeRows()[r].columns.length; c++) {
                if (activeRows()[r].columns[c].type === 'empty') {
                    activeRows()[r].columns[c] = createPanel(type);
                    refreshCanvas();
                    return;
                }
            }
        }

        // 3. Find the last row with room (< MAX_COLS) and add a new column
        if (activeRows().length > 0) {
            var lastRow = activeRows()[activeRows().length - 1];
            if (lastRow.columns.length < MAX_COLS) {
                lastRow.columns.push(createPanel(type));
                refreshCanvas();
                return;
            }
        }

        // 4. Create a new row with this one panel
        activeRows().push({ columns: [createPanel(type)] });
        refreshCanvas();
    }

    function refreshCanvas() {
        var $canvas = $('#ds-canvas');
        if ($canvas.length === 0) {
            render();
            return;
        }

        // Rebuild just the canvas content
        var h = '';
        if (activeRows().length === 0) {
            h += renderEmptyCanvasWithTemplates();
        } else {
            activeRows().forEach(function(row, ri) {
                h += renderRow(row, ri);
            });
        }

        if (!previewMode) {
            h += '<div id="ds-add-row-area" style="margin-top:8px;padding:8px 0;display:flex;gap:6px;justify-content:center;align-items:center;border-top:1px dashed #2b3033;">';
            h += '<button class="sit-ds-add-row" id="ds-add-row" style="font-size:11px;padding:6px 14px;">' + svgIcon('plus', 12) + ' Row</button>';
            h += '<div id="ds-col-picker" style="display:none;margin-left:8px;">';
            h += '<span style="font-size:10px;color:#4a545e;margin-right:4px;">Columns:</span>';
            for (var c = 1; c <= 4; c++) {
                h += '<button class="sit-ds-btn sit-ds-btn-secondary ds-col-btn" data-cols="' + c + '" style="margin:0 2px;min-width:28px;padding:4px 8px;font-size:11px;">' + c + '</button>';
            }
            h += '</div>';
            h += '</div>';
        }

        $canvas.html(h);
        initDragDrop();
    }

    // ========================================
    // Code Generation - Simple XML
    // ========================================

    function generateSimpleXML() {
        var lines = [];

        // Opening <dashboard> tag
        var dashAttrs = ' version="1.1"';

        var cssRefs = [];
        var jsRefs = [];

        // Theme
        if (studio.theme) {
            cssRefs.push(TOOLKIT_APP + ':themes/' + studio.theme + '.css');
        }

        // Background
        if (studio.background) {
            var bgConf = backgrounds.filter(function(b) { return b.value === studio.background; })[0];
            if (bgConf && bgConf.type === 'js') {
                jsRefs.push(TOOLKIT_APP + ':backgrounds/' + studio.background + '.js');
            } else {
                cssRefs.push(TOOLKIT_APP + ':backgrounds/' + studio.background + '.css');
            }
            // Always include background-helper when a background is selected
            if (jsRefs.indexOf(TOOLKIT_APP + ':backgrounds/background-helper.js') === -1) {
                jsRefs.push(TOOLKIT_APP + ':backgrounds/background-helper.js');
            }
        }

        // Check if any widgets are used; if so, include their JS refs
        var usedWidgets = {};
        activeRows().forEach(function(row) {
            row.columns.forEach(function(panel) {
                if (widgetTypes.indexOf(panel.type) !== -1) {
                    usedWidgets[panel.type] = true;
                }
            });
        });

        // widgetJsMap is defined at top scope

        Object.keys(usedWidgets).forEach(function(wt) {
            var ref = widgetJsMap[wt];
            if (ref) {
                var fullRef = TOOLKIT_APP + ':' + ref;
                if (ref.indexOf('.js') !== -1 && jsRefs.indexOf(fullRef) === -1) {
                    jsRefs.push(fullRef);
                } else if (ref.indexOf('.css') !== -1 && cssRefs.indexOf(fullRef) === -1) {
                    cssRefs.push(fullRef);
                }
            }
        });

        // KPI Style
        if (studio.kpiStyle) {
            cssRefs.push(TOOLKIT_APP + ':widgets/' + studio.kpiStyle + '.css');
        }

        // Table Style
        if (studio.tableStyle) {
            cssRefs.push(TOOLKIT_APP + ':visualizations/' + studio.tableStyle + '.css');
        }

        // Animations
        studio.animations.forEach(function(a) {
            var conf = enhancements.animations.filter(function(x) { return x.value === a; })[0];
            if (conf && conf.type === 'js') {
                jsRefs.push(TOOLKIT_APP + ':animations/' + a + '.js');
            } else {
                cssRefs.push(TOOLKIT_APP + ':animations/' + a + '.css');
            }
        });

        // Controls (toggles)
        studio.controls.forEach(function(c) {
            jsRefs.push(TOOLKIT_APP + ':toggles/' + c + '.js');
        });

        // KPI Effects (JS widgets that enhance single values)
        studio.kpiEffects.forEach(function(k) {
            jsRefs.push(TOOLKIT_APP + ':widgets/' + k + '.js');
        });

        // Dashboard Extras (JS enhancements)
        studio.dashExtras.forEach(function(d) {
            jsRefs.push(TOOLKIT_APP + ':widgets/' + d + '.js');
        });

        // UI Framework
        studio.uiFramework.forEach(function(u) {
            var conf = enhancements.uiFramework.filter(function(x) { return x.value === u; })[0];
            var paths = u.split(',');
            paths.forEach(function(p) {
                p = p.trim();
                var fullRef = TOOLKIT_APP + ':' + p;
                if (conf && conf.type === 'js') {
                    if (jsRefs.indexOf(fullRef) === -1) jsRefs.push(fullRef);
                } else {
                    if (cssRefs.indexOf(fullRef) === -1) cssRefs.push(fullRef);
                }
            });
        });

        // Always include panel polish CSS (makes live dashboards match the preview)
        var polishRef = TOOLKIT_APP + ':css/sit-panel-polish.css';
        if (cssRefs.indexOf(polishRef) === -1) cssRefs.unshift(polishRef);
        var textRef = TOOLKIT_APP + ':css/sit-text-whitelist.css';
        if (cssRefs.indexOf(textRef) === -1) cssRefs.push(textRef);

        // Always include the Remix button so users can edit this dashboard later
        var remixRef = TOOLKIT_APP + ':js/sit-remix-button.js';
        if (jsRefs.indexOf(remixRef) === -1) jsRefs.push(remixRef);

        if (cssRefs.length > 0) {
            dashAttrs += '\n  stylesheet="' + cssRefs.join(',\n             ') + '"';
        }
        if (jsRefs.length > 0) {
            dashAttrs += '\n  script="' + jsRefs.join(',\n          ') + '"';
        }

        var rootTag = studio.formInputs.length > 0 ? 'form' : 'dashboard';
        lines.push('<' + rootTag + dashAttrs + '>');
        lines.push('  <label>' + escXml(studio.title) + '</label>');
        if (studio.description) {
            lines.push('  <description>' + escXml(studio.description) + '</description>');
        }

        // Auto-refresh interval (if non-default)
        if (studio._refreshInterval && studio._refreshInterval !== '300' && studio.controls.indexOf('auto-refresh-countdown') > -1) {
            lines.push('  <!-- Auto-refresh interval: ' + studio._refreshInterval + 's -->');
            lines.push('  <row><panel><html><div data-sit-refresh-interval="' + escXml(studio._refreshInterval) + '" style="display:none">&#160;</div></html></panel></row>');
        }

        // Text color preset → inline CSS override
        if (studio.textColorPreset) {
            var presets = themeTextPresets[studio.theme] || [];
            var preset = presets.filter(function(p) { return p.value === studio.textColorPreset; })[0];
            if (preset && preset.title) {
                lines.push('');
                lines.push('  <!-- Text color preset: ' + escXml(preset.label) + ' -->');
                lines.push('  <row>');
                lines.push('    <panel>');
                lines.push('      <html>');
                lines.push('        <style>');
                lines.push('          .dashboard-body .panel-head h3 { color: ' + preset.title + ' !important; }');
                lines.push('          .dashboard-body .panel-body { color: ' + preset.body + ' !important; }');
                lines.push('          .dashboard-body .single-value .single-result .result-number { color: ' + preset.title + ' !important; }');
                lines.push('          .dashboard-body .single-value .single-result .under-label { color: ' + preset.muted + ' !important; }');
                lines.push('          .dashboard-body table.table-chrome > thead > tr > th { color: ' + preset.title + ' !important; }');
                lines.push('          .dashboard-body table.table-chrome > tbody > tr > td { color: ' + preset.body + ' !important; }');
                lines.push('          .dashboard-body .highcharts-axis-labels text { fill: ' + preset.muted + ' !important; }');
                lines.push('          .dashboard-body .highcharts-legend-item text { fill: ' + preset.body + ' !important; color: ' + preset.body + ' !important; }');
                lines.push('          .dashboard-body .fieldset label { color: ' + preset.muted + ' !important; }');
                lines.push('          .dashboard-header h2 { color: ' + preset.title + ' !important; }');
                lines.push('          .dashboard-header p.description { color: ' + preset.muted + ' !important; }');
                lines.push('        </style>');
                lines.push('      </html>');
                lines.push('    </panel>');
                lines.push('  </row>');
            }
        }

        // Form inputs → <fieldset>
        if (studio.formInputs.length > 0) {
            lines.push('');
            lines.push('  <fieldset submitButton="false" autoRun="true">');
            studio.formInputs.forEach(function(inp) {
                if (inp.type === 'input-time') {
                    lines.push('    <input type="time" token="' + escXml(inp.token) + '" searchWhenChanged="true">');
                    lines.push('      <label>' + escXml(inp.label) + '</label>');
                    lines.push('      <default>');
                    lines.push('        <earliest>-24h@h</earliest>');
                    lines.push('        <latest>now</latest>');
                    lines.push('      </default>');
                    lines.push('    </input>');
                } else if (inp.type === 'input-dropdown') {
                    lines.push('    <input type="dropdown" token="' + escXml(inp.token) + '" searchWhenChanged="true">');
                    lines.push('      <label>' + escXml(inp.label) + '</label>');
                    lines.push('      <choice value="*">All</choice>');
                    lines.push('      <default>*</default>');
                    lines.push('    </input>');
                } else if (inp.type === 'input-text') {
                    lines.push('    <input type="text" token="' + escXml(inp.token) + '" searchWhenChanged="true">');
                    lines.push('      <label>' + escXml(inp.label) + '</label>');
                    lines.push('      <default>*</default>');
                    lines.push('    </input>');
                } else if (inp.type === 'input-multiselect') {
                    lines.push('    <input type="multiselect" token="' + escXml(inp.token) + '" searchWhenChanged="true">');
                    lines.push('      <label>' + escXml(inp.label) + '</label>');
                    lines.push('      <choice value="*">All</choice>');
                    lines.push('      <default>*</default>');
                    lines.push('      <delimiter> OR </delimiter>');
                    lines.push('    </input>');
                }
            });
            lines.push('  </fieldset>');
        }

        // Auto-include tab-navigation when multiple pages exist
        if (studio.pages.length > 1) {
            var tabRef = TOOLKIT_APP + ':toggles/tab-navigation.js';
            if (jsRefs.indexOf(tabRef) === -1) jsRefs.push(tabRef);
        }

        // Rows — iterate ALL pages
        var allPages = studio.pages.length > 0 ? studio.pages : [{ name: 'Page 1', rows: activeRows() }];
        allPages.forEach(function(page, pageIdx) {
            // For multi-page: first row of each page gets a marker panel
            // that tab-navigation.js reads to group rows into tabs
            if (allPages.length > 1) {
                lines.push('');
                lines.push('  <!-- ========== ' + escXml(page.name) + ' ========== -->');
            }

            page.rows.forEach(function(row, rowIdx) {
                lines.push('');
                lines.push('  <row>');

                // Page group marker (first row of each page in multi-page dashboards)
                if (rowIdx === 0 && allPages.length > 1) {
                    lines.push('    <panel>');
                    lines.push('      <html><div data-sit-page="' + escXml(page.name) + '"></div></html>');
                    lines.push('    </panel>');
                }

            row.columns.forEach(function(panel, pi) {
                var panelAttrs = '';
                // Hide-by-value: auto-generate depends token
                var hideToken = '';
                if (panel.hideCondField && panel.hideCondOp) {
                    hideToken = '$show_panel_' + ri + '_' + pi + '$';
                    if (!panel.depends) {
                        panelAttrs += ' depends="' + escXml(hideToken) + '"';
                    }
                }
                if (panel.depends) panelAttrs += ' depends="' + escXml(panel.depends) + '"';
                if (panel.rejects) panelAttrs += ' rejects="' + escXml(panel.rejects) + '"';
                lines.push('    <panel' + panelAttrs + '>');

                if (panel.title) {
                    lines.push('      <title>' + escXml(panel.title) + '</title>');
                }

                // Hide-by-value: generate a search that controls the token
                if (hideToken && panel.search) {
                    var condField = escXml(panel.hideCondField);
                    var condVal = escXml(panel.hideCondValue || '0');
                    var condOp = panel.hideCondOp || 'less_than';
                    // Build the eval expression for the condition
                    var evalExpr = '';
                    if (condOp === 'equals') evalExpr = condField + '="' + condVal + '"';
                    else if (condOp === 'not_equals') evalExpr = condField + '!="' + condVal + '"';
                    else if (condOp === 'less_than') evalExpr = condField + '&lt;' + condVal;
                    else if (condOp === 'greater_than') evalExpr = condField + '&gt;' + condVal;
                    else if (condOp === 'less_equal') evalExpr = condField + '&lt;=' + condVal;
                    else if (condOp === 'greater_equal') evalExpr = condField + '&gt;=' + condVal;
                    else if (condOp === 'contains') evalExpr = 'like(' + condField + ', "%' + condVal + '%")';
                    else if (condOp === 'is_empty') evalExpr = 'isnull(' + condField + ') OR ' + condField + '=""';

                    // Use the panel's own search + eval to determine visibility
                    var tokenName = 'show_panel_' + ri + '_' + pi;
                    lines.push('      <!-- Hide-by-value: hide when ' + condField + ' ' + condOp.replace(/_/g, ' ') + ' ' + condVal + ' -->');
                    lines.push('      <search>');
                    lines.push('        <query>' + escXml(panel.search) + ' | eval _sit_hide=if(' + evalExpr + ', 1, 0) | fields _sit_hide</query>');
                    lines.push('        <earliest>$time.earliest$</earliest>');
                    lines.push('        <latest>$time.latest$</latest>');
                    lines.push('        <done>');
                    lines.push('          <condition match="$result._sit_hide$==&quot;0&quot;">');
                    lines.push('            <set token="' + tokenName + '">true</set>');
                    lines.push('          </condition>');
                    lines.push('          <condition>');
                    lines.push('            <unset token="' + tokenName + '"></unset>');
                    lines.push('          </condition>');
                    lines.push('        </done>');
                    lines.push('      </search>');
                }

                if (panel.type === 'single') {
                    lines.push('      <single>');
                    lines.push(generateSearchXML(panel.search));
                    if (panel.drilldownType) lines.push(generateDrilldownXML(panel));
                    lines.push('      </single>');
                } else if (panel.type === 'chart') {
                    lines.push('      <chart>');
                    lines.push(generateSearchXML(panel.search));
                    lines.push('        <option name="charting.chart">' + escXml(panel.chartType || 'line') + '</option>');
                    if (panel.drilldownType) lines.push(generateDrilldownXML(panel));
                    lines.push('      </chart>');
                } else if (panel.type === 'table') {
                    lines.push('      <table>');
                    lines.push(generateSearchXML(panel.search));
                    if (panel.drilldownType) lines.push(generateDrilldownXML(panel));
                    lines.push('      </table>');
                } else if (panel.type === 'map') {
                    lines.push('      <map>');
                    lines.push(generateSearchXML(panel.search));
                    lines.push('        <option name="mapping.type">marker</option>');
                    if (panel.drilldownType) lines.push(generateDrilldownXML(panel));
                    lines.push('      </map>');
                } else if (panel.type === 'html') {
                    lines.push('      <html>' + (panel.htmlContent || '<p>Custom HTML content</p>') + '</html>');
                } else if (panel.type === 'spacer') {
                    lines.push('      <html><div style="height:40px;">&#160;</div></html>');
                } else if (panel.type === 'clock') {
                    lines.push('      <html><div class="world-clock" data-format="12h" data-timezone="local">&#160;</div></html>');
                } else if (panel.type === 'countdown') {
                    lines.push('      <html><div class="countdown-widget" data-countdown-date="' + getDefaultCountdownTarget() + '" data-label="Countdown">&#160;</div></html>');
                } else if (panel.type === 'gauge-speed') {
                    lines.push('      <html><div class="gauge-speedometer" data-value="72" data-max="100" data-label="Speed">&#160;</div></html>');
                } else if (panel.type === 'gauge-liquid') {
                    lines.push('      <html><div class="gauge-liquid-fill" data-value="65" data-max="100" data-label="Capacity">&#160;</div></html>');
                } else if (panel.type === 'traffic-lights') {
                    lines.push('      <html><div class="sit-traffic-light" data-status="green" data-label="System Status">&#160;</div></html>');
                } else if (panel.type === 'qr-code') {
                    lines.push('      <html><div class="qr-inline" data-value="https://splunk.com" data-label="Scan Me">&#160;</div></html>');
                } else if (panel.type === 'team-board') {
                    lines.push('      <html><div class="team-board" data-title="Team Status" data-layout="grid"><div class="team-member" data-name="Alice" data-role="Lead" data-status="online">&#160;</div><div class="team-member" data-name="Bob" data-role="Engineer" data-status="busy">&#160;</div><div class="team-member" data-name="Carol" data-role="Analyst" data-status="offline">&#160;</div></div></html>');
                } else if (panel.type === 'weather') {
                    lines.push('      <html><div class="weather-widget" data-city="San Francisco" data-condition="sunny" data-temp="72" data-unit="F">&#160;</div></html>');
                } else if (panel.type === 'kpi-progress') {
                    lines.push('      <html><div class="progress-ring" data-progress-max="100" style="text-align:center;padding:20px;"><div style="font-size:36px;font-weight:700;">75%</div><div style="font-size:12px;color:#888;">Progress</div></div></html>');
                } else if (panel.type === 'kpi-counter') {
                    lines.push('      <single>');
                    lines.push(generateSearchXML(panel.search));
                    lines.push('      </single>');
                } else if (panel.type === 'kpi-flip') {
                    lines.push('      <single>');
                    lines.push(generateSearchXML(panel.search));
                    lines.push('      </single>');
                } else if (panel.type === 'sparkline') {
                    lines.push('      <single>');
                    lines.push(generateSearchXML(panel.search));
                    lines.push('      </single>');
                } else if (panel.type === 'network-map') {
                    lines.push('      <html><div id="network-map-' + panel.title.replace(/[^a-z0-9]/gi, '') + '" data-viz="network-map" style="width:100%;height:400px;">&#160;</div></html>');
                } else if (panel.type === 'globe') {
                    lines.push('      <html><div id="globe-3d-' + panel.title.replace(/[^a-z0-9]/gi, '') + '" data-viz="globe-3d" data-auto-rotate="true" style="width:100%;height:400px;">&#160;</div></html>');
                } else if (panel.type === 'heatmap') {
                    lines.push('      <html><div id="heatmap-calendar-1" data-viz="heatmap-calendar" data-color-scheme="green" data-label="Activity" style="width:100%;height:200px;">&#160;</div></html>');
                } else if (panel.type === 'kanban') {
                    lines.push('      <html><div id="kanban-board-1" data-viz="kanban-board" style="width:100%;min-height:400px;">&#160;</div></html>');
                } else if (panel.type === 'org-chart') {
                    lines.push('      <html><div id="org-chart-1" data-viz="org-chart" style="width:100%;height:400px;">&#160;</div></html>');
                } else if (panel.type === 'terminal') {
                    lines.push('      <html><div id="terminal-log-1" data-viz="terminal-log" data-title="System Logs" data-theme="green" data-auto-scroll="true" style="width:100%;height:300px;">&#160;</div></html>');
                } else if (panel.type === 'timeline') {
                    lines.push('      <html><div id="timeline-gantt-1" data-viz="timeline-gantt" style="width:100%;height:300px;">&#160;</div></html>');
                } else {
                    // Empty / unknown
                    lines.push('      <html><div style="padding:20px;text-align:center;color:#6c757d;">Empty Panel</div></html>');
                }

                // (drilldown is inserted inside viz elements via generateDrilldownXML)

                lines.push('    </panel>');
            });

            lines.push('  </row>');
            }); // end page.rows
        }); // end allPages

        lines.push('');
        lines.push('</' + rootTag + '>');
        return lines.join('\n');
    }

    function generateDrilldownXML(panel) {
        if (!panel.drilldownType) return '';
        var lines = [];
        lines.push('        <drilldown>');
        if (panel.drilldownType === 'dashboard') {
            var target = panel.drilldownTarget || '';
            var parts = target.split('/');
            var app = parts.length > 1 ? parts[0] : 'search';
            var dash = parts.length > 1 ? parts[1] : parts[0];
            lines.push('          <link target="_blank">/app/' + escXml(app) + '/' + escXml(dash) + '?form.value=$click.value$</link>');
        } else if (panel.drilldownType === 'url') {
            lines.push('          <link target="_blank">' + escXml(panel.drilldownTarget || '') + '</link>');
        } else if (panel.drilldownType === 'token') {
            lines.push('          <set token="' + escXml(panel.drilldownToken || 'drilldown_value') + '">' + escXml(panel.drilldownTokenValue || '$click.value$') + '</set>');
        }
        lines.push('        </drilldown>');
        return '\n' + lines.join('\n');
    }

    function generateSearchXML(search) {
        var query = search || '| makeresults | eval placeholder="Replace with your SPL query"';
        var lines = [];
        lines.push('        <search>');
        lines.push('          <query>' + escXml(query) + '</query>');
        lines.push('          <earliest>-24h@h</earliest>');
        lines.push('          <latest>now</latest>');
        lines.push('        </search>');
        return lines.join('\n');
    }

    function getDefaultCountdownTarget() {
        // Default to midnight tomorrow
        var d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0] + 'T00:00:00';
    }

    // ========================================
    // Code Generation - Dashboard Studio JSON
    // ========================================

    function generateDashboardStudioJSON() {
        var vizIndex = 0;
        var dsIndex = 0;
        var visualizations = {};
        var dataSources = {};
        var layoutItems = [];

        // Iterate ALL pages for JSON generation
        var allRows = [];
        studio.pages.forEach(function(page) { allRows = allRows.concat(page.rows); });

        allRows.forEach(function(row, ri) {
            var rowItems = [];

            row.columns.forEach(function(panel, ci) {
                var vizId = 'viz_' + vizIndex;
                var dsId = 'ds_' + dsIndex;
                vizIndex++;
                dsIndex++;

                if (panel.type === 'single' || panel.type === 'kpi-counter' || panel.type === 'kpi-flip' || panel.type === 'sparkline') {
                    dataSources[dsId] = {
                        type: 'ds.search',
                        options: {
                            query: panel.search || '| makeresults | eval count=0',
                            queryParameters: { earliest: '-24h@h', latest: 'now' }
                        }
                    };
                    visualizations[vizId] = {
                        type: 'splunk.singlevalue',
                        title: panel.title || '',
                        dataSources: { primary: dsId }
                    };
                } else if (panel.type === 'chart') {
                    var chartMapping = {
                        'line': 'splunk.line',
                        'bar': 'splunk.bar',
                        'area': 'splunk.area',
                        'pie': 'splunk.pie',
                        'column': 'splunk.column'
                    };
                    dataSources[dsId] = {
                        type: 'ds.search',
                        options: {
                            query: panel.search || '| makeresults count=10 | streamstats count',
                            queryParameters: { earliest: '-24h@h', latest: 'now' }
                        }
                    };
                    visualizations[vizId] = {
                        type: chartMapping[panel.chartType] || 'splunk.line',
                        title: panel.title || '',
                        dataSources: { primary: dsId }
                    };
                } else if (panel.type === 'table') {
                    dataSources[dsId] = {
                        type: 'ds.search',
                        options: {
                            query: panel.search || '| makeresults | eval placeholder="data"',
                            queryParameters: { earliest: '-24h@h', latest: 'now' }
                        }
                    };
                    visualizations[vizId] = {
                        type: 'splunk.table',
                        title: panel.title || '',
                        dataSources: { primary: dsId }
                    };
                } else if (panel.type === 'map') {
                    dataSources[dsId] = {
                        type: 'ds.search',
                        options: {
                            query: panel.search || '| makeresults | eval lat=37.7749, lon=-122.4194',
                            queryParameters: { earliest: '-24h@h', latest: 'now' }
                        }
                    };
                    visualizations[vizId] = {
                        type: 'splunk.choropleth.svg',
                        title: panel.title || '',
                        dataSources: { primary: dsId }
                    };
                } else if (panel.type === 'html') {
                    visualizations[vizId] = {
                        type: 'splunk.markdown',
                        options: {
                            markdown: panel.htmlContent || 'Custom HTML content'
                        },
                        title: panel.title || ''
                    };
                } else if (panel.type === 'spacer') {
                    visualizations[vizId] = {
                        type: 'splunk.markdown',
                        options: { markdown: '' },
                        title: ''
                    };
                } else if (widgetTypes.indexOf(panel.type) !== -1) {
                    // Widgets become markdown panels with note about requiring classic
                    var widgetNote = {
                        'clock':          'Real-Time Clock (requires Classic Simple XML with Toolkit JS)',
                        'countdown':      'Countdown Timer (requires Classic Simple XML with Toolkit JS)',
                        'gauge-speed':    'Speedometer Gauge (requires Classic Simple XML with Toolkit JS)',
                        'gauge-liquid':   'Liquid Fill Gauge (requires Classic Simple XML with Toolkit JS)',
                        'traffic-lights': 'Traffic Light Status (requires Classic Simple XML with Toolkit CSS)',
                        'qr-code':        'QR Code Generator (requires Classic Simple XML with Toolkit JS)',
                        'team-board':     'Team Status Board (requires Classic Simple XML with Toolkit JS)',
                        'weather':        'Weather Widget (requires Classic Simple XML with Toolkit JS)',
                        'kpi-progress':   'Circular Progress (requires Classic Simple XML with Toolkit JS)',
                        'kpi-counter':    'Animated Counter (requires Classic Simple XML with Toolkit JS)',
                        'kpi-flip':       'KPI 3D Flip Card (requires Classic Simple XML with Toolkit JS)',
                        'sparkline':      'Sparkline Inline (requires Classic Simple XML with Toolkit JS)',
                        'network-map':    'Network Map (requires Classic Simple XML with Toolkit JS)',
                        'globe':          '3D Globe (requires Classic Simple XML with Toolkit JS)',
                        'heatmap':        'Heatmap Calendar (requires Classic Simple XML with Toolkit JS)',
                        'kanban':         'Kanban Board (requires Classic Simple XML with Toolkit JS)',
                        'org-chart':      'Org Chart (requires Classic Simple XML with Toolkit JS)',
                        'terminal':       'Terminal Log Viewer (requires Classic Simple XML with Toolkit JS)',
                        'timeline':       'Timeline / Gantt (requires Classic Simple XML with Toolkit JS)'
                    };
                    visualizations[vizId] = {
                        type: 'splunk.markdown',
                        options: {
                            markdown: '> **Widget:** ' + (widgetNote[panel.type] || panel.type)
                        },
                        title: panel.title || ''
                    };
                } else {
                    // Empty panel
                    visualizations[vizId] = {
                        type: 'splunk.markdown',
                        options: { markdown: 'Empty Panel' },
                        title: panel.title || ''
                    };
                }

                rowItems.push({ type: 'block', item: vizId, width: Math.floor(1200 / row.columns.length) });
            });

            layoutItems.push({
                type: 'row',
                items: rowItems
            });
        });

        var output = {
            visualizations: visualizations,
            dataSources: dataSources,
            inputs: {},
            layout: {
                type: 'absolute',
                globalInputs: [],
                structure: layoutItems
            },
            title: studio.title,
            description: studio.description || 'Built with Innovators Toolkit'
        };

        return JSON.stringify(output, null, 2);
    }

    // ========================================
    // Custom Templates
    // ========================================

    var CUSTOM_TEMPLATES_KEY = 'sit_ds_custom_templates';

    function getCustomTemplates() {
        try { return JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) || '[]'); } catch(e) { return []; }
    }

    function saveCustomTemplate(name) {
        var templates = getCustomTemplates();
        var snapshot = {
            name: name,
            created: new Date().toISOString(),
            theme: studio.theme,
            background: studio.background,
            kpiStyle: studio.kpiStyle,
            tableStyle: studio.tableStyle,
            animations: studio.animations.slice(),
            controls: studio.controls.slice(),
            kpiEffects: studio.kpiEffects.slice(),
            dashExtras: studio.dashExtras.slice(),
            uiFramework: studio.uiFramework.slice(),
            formInputs: JSON.parse(JSON.stringify(studio.formInputs)),
            pages: JSON.parse(JSON.stringify(studio.pages))
        };
        templates.push(snapshot);
        try { localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates)); } catch(e) {}
        return snapshot;
    }

    function loadCustomTemplate(index) {
        var templates = getCustomTemplates();
        var tmpl = templates[index];
        if (!tmpl) return;
        pushHistory();
        studio.theme = tmpl.theme || '';
        studio.background = tmpl.background || '';
        studio.kpiStyle = tmpl.kpiStyle || '';
        studio.tableStyle = tmpl.tableStyle || '';
        studio.animations = tmpl.animations || [];
        studio.controls = tmpl.controls || [];
        studio.kpiEffects = tmpl.kpiEffects || [];
        studio.dashExtras = tmpl.dashExtras || [];
        studio.uiFramework = tmpl.uiFramework || [];
        studio.formInputs = tmpl.formInputs ? JSON.parse(JSON.stringify(tmpl.formInputs)) : [];
        studio.pages = tmpl.pages ? JSON.parse(JSON.stringify(tmpl.pages)) : [{ name: 'Page 1', rows: [] }];
        studio.activePage = 0;
        render();
        updateCanvasTheme();
        showToast('Template loaded: ' + tmpl.name, 'success');
    }

    function showSaveTemplateModal() {
        var $backdrop = $('<div class="sit-ds-export-modal">');
        var $content = $('<div class="sit-ds-export-content" style="max-width:480px;">');
        var h = '<div class="sit-ds-export-header"><h3>Save as Template</h3>';
        h += '<button class="sit-ds-panel-action-btn ds-tmpl-close" style="width:32px;height:32px;font-size:18px;">&times;</button></div>';
        h += '<div class="sit-ds-export-body">';
        h += '<p style="font-size:12px;color:#a0a0a0;margin:0 0 12px;">Save your current design as a reusable template. Includes layout, theme, background, effects, and form inputs.</p>';
        h += '<input id="ds-tmpl-name" type="text" value="' + escAttr(studio.title) + '" placeholder="Template name" style="width:100%;padding:10px 12px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:14px;margin-bottom:12px;box-sizing:border-box;font-family:inherit;outline:none;" />';
        h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-tmpl-save" style="width:100%;justify-content:center;padding:10px;margin-bottom:16px;">' + svgIcon('check-circle', 14) + ' Save Template</button>';

        // Existing custom templates
        var customs = getCustomTemplates();
        if (customs.length > 0) {
            h += '<div style="border-top:1px solid #2b3033;padding-top:12px;">';
            h += '<div style="font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:8px;">Your Templates (' + customs.length + ')</div>';
            customs.forEach(function(t, i) {
                h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border:1px solid #2b3033;border-radius:6px;margin-bottom:4px;background:#0a0e12;">';
                h += '<div><div style="font-size:12px;color:#e0e0e0;font-weight:500;">' + esc(t.name) + '</div>';
                h += '<div style="font-size:9px;color:#4a545e;">' + (t.theme || 'No theme') + ' &middot; ' + (t.pages ? t.pages.length : 1) + ' page(s)</div></div>';
                h += '<div style="display:flex;gap:4px;">';
                h += '<button class="ds-tmpl-load" data-idx="' + i + '" style="background:#17A2B8;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:9px;font-weight:600;cursor:pointer;">Load</button>';
                h += '<button class="ds-tmpl-export" data-idx="' + i + '" style="background:#5CC05C;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:9px;font-weight:600;cursor:pointer;">Share</button>';
                h += '<button class="ds-tmpl-delete" data-idx="' + i + '" style="background:#DC3545;color:#fff;border:none;border-radius:4px;padding:3px 8px;font-size:9px;font-weight:600;cursor:pointer;">Del</button>';
                h += '</div></div>';
            });
            h += '</div>';
        }

        // Import from JSON
        h += '<div style="border-top:1px solid #2b3033;padding-top:12px;margin-top:12px;">';
        h += '<div style="font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:6px;">Import Shared Template</div>';
        h += '<textarea id="ds-tmpl-import-json" rows="3" placeholder="Paste template JSON here..." style="width:100%;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:10px;font-family:monospace;padding:8px;box-sizing:border-box;margin-bottom:6px;resize:vertical;"></textarea>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-tmpl-import" style="width:100%;justify-content:center;padding:8px;font-size:11px;">' + svgIcon('upload', 12) + ' Import Template</button>';
        h += '</div>';

        h += '</div>';
        $content.html(h);
        $backdrop.append($content);
        $('body').append($backdrop);
        requestAnimationFrame(function() { $backdrop.css('opacity', '1'); });

        function closeModal() { $backdrop.css('opacity', '0'); setTimeout(function() { $backdrop.remove(); }, 300); }
        $backdrop.on('click', '.ds-tmpl-close', closeModal);
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) closeModal(); });

        // Save
        $backdrop.on('click', '#ds-tmpl-save', function() {
            var name = $('#ds-tmpl-name').val().trim();
            if (!name) { showToast('Enter a template name', 'warning'); return; }
            saveCustomTemplate(name);
            closeModal();
            showToast('Template saved: ' + name, 'success');
        });

        // Load
        $backdrop.on('click', '.ds-tmpl-load', function() {
            loadCustomTemplate(parseInt($(this).data('idx')));
            closeModal();
        });

        // Export as JSON (share)
        $backdrop.on('click', '.ds-tmpl-export', function() {
            var idx = parseInt($(this).data('idx'));
            var templates = getCustomTemplates();
            if (templates[idx]) {
                var json = JSON.stringify(templates[idx], null, 2);
                copyToClipboard(json, function() {
                    showToast('Template JSON copied to clipboard! Share it with others.', 'success');
                });
            }
        });

        // Delete
        $backdrop.on('click', '.ds-tmpl-delete', function() {
            var idx = parseInt($(this).data('idx'));
            var templates = getCustomTemplates();
            templates.splice(idx, 1);
            try { localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates)); } catch(e) {}
            closeModal();
            showToast('Template deleted', 'info');
        });

        // Import from JSON
        $backdrop.on('click', '#ds-tmpl-import', function() {
            var json = $('#ds-tmpl-import-json').val().trim();
            if (!json) { showToast('Paste template JSON first', 'warning'); return; }
            try {
                var tmpl = JSON.parse(json);
                if (!tmpl.name || !tmpl.pages) throw new Error('Invalid template format');
                var templates = getCustomTemplates();
                templates.push(tmpl);
                localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
                closeModal();
                showToast('Template imported: ' + tmpl.name, 'success');
            } catch(e) {
                showToast('Invalid JSON: ' + e.message, 'error');
            }
        });
    }

    // ========================================
    // Version History
    // ========================================

    var VERSION_HISTORY_KEY = 'sit_ds_version_history';
    var MAX_VERSIONS = 20;

    function saveVersionHistory(app, dash, xmlContent) {
        try {
            var history = JSON.parse(localStorage.getItem(VERSION_HISTORY_KEY) || '[]');
            history.unshift({
                app: app,
                dashboard: dash,
                xml: xmlContent,
                timestamp: new Date().toISOString(),
                label: app + '/' + dash
            });
            // Keep only last MAX_VERSIONS
            if (history.length > MAX_VERSIONS) history = history.slice(0, MAX_VERSIONS);
            localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('SIT: Could not save version history:', e);
        }
    }

    function getVersionHistory() {
        try {
            return JSON.parse(localStorage.getItem(VERSION_HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function showVersionHistoryModal() {
        var versions = getVersionHistory();

        var $backdrop = $('<div class="sit-ds-export-modal">');
        var $content = $('<div class="sit-ds-export-content" style="max-width:640px;">');

        var h = '<div class="sit-ds-export-header">';
        h += '<h3>Version History</h3>';
        h += '<button class="sit-ds-panel-action-btn ds-history-close" style="width:32px;height:32px;font-size:18px;">&times;</button>';
        h += '</div>';
        h += '<div class="sit-ds-export-body">';

        if (versions.length === 0) {
            h += '<div style="text-align:center;padding:32px;color:#6c757d;">';
            h += '<div style="font-size:32px;margin-bottom:8px;opacity:0.3;">&#128196;</div>';
            h += '<div style="font-size:14px;">No version history yet</div>';
            h += '<div style="font-size:12px;margin-top:4px;">Previous versions are saved automatically when you update an existing dashboard.</div>';
            h += '</div>';
        } else {
            h += '<p style="font-size:12px;color:#6c757d;margin:0 0 12px;">Previous versions are saved when you update an existing dashboard. Click to restore or view.</p>';
            h += '<div style="max-height:400px;overflow-y:auto;">';
            versions.forEach(function(v, i) {
                var date = new Date(v.timestamp);
                var timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                var sizeKb = Math.round(v.xml.length / 1024);
                h += '<div class="ds-history-item" data-idx="' + i + '" style="padding:12px 14px;border:1px solid #2b3033;border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all 0.1s ease;background:#0a0e12;">';
                h += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                h += '<div>';
                h += '<div style="font-size:13px;font-weight:600;color:#e0e0e0;">' + esc(v.label) + '</div>';
                h += '<div style="font-size:11px;color:#6c757d;margin-top:2px;">' + timeStr + ' &middot; ' + sizeKb + ' KB</div>';
                h += '</div>';
                h += '<div style="display:flex;gap:6px;">';
                h += '<button class="sit-ds-btn sit-ds-btn-secondary ds-history-load" data-idx="' + i + '" style="padding:4px 10px;font-size:11px;">Load into Editor</button>';
                h += '<button class="sit-ds-btn sit-ds-btn-secondary ds-history-restore" data-idx="' + i + '" style="padding:4px 10px;font-size:11px;">Restore to Splunk</button>';
                h += '</div>';
                h += '</div>';
                h += '</div>';
            });
            h += '</div>';
            h += '<div style="margin-top:12px;text-align:right;">';
            h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-history-clear" style="font-size:11px;padding:6px 12px;color:#DC3545;">Clear All History</button>';
            h += '</div>';
        }

        h += '</div>';

        $content.html(h);
        $backdrop.append($content);
        $('body').append($backdrop);
        requestAnimationFrame(function() { $backdrop.css('opacity', '1'); });

        function closeModal() {
            $backdrop.css('opacity', '0');
            setTimeout(function() { $backdrop.remove(); }, 300);
        }
        $backdrop.on('click', '.ds-history-close', closeModal);
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) closeModal(); });

        // Hover on items
        $backdrop.on('mouseenter', '.ds-history-item', function() { $(this).css('border-color', '#FD1875'); });
        $backdrop.on('mouseleave', '.ds-history-item', function() { $(this).css('border-color', '#2b3033'); });

        // Load into editor
        $backdrop.on('click', '.ds-history-load', function(e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('idx'));
            var v = versions[idx];
            if (v) {
                try {
                    parseAndLoadXML(v.xml);
                    render();
                    updateCanvasTheme();
                    closeModal();
                    showToast('Version loaded from ' + new Date(v.timestamp).toLocaleString(), 'success');
                } catch (err) {
                    showToast('Failed to parse version: ' + err.message, 'error');
                }
            }
        });

        // Restore to Splunk (write back to original dashboard)
        $backdrop.on('click', '.ds-history-restore', function(e) {
            e.stopPropagation();
            var idx = parseInt($(this).data('idx'));
            var v = versions[idx];
            if (!v) return;
            var $btn = $(this);
            $btn.text('Restoring...');
            var csrfToken = getCsrfToken();
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(v.app) + '/data/ui/views/' + encodeURIComponent(v.dashboard) + '?output_mode=json',
                type: 'POST',
                data: { 'eai:data': v.xml },
                headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
                success: function() {
                    $btn.css({ background: '#5CC05C', color: '#fff' }).text('Restored!');
                    showToast('Dashboard restored to version from ' + new Date(v.timestamp).toLocaleString(), 'success');
                },
                error: function() {
                    $btn.text('Failed');
                    showToast('Could not restore. The dashboard may have been deleted.', 'error');
                }
            });
        });

        // Clear all history
        $backdrop.on('click', '#ds-history-clear', function() {
            try { localStorage.removeItem(VERSION_HISTORY_KEY); } catch(e) {}
            closeModal();
            showToast('Version history cleared', 'info');
        });
    }

    // ========================================
    // Import Dashboard XML
    // ========================================

    function showImportModal() {
        var $backdrop = $('<div class="sit-ds-export-modal">');
        var $content = $('<div class="sit-ds-export-content" style="max-width:640px;">');

        var h = '<div class="sit-ds-export-header">';
        h += '<h3>Import Dashboard</h3>';
        h += '<button class="sit-ds-panel-action-btn ds-import-close" style="width:32px;height:32px;font-size:18px;">&times;</button>';
        h += '</div>';
        h += '<div class="sit-ds-export-body">';
        h += '<p style="font-size:13px;color:#a0a0a0;margin:0 0 12px;">Paste Simple XML from an existing dashboard. The parser will extract the layout, theme, background, and panel types.</p>';
        h += '<textarea id="ds-import-xml" rows="12" style="width:100%;background:#0a0e12;border:1px solid #3c444d;border-radius:8px;color:#f8f8f2;font-family:monospace;font-size:11px;padding:12px;box-sizing:border-box;resize:vertical;" placeholder="&lt;dashboard version=&quot;1.1&quot;&gt;&#10;  ...&#10;&lt;/dashboard&gt;"></textarea>';
        h += '<div id="ds-import-status" style="display:none;margin-top:8px;padding:8px 12px;border-radius:6px;font-size:12px;"></div>';
        h += '<div style="display:flex;gap:8px;margin-top:12px;">';
        h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-import-go">' + svgIcon('upload', 14) + ' Import</button>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-import-from-splunk">' + svgIcon('download', 14) + ' Load from Splunk</button>';
        h += '</div>';
        h += '</div>';

        $content.html(h);
        $backdrop.append($content);
        $('body').append($backdrop);
        requestAnimationFrame(function() { $backdrop.css('opacity', '1'); });

        function closeModal() {
            $backdrop.css('opacity', '0');
            setTimeout(function() { $backdrop.remove(); }, 300);
        }
        $backdrop.on('click', '.ds-import-close', closeModal);
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) closeModal(); });

        // Import from pasted XML
        $backdrop.on('click', '#ds-import-go', function() {
            var xml = $('#ds-import-xml').val().trim();
            if (!xml) {
                $('#ds-import-status').show().css({ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', color: '#DC3545' }).text('Paste XML first');
                return;
            }
            try {
                parseAndLoadXML(xml);
                closeModal();
                showToast('Dashboard imported!', 'success');
            } catch (err) {
                $('#ds-import-status').show().css({ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', color: '#DC3545' }).text('Parse error: ' + err.message);
            }
        });

        // Load from Splunk (shows app→dashboard picker)
        $backdrop.on('click', '#ds-import-from-splunk', function() {
            var $btn = $(this);
            $btn.prop('disabled', true).text('Loading apps...');
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/-/apps/local?output_mode=json&count=0',
                success: function(data) {
                    var apps = (data.entry || []).map(function(e) {
                        return { name: e.name, label: e.content && e.content.label ? e.content.label : e.name };
                    }).filter(function(a) { return a.name !== 'learned' && a.name !== 'launcher'; })
                    .sort(function(a, b) { return a.label < b.label ? -1 : 1; });

                    var sel = '<div style="margin-top:12px;"><label style="font-size:11px;color:#a0a0a0;display:block;margin-bottom:4px;">Select App</label>';
                    sel += '<select id="ds-import-app" style="width:100%;padding:8px;background:#1f2527;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;margin-bottom:8px;">';
                    sel += '<option value="">-- Choose app --</option>';
                    apps.forEach(function(a) { sel += '<option value="' + a.name + '">' + esc(a.label) + '</option>'; });
                    sel += '</select>';
                    sel += '<select id="ds-import-dash" style="width:100%;padding:8px;background:#1f2527;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;display:none;margin-bottom:8px;"><option>Select app first</option></select>';
                    sel += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-import-load-dash" style="display:none;">' + svgIcon('download', 14) + ' Load Dashboard</button>';
                    sel += '</div>';
                    $btn.replaceWith(sel);

                    // App change → load dashboards
                    $backdrop.on('change', '#ds-import-app', function() {
                        var app = $(this).val();
                        if (!app) return;
                        var $dashSel = $('#ds-import-dash').show().html('<option>Loading...</option>');
                        $.ajax({
                            url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views?output_mode=json&count=0',
                            success: function(d) {
                                var dashes = (d.entry || []).sort(function(a, b) { return (a.content.label || a.name) < (b.content.label || b.name) ? -1 : 1; });
                                var opts = '<option value="">-- Choose dashboard --</option>';
                                dashes.forEach(function(e) { opts += '<option value="' + e.name + '">' + esc(e.content.label || e.name) + '</option>'; });
                                $dashSel.html(opts);
                                $('#ds-import-load-dash').show();
                            }
                        });
                    });

                    // Load selected dashboard XML
                    $backdrop.on('click', '#ds-import-load-dash', function() {
                        var app = $('#ds-import-app').val();
                        var dash = $('#ds-import-dash').val();
                        if (!app || !dash) return;
                        $(this).text('Loading...');
                        $.ajax({
                            url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views/' + encodeURIComponent(dash) + '?output_mode=json',
                            success: function(d) {
                                var xmlData = d.entry && d.entry[0] && d.entry[0].content && d.entry[0].content['eai:data'];
                                if (xmlData) {
                                    $('#ds-import-xml').val(xmlData);
                                    $('#ds-import-status').show().css({ background: 'rgba(92,192,92,0.1)', border: '1px solid rgba(92,192,92,0.3)', color: '#5CC05C' }).text('XML loaded! Click Import to apply.');
                                }
                            },
                            error: function() {
                                $('#ds-import-status').show().css({ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', color: '#DC3545' }).text('Failed to load dashboard');
                            }
                        });
                    });
                }
            });
        });
    }

    function parseAndLoadXML(xmlString) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlString, 'text/xml');
        var root = doc.querySelector('dashboard, form');
        if (!root) throw new Error('No <dashboard> or <form> tag found');

        pushHistory();

        // Extract title and description
        var labelEl = root.querySelector('label');
        var descEl = root.querySelector('description');
        studio.title = labelEl ? labelEl.textContent : 'Imported Dashboard';
        studio.description = descEl ? descEl.textContent : '';

        // Extract stylesheet and script references
        var cssRefs = (root.getAttribute('stylesheet') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        var jsRefs = (root.getAttribute('script') || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);

        // Parse theme from CSS refs
        studio.theme = '';
        studio.background = '';
        studio.animations = [];
        studio.controls = [];
        studio.kpiEffects = [];
        studio.dashExtras = [];
        studio.kpiStyle = '';
        studio.tableStyle = '';
        studio.uiFramework = [];

        cssRefs.concat(jsRefs).forEach(function(ref) {
            var file = ref.replace(/^[^:]+:/, '').replace(/\.(css|js)$/, '');
            // Theme
            if (file.indexOf('themes/') === 0) studio.theme = file.replace('themes/', '');
            // Background
            if (file.indexOf('backgrounds/') === 0 && file.indexOf('background-helper') === -1) studio.background = file.replace('backgrounds/', '');
            // Animations
            enhancements.animations.forEach(function(a) { if (file.indexOf(a.value) !== -1) studio.animations.push(a.value); });
            // Controls
            enhancements.controls.forEach(function(c) { if (file.indexOf(c.value) !== -1) studio.controls.push(c.value); });
            // KPI effects
            enhancements.kpiEffects.forEach(function(k) { if (file.indexOf(k.value) !== -1) studio.kpiEffects.push(k.value); });
            // Dashboard extras
            enhancements.dashExtras.forEach(function(d) { if (file.indexOf(d.value) !== -1) studio.dashExtras.push(d.value); });
            // KPI styles
            enhancements.kpiStyles.forEach(function(k) { if (k.value && file.indexOf(k.value) !== -1) studio.kpiStyle = k.value; });
            // Table styles
            enhancements.tableStyles.forEach(function(t) { if (t.value && file.indexOf(t.value) !== -1) studio.tableStyle = t.value; });
        });

        // Parse form inputs
        studio.formInputs = [];
        var fieldset = root.querySelector('fieldset');
        if (fieldset) {
            fieldset.querySelectorAll('input').forEach(function(inp) {
                var itype = inp.getAttribute('type') || 'text';
                var token = inp.getAttribute('token') || '';
                var label = inp.querySelector('label') ? inp.querySelector('label').textContent : '';
                var typeMap = { 'time': 'input-time', 'dropdown': 'input-dropdown', 'text': 'input-text', 'multiselect': 'input-multiselect' };
                studio.formInputs.push({ type: typeMap[itype] || 'input-text', label: label, token: token });
            });
        }

        // Parse rows and panels — detect multi-page markers
        studio.pages = [{ name: 'Page 1', rows: [] }];
        studio.activePage = 0;
        var currentPageIdx = 0;

        root.querySelectorAll(':scope > row').forEach(function(rowEl) {
            var columns = [];
            var pageMarker = null;

            rowEl.querySelectorAll(':scope > panel').forEach(function(panelEl) {
                // Check for page group marker (from Design Studio multi-page output)
                var markerEl = panelEl.querySelector('[data-sit-page]');
                if (markerEl) {
                    pageMarker = markerEl.getAttribute('data-sit-page');
                    return; // Skip marker panels — don't add as a column
                }

                var panel = createPanel('empty');
                var titleEl = panelEl.querySelector('title');
                if (titleEl) panel.title = titleEl.textContent;

                if (panelEl.querySelector('single')) { panel.type = 'single'; var sq = panelEl.querySelector('single search query'); if (sq) panel.search = sq.textContent; }
                else if (panelEl.querySelector('chart')) { panel.type = 'chart'; var cq = panelEl.querySelector('chart search query'); if (cq) panel.search = cq.textContent; var ct = panelEl.querySelector('chart option[name="charting.chart"]'); if (ct) panel.chartType = ct.textContent; }
                else if (panelEl.querySelector('table')) { panel.type = 'table'; var tq = panelEl.querySelector('table search query'); if (tq) panel.search = tq.textContent; }
                else if (panelEl.querySelector('map')) { panel.type = 'map'; var mq = panelEl.querySelector('map search query'); if (mq) panel.search = mq.textContent; }
                else if (panelEl.querySelector('html')) {
                    var htmlEl = panelEl.querySelector('html');
                    var htmlText = htmlEl.textContent.trim();
                    var htmlInner = htmlEl.innerHTML || htmlText;
                    // Detect widget types by class name in the HTML content
                    var widgetClassMap = {
                        'world-clock': 'clock',
                        'countdown-widget': 'countdown',
                        'gauge-speedometer': 'gauge-speed',
                        'gauge-liquid-fill': 'gauge-liquid',
                        'sit-traffic-light': 'traffic-lights',
                        'qr-inline': 'qr-code',
                        'team-board': 'team-board',
                        'weather-widget': 'weather',
                        'progress-ring': 'kpi-progress',
                        'network-map': 'network-map',
                        'globe-3d': 'globe',
                        'heatmap-calendar': 'heatmap',
                        'kanban-board': 'kanban',
                        'org-chart': 'org-chart',
                        'terminal-log': 'terminal',
                        'timeline-gantt': 'timeline'
                    };
                    var detectedWidget = false;
                    Object.keys(widgetClassMap).forEach(function(cls) {
                        if (!detectedWidget && (htmlInner.indexOf(cls) > -1 || htmlText.indexOf(cls) > -1)) {
                            panel.type = widgetClassMap[cls];
                            detectedWidget = true;
                        }
                    });
                    if (!detectedWidget) {
                        panel.type = 'html';
                        panel.htmlContent = htmlText;
                    }
                }

                columns.push(panel);
            });

            // If we found a page marker, start a new page
            if (pageMarker) {
                // Is this the first page or a new one?
                if (currentPageIdx === 0 && studio.pages[0].rows.length === 0) {
                    // Rename the first empty page
                    studio.pages[0].name = pageMarker;
                } else {
                    // Add a new page
                    studio.pages.push({ name: pageMarker, rows: [] });
                    currentPageIdx = studio.pages.length - 1;
                }
            }

            if (columns.length > 0) {
                studio.pages[currentPageIdx].rows.push({ columns: columns });
            }
        });

        selectedPanel = null;
        render();
        updateCanvasTheme();
    }

    // ========================================
    // Preview Dashboard
    // ========================================

    // Track the last preview so we can clean it up
    var _lastPreviewName = null;

    function previewDashboard() {
        if (activeRows().length === 0) {
            showToast('Add at least one panel to preview', 'warning');
            return;
        }

        var xml = generateSimpleXML();
        var previewName = '_sit_preview_' + Date.now();
        var previewApp = TOOLKIT_APP;
        var csrfToken = getCsrfToken();

        // Clean up previous preview first
        if (_lastPreviewName) {
            var oldName = _lastPreviewName;
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(previewApp) + '/data/ui/views/' + encodeURIComponent(oldName),
                type: 'DELETE',
                headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {}
            });
        }

        showToast('Creating preview...', 'info');

        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(previewApp) + '/data/ui/views',
            type: 'POST',
            data: { name: previewName, 'eai:data': xml },
            headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
            success: function() {
                _lastPreviewName = previewName;
                var url = '/en-US/app/' + encodeURIComponent(previewApp) + '/' + previewName;
                window.open(url, '_blank');
                showToast('Preview opened — stays until you preview again or close Design Studio', 'success');

                // Safety cleanup after 5 minutes
                setTimeout(function() {
                    if (_lastPreviewName === previewName) {
                        $.ajax({
                            url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(previewApp) + '/data/ui/views/' + encodeURIComponent(previewName),
                            type: 'DELETE',
                            headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {}
                        });
                        _lastPreviewName = null;
                    }
                }, 300000);
            },
            error: function() {
                // Fallback: copy to clipboard and let user know
                copyToClipboard(xml, function() {
                    showToast('Preview failed. XML copied to clipboard instead.', 'warning');
                });
            }
        });
    }

    // ========================================
    // Export Modal
    // ========================================

    function showExportModal() {
        var simpleXML = generateSimpleXML();
        var studioJSON = generateDashboardStudioJSON();

        var $backdrop = $('<div class="sit-ds-export-modal">');
        var $content = $('<div class="sit-ds-export-content">');

        var h = '';

        // Header
        h += '<div class="sit-ds-export-header">';
        h += '<h3>Export Dashboard</h3>';
        h += '<button class="sit-ds-panel-action-btn ds-export-close" style="width:32px;height:32px;font-size:18px;">&times;</button>';
        h += '</div>';

        // Body
        h += '<div class="sit-ds-export-body">';

        // Tabs
        h += '<div class="sit-ds-export-tabs">';
        h += '<button class="sit-ds-export-tab sit-ds-export-tab-active" data-tab="xml" style="background:#FD1875;color:#fff;">Simple XML</button>';
        h += '<button class="sit-ds-export-tab" data-tab="json" style="background:#2b3033;color:#a0a0a0;">Dashboard Studio JSON</button>';
        h += '</div>';

        // Code areas
        h += '<div id="ds-export-xml-pane">';
        h += '<div class="sit-ds-export-code"><pre>' + esc(simpleXML) + '</pre></div>';
        h += '</div>';
        h += '<div id="ds-export-json-pane" style="display:none;">';
        h += '<div class="sit-ds-export-code"><pre>' + esc(studioJSON) + '</pre></div>';
        h += '</div>';

        // Buttons
        h += '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">';
        h += '<button class="sit-ds-btn sit-ds-btn-primary" id="ds-export-copy">' + svgIcon('clipboard', 14) + ' Copy to Clipboard</button>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-export-download">' + svgIcon('download', 14) + ' Download XML</button>';
        h += '<button class="sit-ds-btn sit-ds-btn-secondary" id="ds-export-apply">' + svgIcon('check-circle', 14) + ' Apply to Dashboard</button>';
        h += '</div>';

        h += '</div>'; // body

        $content.html(h);
        $backdrop.append($content);
        $('body').append($backdrop);

        // Animate in
        requestAnimationFrame(function() { $backdrop.css('opacity', '1'); });

        var activeTab = 'xml';

        // Tab switching
        $backdrop.on('click', '.sit-ds-export-tab', function() {
            activeTab = $(this).data('tab');
            $backdrop.find('.sit-ds-export-tab').css({ background: '#2b3033', color: '#a0a0a0' }).removeClass('sit-ds-export-tab-active');
            $(this).css({ background: '#FD1875', color: '#fff' }).addClass('sit-ds-export-tab-active');
            if (activeTab === 'xml') {
                $('#ds-export-xml-pane').show();
                $('#ds-export-json-pane').hide();
            } else {
                $('#ds-export-xml-pane').hide();
                $('#ds-export-json-pane').show();
            }
        });

        // Copy to clipboard
        $backdrop.on('click', '#ds-export-copy', function() {
            var code = activeTab === 'xml' ? simpleXML : studioJSON;
            var $btn = $(this);
            copyToClipboard(code, function() {
                var orig = $btn.html();
                $btn.html(svgIcon('check', 14) + ' Copied!').css('background', '#5CC05C');
                setTimeout(function() { $btn.html(orig).css('background', ''); }, 2000);
            });
        });

        // Download XML file
        $backdrop.on('click', '#ds-export-download', function() {
            var code = activeTab === 'xml' ? simpleXML : studioJSON;
            var ext = activeTab === 'xml' ? '.xml' : '.json';
            var filename = studio.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + ext;
            var blob = new Blob([code], { type: 'text/' + (activeTab === 'xml' ? 'xml' : 'json') });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Downloaded ' + filename, 'success');
        });

        // Save to Dashboard
        $backdrop.on('click', '#ds-export-apply', function() {
            closeExportModal();
            showSaveModal();
        });

        // Close
        function closeExportModal() {
            $backdrop.css('opacity', '0');
            setTimeout(function() { $backdrop.remove(); }, 300);
        }

        $backdrop.on('click', '.ds-export-close', function() { closeExportModal(); });
        $backdrop.on('click', function(e) {
            if ($(e.target).is($backdrop)) closeExportModal();
        });
    }

    // ========================================
    // Apply to Dashboard Modal
    // ========================================

    function showApplyModal() {
        if (activeRows().length === 0) {
            showToast('Add at least one row before applying', 'warning');
            return;
        }

        var fullXML = generateSimpleXML();

        var $backdrop = $('<div>').css({
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', opacity: 0, transition: 'opacity 0.3s ease'
        });

        var $modal = $('<div>').css({
            background: '#1a1e22', borderRadius: '16px', border: '1px solid #3c444d',
            maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)', color: '#e0e0e0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });

        var summaryItems = [];
        summaryItems.push('Title: ' + studio.title);
        if (studio.theme) summaryItems.push('Theme: ' + studio.theme);
        if (studio.background) summaryItems.push('Background: ' + studio.background);
        summaryItems.push('Rows: ' + activeRows().length);
        var panelCount = 0;
        activeRows().forEach(function(r) { panelCount += r.columns.length; });
        summaryItems.push('Panels: ' + panelCount);

        $modal.html(
            '<div style="padding:20px 24px;border-bottom:1px solid #3c444d;display:flex;align-items:center;justify-content:space-between;">' +
                '<h3 style="margin:0;font-size:18px;font-weight:600;color:#fff;">Apply Dashboard to Splunk</h3>' +
                '<button class="ds-apply-close" style="background:none;border:none;color:#a0a0a0;font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;">&times;</button>' +
            '</div>' +
            '<div style="padding:24px;">' +
                '<div style="background:#0a0e12;border:1px solid #2b3033;border-radius:8px;padding:14px;margin-bottom:20px;">' +
                    '<p style="font-size:11px;color:#6c757d;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Dashboard summary</p>' +
                    '<p style="font-size:13px;color:#f8f8f2;margin:0;line-height:1.6;">' + summaryItems.join(' &bull; ') + '</p>' +
                '</div>' +

                '<div style="margin-bottom:16px;">' +
                    '<label style="display:block;font-size:12px;font-weight:600;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Step 1: Select App</label>' +
                    '<select id="ds-apply-app" style="width:100%;padding:10px 14px;background:#1f2527;border:1px solid #3c444d;border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;-webkit-appearance:none;cursor:pointer;">' +
                        '<option value="">Loading apps...</option>' +
                    '</select>' +
                '</div>' +

                '<div id="ds-apply-dash-section" style="margin-bottom:16px;display:none;">' +
                    '<label style="display:block;font-size:12px;font-weight:600;color:#a0a0a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Step 2: Select Dashboard</label>' +
                    '<input type="text" id="ds-apply-search" placeholder="Filter dashboards..." style="width:100%;padding:10px 14px;background:#1f2527;border:1px solid #3c444d;border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;margin-bottom:8px;" />' +
                    '<div id="ds-apply-list" style="max-height:200px;overflow-y:auto;border:1px solid #3c444d;border-radius:8px;background:#1f2527;">' +
                        '<div style="padding:20px;text-align:center;color:#6c757d;font-size:13px;">Select an app first</div>' +
                    '</div>' +
                '</div>' +

                '<div id="ds-apply-selected" style="display:none;background:rgba(253,24,117,0.08);border:1px solid rgba(253,24,117,0.2);border-radius:8px;padding:12px 16px;margin-bottom:16px;">' +
                    '<p style="font-size:11px;color:#FD1875;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Selected</p>' +
                    '<p id="ds-apply-selected-name" style="font-size:15px;color:#fff;margin:0;font-weight:600;"></p>' +
                    '<p id="ds-apply-selected-app" style="font-size:12px;color:#a0a0a0;margin:4px 0 0;"></p>' +
                '</div>' +

                '<div style="margin-bottom:16px;">' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:#a0a0a0;">' +
                        '<input type="checkbox" id="ds-apply-overwrite" style="accent-color:#FD1875;" />' +
                        ' Replace entire dashboard XML (overwrite)' +
                    '</label>' +
                '</div>' +

                '<button id="ds-apply-confirm" disabled style="width:100%;padding:14px;background:#3c444d;color:#6c757d;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:not-allowed;font-family:inherit;transition:all 0.2s ease;">' +
                    'Select a dashboard above' +
                '</button>' +

                '<div id="ds-apply-status" style="display:none;margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;"></div>' +
            '</div>'
        );

        $backdrop.append($modal);
        $('body').append($backdrop);
        requestAnimationFrame(function() { $backdrop.css('opacity', '1'); });

        // Close
        function closeModal() {
            $backdrop.css('opacity', '0');
            setTimeout(function() { $backdrop.remove(); }, 300);
        }
        $backdrop.find('.ds-apply-close').on('click', closeModal);
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) closeModal(); });

        var allDashboards = [];
        var selectedDash = null;
        var selectedApp = '';

        // Load apps via REST
        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/-/apps/local?output_mode=json&count=0',
            type: 'GET',
            success: function(data) {
                var apps = (data.entry || []).map(function(e) {
                    return {
                        name: e.name,
                        label: e.content && e.content.label ? e.content.label : e.name,
                        visible: e.content ? e.content.visible : true
                    };
                }).filter(function(a) {
                    return a.visible !== false && a.name !== 'learned' && a.name !== 'launcher' && a.name !== 'splunk_instrumentation';
                }).sort(function(a, b) {
                    return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1;
                });

                var html = '<option value="">-- Choose an app --</option>';
                apps.forEach(function(a) {
                    html += '<option value="' + a.name + '">' + esc(a.label) + ' (' + a.name + ')</option>';
                });
                $('#ds-apply-app').html(html);
            },
            error: function() {
                $('#ds-apply-app').html('<option value="">Failed to load apps</option>');
            }
        });

        // When app changes, load dashboards
        $backdrop.on('change', '#ds-apply-app', function() {
            selectedApp = $(this).val();
            selectedDash = null;
            $('#ds-apply-selected').hide();
            $('#ds-apply-confirm').prop('disabled', true).css({ background: '#3c444d', color: '#6c757d', cursor: 'not-allowed' }).text('Select a dashboard');

            if (!selectedApp) {
                $('#ds-apply-dash-section').hide();
                return;
            }

            $('#ds-apply-dash-section').show();
            $('#ds-apply-list').html('<div style="padding:20px;text-align:center;color:#6c757d;font-size:13px;">Loading dashboards...</div>');
            $('#ds-apply-search').val('');

            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(selectedApp) + '/data/ui/views?output_mode=json&count=0&search=isDashboard%3Dtrue',
                type: 'GET',
                success: function(data) {
                    allDashboards = (data.entry || []).map(function(e) {
                        return {
                            name: e.name,
                            label: e.content && e.content.label ? e.content.label : e.name,
                            app: selectedApp,
                            owner: e.acl && e.acl.owner ? e.acl.owner : 'unknown'
                        };
                    }).sort(function(a, b) {
                        return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1;
                    });
                    renderDashList(allDashboards);
                },
                error: function() {
                    $('#ds-apply-list').html('<div style="padding:20px;text-align:center;color:#DC3545;font-size:13px;">Failed to load dashboards.</div>');
                }
            });
        });

        function renderDashList(dashes) {
            if (dashes.length === 0) {
                $('#ds-apply-list').html('<div style="padding:20px;text-align:center;color:#6c757d;font-size:13px;">No dashboards found</div>');
                return;
            }
            var html = '';
            dashes.forEach(function(d) {
                html += '<div class="ds-apply-dash-item" data-name="' + d.name + '" data-app="' + d.app + '" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #2b3033;transition:background 0.1s ease;">' +
                    '<div style="font-size:13px;color:#fff;font-weight:500;">' + esc(d.label) + '</div>' +
                    '<div style="font-size:11px;color:#6c757d;margin-top:2px;">ID: ' + esc(d.name) + '</div>' +
                '</div>';
            });
            $('#ds-apply-list').html(html);
        }

        // Filter
        $backdrop.on('input', '#ds-apply-search', function() {
            var q = $(this).val().toLowerCase();
            if (!q) { renderDashList(allDashboards); return; }
            renderDashList(allDashboards.filter(function(d) {
                return d.label.toLowerCase().indexOf(q) > -1 || d.name.toLowerCase().indexOf(q) > -1;
            }));
        });

        // Select dashboard
        $backdrop.on('click', '.ds-apply-dash-item', function() {
            var name = $(this).data('name');
            var app = $(this).data('app');
            selectedDash = allDashboards.filter(function(d) { return d.name === name && d.app === app; })[0];

            $backdrop.find('.ds-apply-dash-item').css({ background: 'transparent' });
            $(this).css({ background: 'rgba(253,24,117,0.1)' });

            $('#ds-apply-selected').show();
            $('#ds-apply-selected-name').text(selectedDash.label);
            $('#ds-apply-selected-app').text('App: ' + selectedDash.app + '  |  ID: ' + selectedDash.name);

            $('#ds-apply-confirm').prop('disabled', false).css({
                background: '#FD1875', color: '#fff', cursor: 'pointer'
            }).html(svgIcon('clipboard', 16) + ' Copy Full XML & Open in Edit Mode');
        });

        // Hover on items
        $backdrop.on('mouseenter', '.ds-apply-dash-item', function() {
            $(this).css({ background: 'rgba(255,255,255,0.03)' });
        }).on('mouseleave', '.ds-apply-dash-item', function() {
            if (!selectedDash || $(this).data('name') !== selectedDash.name) {
                $(this).css({ background: 'transparent' });
            }
        });

        // Confirm apply
        $backdrop.on('click', '#ds-apply-confirm', function() {
            if (!selectedDash) return;
            var $btn = $(this);
            var $status = $('#ds-apply-status');
            var doOverwrite = $('#ds-apply-overwrite').is(':checked');

            $btn.prop('disabled', true).css({ background: '#3c444d', cursor: 'wait' }).text('Preparing...');

            if (doOverwrite) {
                // Overwrite mode: POST entire XML
                var csrfToken = getCsrfToken();
                $.ajax({
                    url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(selectedDash.app) + '/data/ui/views/' + encodeURIComponent(selectedDash.name) + '?output_mode=json',
                    type: 'POST',
                    data: { 'eai:data': fullXML },
                    headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
                    success: function() {
                        showApplyStatus('success',
                            '<strong>Dashboard updated!</strong> The full XML has been written to <strong>' + esc(selectedDash.label) + '</strong>.' +
                            '<div style="margin-top:8px;font-size:12px;color:#a0a0a0;">Opening dashboard now...</div>'
                        );
                        $btn.css({ background: '#5CC05C' }).html(svgIcon('check', 16) + ' Done!');
                        setTimeout(function() {
                            window.open('/en-US/app/' + encodeURIComponent(selectedDash.app) + '/' + encodeURIComponent(selectedDash.name), '_blank');
                        }, 800);
                    },
                    error: function() {
                        // Fallback to clipboard approach
                        copyAndOpen();
                    }
                });
            } else {
                copyAndOpen();
            }

            function copyAndOpen() {
                copyToClipboard(fullXML, function() {
                    showApplyStatus('success',
                        '<strong>Full dashboard XML copied to clipboard!</strong>' +
                        '<div style="margin-top:10px;padding:10px 14px;background:#0a0e12;border:1px solid #2b3033;border-radius:6px;">' +
                            '<p style="margin:0 0 8px;font-size:12px;color:#a0a0a0;">Opening dashboard in edit mode. Then:</p>' +
                            '<p style="margin:0 0 4px;font-size:13px;color:#f8f8f2;"><strong style="color:#FD1875;">1.</strong> Click <strong>Source (&lt;/&gt;)</strong></p>' +
                            '<p style="margin:0 0 4px;font-size:13px;color:#f8f8f2;"><strong style="color:#FD1875;">2.</strong> Select all (Ctrl+A / Cmd+A)</p>' +
                            '<p style="margin:0 0 4px;font-size:13px;color:#f8f8f2;"><strong style="color:#FD1875;">3.</strong> Paste (Ctrl+V / Cmd+V) to replace</p>' +
                            '<p style="margin:0;font-size:13px;color:#f8f8f2;"><strong style="color:#FD1875;">4.</strong> Click <strong>Save</strong></p>' +
                        '</div>'
                    );
                    $btn.css({ background: '#5CC05C' }).html(svgIcon('check', 16) + ' Copied! Opening...');
                    setTimeout(function() {
                        window.open('/en-US/app/' + encodeURIComponent(selectedDash.app) + '/' + encodeURIComponent(selectedDash.name) + '?edit=1', '_blank');
                    }, 800);
                });
            }

            function showApplyStatus(type, msg) {
                var colors = {
                    success: { bg: 'rgba(92,192,92,0.1)', border: 'rgba(92,192,92,0.3)', text: '#5CC05C' },
                    error: { bg: 'rgba(220,53,69,0.1)', border: 'rgba(220,53,69,0.3)', text: '#DC3545' }
                };
                var c = colors[type] || colors.error;
                $status.show().css({ background: c.bg, border: '1px solid ' + c.border, color: c.text }).html(msg);
            }
        });
    }

    // ========================================
    // Utility Functions
    // ========================================

    // ========================================
    // Save to Dashboard Modal
    // ========================================

    function showSaveModal() {
        if (activeRows().length === 0) {
            showToast('Add at least one panel first', 'warning');
            return;
        }

        var xml = generateSimpleXML();

        var $backdrop = $('<div>').css({
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
            zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        });

        var $modal = $('<div>').css({
            background: '#1a1e22', borderRadius: '16px', border: '1px solid #3c444d',
            maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)', color: '#e0e0e0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });

        var dashId = studio.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/_remix$/, '');
        var panelCount = 0;
        studio.pages.forEach(function(pg) { pg.rows.forEach(function(r) { r.columns.forEach(function(c) { if (c.type !== 'empty') panelCount++; }); }); });

        $modal.html(
            // Header
            '<div style="padding:16px 24px;border-bottom:1px solid #3c444d;display:flex;align-items:center;justify-content:space-between;">' +
                '<div>' +
                    '<h3 style="margin:0;font-size:18px;font-weight:600;color:#fff;">Save Dashboard</h3>' +
                    '<div style="font-size:11px;color:#6c757d;margin-top:2px;">' + esc(studio.title) + ' &middot; ' + panelCount + ' panels &middot; ' + studio.pages.length + ' page' + (studio.pages.length > 1 ? 's' : '') + '</div>' +
                '</div>' +
                '<button class="ds-save-close" style="background:none;border:none;color:#a0a0a0;font-size:24px;cursor:pointer;padding:4px 8px;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px 24px;">' +

                // === CREATE NEW (expanded by default) ===
                '<div style="margin-bottom:12px;">' +
                    '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
                        '<div style="flex:1;">' +
                            '<label style="display:block;font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:4px;">Dashboard ID</label>' +
                            '<input id="ds-save-new-name" type="text" value="' + escAttr(dashId) + '" style="width:100%;padding:8px 10px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;font-family:inherit;" />' +
                        '</div>' +
                        '<div style="flex:1;">' +
                            '<label style="display:block;font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:4px;">App</label>' +
                            '<select id="ds-save-new-app" style="width:100%;padding:8px 10px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;outline:none;font-family:inherit;height:36px;">' +
                                '<option value="">Loading...</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<button id="ds-save-new-btn" class="sit-ds-btn sit-ds-btn-primary" style="width:100%;justify-content:center;padding:10px;font-size:14px;">' +
                        svgIcon('plus', 14) + ' Create New Dashboard' +
                    '</button>' +
                '</div>' +

                // === UPDATE EXISTING (collapsible) ===
                '<div style="border-top:1px solid #2b3033;padding-top:12px;">' +
                    '<button id="ds-save-toggle-update" style="width:100%;display:flex;align-items:center;justify-content:space-between;background:none;border:none;cursor:pointer;padding:6px 0;color:#17A2B8;font-size:13px;font-weight:600;font-family:inherit;">' +
                        '<span>Update Existing Dashboard</span>' +
                        '<span class="ds-update-arrow" style="font-size:10px;color:#6c757d;transition:transform 0.2s;">&#9660;</span>' +
                    '</button>' +
                    '<div id="ds-save-update-section" style="display:none;padding-top:10px;">' +
                        '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
                            '<div style="flex:1;">' +
                                '<label style="display:block;font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:4px;">App</label>' +
                                '<select id="ds-save-update-app" style="width:100%;padding:8px 10px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;outline:none;font-family:inherit;height:36px;">' +
                                    '<option value="">Loading...</option>' +
                                '</select>' +
                            '</div>' +
                            '<div style="flex:1;">' +
                                '<label style="display:block;font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:4px;">Dashboard ID</label>' +
                                '<input id="ds-save-update-dash" type="text" value="' + escAttr(dashId) + '" placeholder="e.g. my_soc_dashboard" style="width:100%;padding:8px 10px;background:#0a0e12;border:1px solid #3c444d;border-radius:6px;color:#fff;font-size:13px;outline:none;box-sizing:border-box;font-family:inherit;" />' +
                            '</div>' +
                        '</div>' +
                        '<div style="font-size:9px;color:#4a545e;margin-bottom:8px;">Previous version is saved to History automatically before overwriting.</div>' +
                        '<button id="ds-save-update-btn" class="sit-ds-btn sit-ds-btn-secondary" style="width:100%;justify-content:center;padding:10px;">' +
                            svgIcon('check-circle', 14) + ' Update Dashboard' +
                        '</button>' +
                    '</div>' +
                '</div>' +

                // Status
                '<div id="ds-save-status" style="display:none;margin-top:12px;padding:10px 14px;border-radius:8px;font-size:12px;"></div>' +
            '</div>'
        );

        // Toggle update section
        $modal.on('click', '#ds-save-toggle-update', function() {
            var $section = $('#ds-save-update-section');
            var $arrow = $(this).find('.ds-update-arrow');
            if ($section.is(':visible')) {
                $section.slideUp(200);
                $arrow.css('transform', 'rotate(0deg)');
            } else {
                $section.slideDown(200);
                $arrow.css('transform', 'rotate(180deg)');
            }
        });

        $backdrop.append($modal);
        $('body').append($backdrop);

        function closeModal() { $backdrop.remove(); }
        $backdrop.find('.ds-save-close').on('click', closeModal);
        $backdrop.on('click', function(e) { if ($(e.target).is($backdrop)) closeModal(); });

        // Load apps (for both Create New and Update Existing)
        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/-/apps/local?output_mode=json&count=0',
            success: function(data) {
                var apps = (data.entry || []).map(function(e) {
                    return { name: e.name, label: e.content && e.content.label ? e.content.label : e.name };
                }).filter(function(a) {
                    return a.name !== 'learned' && a.name !== 'launcher' && a.name !== 'splunk_instrumentation';
                }).sort(function(a, b) { return a.label < b.label ? -1 : 1; });

                var h = '<option value="search">search (default)</option>';
                var h2 = '<option value="search">search (default)</option>';
                apps.forEach(function(a) {
                    h += '<option value="' + a.name + '">' + esc(a.label) + '</option>';
                    h2 += '<option value="' + a.name + '">' + esc(a.label) + '</option>';
                });
                $('#ds-save-new-app').html(h);
                $('#ds-save-update-app').html(h2);
            }
        });

        // Update Existing — confirm overwrite
        $backdrop.on('click', '#ds-save-update-btn', function() {
            var app = $('#ds-save-update-app').val();
            var dash = $('#ds-save-update-dash').val().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
            if (!app || !dash) return;
            var $btn = $(this);
            $btn.prop('disabled', true).text('Saving backup...');

            var csrfToken = getCsrfToken();

            // STEP 1: Fetch current XML and save as version history before overwriting
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views/' + encodeURIComponent(dash) + '?output_mode=json',
                type: 'GET',
                success: function(currentData) {
                    var currentXml = currentData.entry && currentData.entry[0] && currentData.entry[0].content && currentData.entry[0].content['eai:data'];
                    if (currentXml) {
                        saveVersionHistory(app, dash, currentXml);
                    }

                    // STEP 2: Now overwrite with new XML
                    $btn.text('Updating...');
                    $.ajax({
                        url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views/' + encodeURIComponent(dash) + '?output_mode=json',
                        type: 'POST',
                        data: { 'eai:data': xml },
                        headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
                        success: function() {
                            showSaveStatus('success',
                                '<strong>Dashboard updated!</strong> Previous version saved to history. <a href="/en-US/app/' + app + '/' + dash + '" target="_blank" style="color:#FD1875;font-weight:600;text-decoration:underline;">Open ' + esc(dash) + ' &rarr;</a>'
                            );
                            $btn.css('background', '#5CC05C').text('Updated!');
                        },
                        error: function(xhr) {
                            showSaveStatus('error', 'Failed to update: ' + esc((xhr.responseText || 'Unknown error').substring(0, 200)));
                            $btn.prop('disabled', false).html(svgIcon('check-circle', 14) + ' Update Dashboard');
                        }
                    });
                },
                error: function() {
                    // Can't fetch current — proceed with overwrite anyway
                    $btn.text('Updating...');
                    $.ajax({
                        url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views/' + encodeURIComponent(dash) + '?output_mode=json',
                        type: 'POST',
                        data: { 'eai:data': xml },
                        headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {},
                        success: function() {
                            showSaveStatus('success',
                                '<strong>Dashboard updated!</strong> <a href="/en-US/app/' + app + '/' + dash + '" target="_blank" style="color:#FD1875;font-weight:600;text-decoration:underline;">Open ' + esc(dash) + ' &rarr;</a>'
                            );
                            $btn.css('background', '#5CC05C').text('Updated!');
                        },
                        error: function(xhr) {
                            showSaveStatus('error', 'Failed to update: ' + esc((xhr.responseText || 'Unknown error').substring(0, 200)));
                            $btn.prop('disabled', false).html(svgIcon('check-circle', 14) + ' Update Dashboard');
                        }
                    });
                }
            });
        });

        // Create New Dashboard
        $backdrop.on('click', '#ds-save-new-btn', function() {
            var name = $('#ds-save-new-name').val().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
            var app = $('#ds-save-new-app').val();
            if (!name) { showSaveStatus('error', 'Enter a dashboard name'); return; }
            if (!app) { showSaveStatus('error', 'Select an app'); return; }

            var $btn = $(this);
            $btn.prop('disabled', true).text('Creating...');

            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/data/ui/views',
                type: 'POST',
                data: { name: name, 'eai:data': xml },
                success: function() {
                    showSaveStatus('success',
                        '<strong>Dashboard created!</strong> <a href="/en-US/app/' + app + '/' + name + '" target="_blank" style="color:#FD1875;font-weight:600;text-decoration:underline;">Open ' + esc(name) + ' &rarr;</a>' +
                        '<div style="margin-top:10px;padding:10px;background:rgba(0,0,0,0.3);border-radius:6px;text-align:left;">' +
                        '<div style="font-size:10px;font-weight:600;color:#6c757d;text-transform:uppercase;margin-bottom:6px;">Next Steps</div>' +
                        '<div style="font-size:11px;line-height:1.7;color:#a0a0a0;">' +
                        '<div>1. Open the dashboard and verify the layout</div>' +
                        '<div>2. Replace placeholder SPL with your real queries</div>' +
                        '<div>3. Adjust panel titles to match your data</div>' +
                        '<div>4. Set permissions to share with your team</div>' +
                        '</div></div>'
                    );
                    $btn.css('background', '#5CC05C').text('Created!');
                },
                error: function(xhr) {
                    var errMsg = xhr.responseText || 'Unknown error';
                    if (errMsg.indexOf('already exists') > -1) {
                        showSaveStatus('error', 'Dashboard "' + esc(name) + '" already exists in ' + esc(app) + '. Choose a different name.');
                    } else {
                        showSaveStatus('error', 'Failed: ' + esc(errMsg.substring(0, 200)));
                    }
                    $btn.prop('disabled', false).html(svgIcon('plus', 14) + ' Create New Dashboard');
                }
            });
        });

        // Legacy apply (kept for backwards compat but hidden)
        $backdrop.on('click', '#ds-save-existing-btn', function() {
            closeModal();
            showApplyModal();
        });

        function showSaveStatus(type, msg) {
            var colors = {
                success: { bg: 'rgba(92,192,92,0.1)', border: 'rgba(92,192,92,0.3)', color: '#5CC05C' },
                error: { bg: 'rgba(220,53,69,0.1)', border: 'rgba(220,53,69,0.3)', color: '#DC3545' }
            };
            var c = colors[type] || colors.error;
            $('#ds-save-status').show().css({ background: c.bg, border: '1px solid ' + c.border, color: c.color }).html(msg);
        }
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escAttr(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escXml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function copyToClipboard(text, callback) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                if (callback) callback();
            });
        } else {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (callback) callback();
        }
    }

    function getCsrfToken() {
        try {
            // Splunk puts the CSRF token in a cookie or in the page config
            var match = document.cookie.match(/splunkweb_csrf_token_\d+=([^;]+)/);
            if (match) return match[1];
            if (window.$C && window.$C.CSRF_TOKEN) return window.$C.CSRF_TOKEN;
            // Try the meta tag approach
            var meta = $('meta[name="csrf-token"]').attr('content');
            if (meta) return meta;
        } catch (e) {}
        return null;
    }

    function showToast(msg, type) {
        var colors = { success: '#5CC05C', error: '#DC3545', warning: '#F7B500', info: '#17A2B8' };
        var $t = $('<div>').css({
            position: 'fixed', top: '20px', right: '20px', padding: '12px 20px',
            background: '#1a1e21', color: '#fff', borderRadius: '8px',
            borderLeft: '4px solid ' + (colors[type] || colors.info),
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 200000,
            fontSize: '14px', fontFamily: 'inherit', opacity: 0,
            transform: 'translateY(-10px)', transition: 'all 0.3s ease'
        }).text(msg).appendTo('body');
        requestAnimationFrame(function() { $t.css({ opacity: 1, transform: 'translateY(0)' }); });
        setTimeout(function() {
            $t.css({ opacity: 0 });
            setTimeout(function() { $t.remove(); }, 300);
        }, 3000);
    }

    function svgIcon(name, size) {
        size = size || 16;
        var icons = {
            'download': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
            'check-circle': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            'plus': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            'clipboard': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
            'check': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            'layout': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
            'undo': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
            'redo': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
            'eye': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
            'upload': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
            'clock': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        };
        return icons[name] || '';
    }

    // ========================================
    // Onboarding Walkthrough
    // ========================================

    function showWalkthrough() {
        var steps = [
            {
                title: 'Make Your Dashboards Look Amazing',
                body: 'Design Studio adds professional polish to your <strong>Classic Simple XML</strong> dashboards — premium themes, animated backgrounds, interactive controls — without writing CSS or JS. <br><span style="color:#F7B500;font-size:11px;">Works with Classic dashboards only. Not compatible with Dashboard Studio.</span>',
                position: 'center'
            },
            {
                title: 'Step 1: Import Your Dashboard',
                body: 'Already have a dashboard? Click <strong>Import</strong> to load it here, or use the <strong>Remix</strong> button on any existing dashboard. Your queries and panels are preserved — we just add the polish.',
                position: 'center'
            },
            {
                title: 'Step 2: Pick a Theme & Background',
                body: 'Go to the <strong>Settings</strong> tab to choose from 12 premium themes (SOC Command Center, Gradient Luxury, Cyberpunk Neon...) and 14 animated backgrounds. One click transforms your entire dashboard.',
                position: 'left'
            },
            {
                title: 'Step 3: Add Effects & Controls',
                body: 'The <strong>Effects</strong> tab lets you add animations (fade in, hover glow), interactive controls (dark mode toggle, fullscreen button, collapsible panels), and KPI enhancements — all with checkboxes.',
                position: 'left'
            },
            {
                title: 'Step 4: Save & Share',
                body: 'Click <strong>Save</strong> to update your existing dashboard or create a new one. Click <strong>Live</strong> to preview it in Splunk with your real data. Your .conf-worthy dashboard is ready!',
                position: 'center'
            }
        ];

        var currentStep = 0;

        function renderStep() {
            $('.sit-ds-walkthrough-overlay, .sit-ds-walkthrough-card').remove();

            if (currentStep >= steps.length) {
                try { localStorage.setItem('sit_ds_walkthrough_done', '1'); } catch(e) {}
                return;
            }

            var step = steps[currentStep];
            var $overlay = $('<div class="sit-ds-walkthrough-overlay">');
            var $card = $('<div class="sit-ds-walkthrough-card">');

            var dots = '<div class="sit-ds-walkthrough-steps">';
            for (var i = 0; i < steps.length; i++) {
                dots += '<div class="sit-ds-walkthrough-dot' + (i === currentStep ? ' active' : '') + '"></div>';
            }
            dots += '</div>';

            $card.html(
                dots +
                '<h3>' + step.title + '</h3>' +
                '<p>' + step.body + '</p>' +
                '<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">' +
                    '<button class="ds-walk-skip" style="background:none;border:none;color:#6c757d;cursor:pointer;font-size:12px;padding:4px 8px;font-family:inherit;">Skip tour</button>' +
                    '<div style="display:flex;gap:6px;">' +
                        (currentStep > 0 ? '<button class="ds-walk-prev sit-ds-btn sit-ds-btn-secondary" style="padding:6px 14px;font-size:12px;">Back</button>' : '') +
                        '<button class="ds-walk-next sit-ds-btn sit-ds-btn-primary" style="padding:6px 18px;font-size:12px;">' + (currentStep === steps.length - 1 ? 'Get Started' : 'Next') + '</button>' +
                    '</div>' +
                '</div>'
            );

            // Position
            if (step.position === 'center') {
                $card.css({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            } else if (step.position === 'left') {
                $card.css({ top: '200px', left: '240px' });
            }

            $('body').append($overlay).append($card);

            $card.on('click', '.ds-walk-next', function() { currentStep++; renderStep(); });
            $card.on('click', '.ds-walk-prev', function() { currentStep--; renderStep(); });
            $card.on('click', '.ds-walk-skip', function() {
                try { localStorage.setItem('sit_ds_walkthrough_done', '1'); } catch(e) {}
                $overlay.remove(); $card.remove();
            });
            $overlay.on('click', function() {
                try { localStorage.setItem('sit_ds_walkthrough_done', '1'); } catch(e) {}
                $overlay.remove(); $card.remove();
            });
        }

        renderStep();
    }

    // ========================================
    // Initialize
    // ========================================

    pushHistory(); // save initial state so undo has a base

    // Auto-cleanup old preview dashboards (older than 5 minutes)
    if (_lastPreviewName) {
        var csrfToken = getCsrfToken();
        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/' + TOOLKIT_APP + '/data/ui/views/' + encodeURIComponent(_lastPreviewName),
            type: 'DELETE',
            headers: csrfToken ? { 'X-Splunk-Form-Key': csrfToken } : {}
        });
        _lastPreviewName = null;
    }
    render();

    // Check for ?remix= parameter — auto-import a dashboard
    var remixParam = (window.location.search.match(/[?&]remix=([^&]+)/) || [])[1];
    if (remixParam) {
        var parts = decodeURIComponent(remixParam).split('/');
        var remixApp = parts[0];
        var remixDash = parts[1];
        if (remixApp && remixDash) {
            showToast('Loading dashboard for remix...', 'info');
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(remixApp) + '/data/ui/views/' + encodeURIComponent(remixDash) + '?output_mode=json',
                success: function(data) {
                    var xmlData = data.entry && data.entry[0] && data.entry[0].content && data.entry[0].content['eai:data'];
                    if (xmlData) {
                        try {
                            parseAndLoadXML(xmlData);
                            studio.title = studio.title + ' (Remix)';
                            render();
                            updateCanvasTheme();
                            // Re-init drag-drop after a short delay to ensure SortableJS is loaded
                            setTimeout(function() { initDragDrop(); }, 500);
                            showToast('Dashboard loaded! Edit it here, then Save as a new dashboard.', 'success');
                        } catch(e) {
                            showToast('Could not parse dashboard XML: ' + e.message, 'error');
                        }
                    }
                },
                error: function() {
                    showToast('Could not load dashboard. Check that it exists and you have access.', 'error');
                }
            });
        }
    } else {
        // Show walkthrough on first visit (only when not remixing)
        try {
            if (!localStorage.getItem('sit_ds_walkthrough_done')) {
                setTimeout(showWalkthrough, 800);
            }
        } catch(e) {}
    }
});
