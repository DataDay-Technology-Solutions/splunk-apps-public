# Innovators Toolkit

A community toolkit from the [Splunk Innovators Network](https://www.linkedin.com/groups/16364058/).

Add professional polish to your Splunk Classic dashboards — premium themes, animated backgrounds, interactive controls, and a visual Design Studio. No CSS or JS knowledge required.

## Quick Start

1. Install the app from Splunkbase or upload the package
2. Open any dashboard and add a theme:
   ```xml
   <dashboard stylesheet="splunk-innovators-toolkit:themes/gradient-luxury.css">
   ```
3. Or open Design Studio to visually import and polish your existing dashboards

## Features

### 12 Premium Themes
arctic-frost, corporate-modern, cyberpunk-neon, dark-mode-pro, executive-boardroom, glass-dashboard, gradient-luxury, newspaper-editorial, retro-terminal, soc-command-center, splunk-innovator-signature, synthwave-sunset

### 14 Animated Backgrounds
Animated mesh gradient, aurora borealis, blueprint, circuit board, cyberpunk grid, dark topography, gradient wave, matrix data rain, noise grain, particle network, radar sweep, starfield parallax, video ambient loop

### Interactive Controls
Dark/light mode toggle, fullscreen button, collapsible panels, panel zoom, keyboard shortcuts, auto-refresh countdown, tab navigation, right-click context menu, drag resize, filter chips, sidebar panel, user preferences

### Design Studio
Visual dashboard builder with drag-and-drop components, multi-page tab support, import/remix existing dashboards, preview mode, custom templates, version history, panel drilldown, conditional visibility, and form inputs.

### 9 Demo Dashboards
Pre-built dashboards that work out of the box against `index=_internal`:
- Splunk Health Monitor (skipped searches, queue health, indexing throughput)
- Security Operations Center (alerts, auth failures, investigation queue)
- Cyberpunk NOC, Executive Report, Infrastructure Monitor
- Search Analytics, Retro Terminal, Data Pipeline, Audit Trail

## Usage

### CSS-Only (Works Everywhere Including Splunk Cloud)
```xml
<dashboard version="1.1"
  stylesheet="splunk-innovators-toolkit:themes/soc-command-center.css,
             splunk-innovators-toolkit:backgrounds/radar-sweep.css,
             splunk-innovators-toolkit:animations/hover-glow-border.css">
```

### With Interactive Controls (Classic Simple XML)
```xml
<dashboard version="1.1"
  stylesheet="splunk-innovators-toolkit:themes/cyberpunk-neon.css"
  script="splunk-innovators-toolkit:toggles/dark-light-mode.js,
          splunk-innovators-toolkit:toggles/fullscreen-mode.js">
```

## Requirements

- Splunk Enterprise 9.0+ or Splunk Cloud
- Classic Simple XML dashboards (version="1.1")
- **Classic Simple XML dashboards only** (version="1.1")
- Not compatible with Dashboard Studio dashboards (different DOM architecture)
- JS features require the `script=` attribute which is Classic-only
- CSS themes target Classic selectors (.dashboard-body, .dashboard-panel) which don't exist in Dashboard Studio

## Support

- **Community**: [Splunk Innovators Network on LinkedIn](https://www.linkedin.com/groups/16364058/)
- **Email**: steve@datadaytechnology.com
- **Issues**: Contact DataDay Technology Solutions

## Compatibility

- **Splunk Enterprise 9.0+** and **Splunk Cloud** (Cloud Mode uses Download XML workflow)
- Classic Simple XML dashboards only — **not compatible with Dashboard Studio**
- Tested on Splunk 10.2.1

## License

MIT License — Copyright (c) 2026 DataDay Technology Solutions / Splunk Innovators Network

This is a community-created toolkit. Not affiliated with or endorsed by Splunk Inc.
"Splunk" is a trademark of Splunk Inc. This app is designed to work with Splunk software.
