# Changelog

All notable changes to the Innovators Toolkit are documented here.

## [2.0.0] - 2026-04-16

### Renamed
- App renamed from "Splunk Innovators Toolkit" to **"Innovators Toolkit"** for Splunkbase naming compliance
- App ID remains `splunk-innovators-toolkit` (unchanged for backward compatibility)
- Community name unchanged: Splunk Innovators Network on LinkedIn



### Added
- Design Studio: visual dashboard builder with 4 tabs (Components, Effects, Colors, Settings)
- 4th tab "Colors" — theme, per-theme text color presets, background
- Splunk Cloud Mode toggle in top bar (enabled by default)
- Download XML primary action for Cloud users (no REST write required)
- Hide by Value — conditional panel visibility based on search results (equals, less than, greater than, contains, is empty)
- 9 production-ready demo dashboards (SOC, Cyberpunk NOC, Executive Report, Arctic Infra, Synthwave, Retro Terminal, Glass Pipeline, Newspaper Audit, Internal Metrics)
- 12 premium themes (Cyberpunk Neon, Dark Mode Pro, Executive Boardroom, Arctic Frost, Synthwave Sunset, Retro Terminal, Glass Dashboard, Gradient Luxury, Newspaper Editorial, Corporate Modern, SOC Command Center, Innovator Signature)
- 14 animated backgrounds (Matrix Data Rain, Particle Network, Aurora Borealis, Cyberpunk Grid Pulse, Radar Sweep, Starfield Parallax, Blueprint, Circuit Board, Dark Topography, Noise Grain, Mesh Gradient, Gradient Wave, Video Ambient Loop)
- 11 interactive controls (Dark/Light Toggle, Fullscreen, Panel Collapse, Panel Zoom, Auto-Refresh Countdown, Keyboard Shortcuts, Right-Click Menu, Drag Resize, Filter Chips, Sidebar Slide Panel, User Preferences)
- 17 HTML widgets (Live Clock, Countdown, Speedometer Gauge, Liquid Gauge, QR Code, Team Board, Weather, Traffic Lights, KPI Progress, Sparkline, Network Map, Globe 3D, Heatmap Calendar, Kanban, Org Chart, Terminal Log, Timeline Gantt)
- 29 animations and effects
- Remix button on dashboards — opens in Design Studio with widget types preserved
- Floating config popover (doesn't push panel off screen)
- Landing page rewrite — 3-path onboarding (Import / Template / Demos)
- Design Studio first-visit walkthrough

### Fixed
- CDATA HTML escaping bug — widgets now use inline XHTML with `&#160;`
- `data-target` attribute stripping — countdown uses `data-countdown-date`
- Gauge widgets now render as standalone SVG in HTML panels (no Splunk 10.2 single-value DOM dependency)
- Text color presets now apply via CSS custom properties (defeats `!important` rules)
- Config popover no longer pushes panels off screen (position:fixed)
- Effect checkbox scroll preservation (custom span replaces native checkbox, no focus auto-scroll)
- SPL comma errors across 4 demo dashboards (case/if/strftime/coalesce)
- Nav bar readability on all themes via CSS Modules wildcard selectors
- Panel entrance animations no longer conflict with opacity styles
- All widgets retry initialization (4 timeouts) to catch late-loading DOM

### Changed
- Cloud Mode moved from Settings tab to top bar pill switch
- Theme dropdown moved from Settings to Colors tab
- Panel config popover reorganized: Hide by Value at top, Advanced section collapsible
- is_configured = 0 (required for Splunkbase Cloud)
- Metadata permissions include sc_admin for Splunk Cloud

### Splunk Cloud Compatibility
- Passes AppInspect Cloud vetting (0 failures, 0 errors)
- No REST handlers, no scripted inputs, no Python/bin scripts
- No external network calls from JavaScript
- CSS-only mode works everywhere (Classic XML required for JS features)

## Requirements
- Splunk Enterprise 9.0+ or Splunk Cloud
- Classic Simple XML dashboards (version="1.1")
- Not compatible with Dashboard Studio
