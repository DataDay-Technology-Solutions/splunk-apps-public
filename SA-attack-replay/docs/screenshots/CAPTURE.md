# Screenshot capture guide

The README and Splunkbase listing reference 7 PNG files in this directory. Capture
them once with the dashboard running, drop them in alongside this file, and
commit. Targeted ~1600×1000 (Retina) so they look sharp when embedded.

## Setup

1. Open the dashboard at `http://localhost:8002/en-US/app/SA-attack-replay/blast_radius`
2. Click the orange demo FAB → pick **Operation Midnight Eclipse** → STREAM SCENARIO
3. Wait for "✓ COMPLETE — DATA LIVE"
4. Click **Submit** on the dashboard filter row
5. macOS: `Cmd+Shift+4 → Space → click window` (captures the browser window cleanly with shadow)

## Shot list

| File | What it shows | How to frame |
|---|---|---|
| `01-hero.png` | Full top-of-page: header + filter row + DEMO MODE banner + 3 KPI singles + first ~300px of topology | Scroll to top, capture viewport |
| `02-topology-mid-replay.png` | Hero topology while playing through Phase 3 or 4 (nodes + edges drawn, attacker thought-bubble visible) | Start playback, capture mid-animation |
| `03-dvr-controls.png` | Zoom-in on the DVR scrubber + 5 phase chips + current phase label (e.g. "7:55:41 PM — Phase 3: Credential Access") | Capture just the bottom of the hero panel |
| `04-soc-qa.png` | "When did this start? / Who got hit first? / What did they steal? / Would our detections fire?" row | Scroll down past the notable events table |
| `05-recommended-actions.png` | Recommended Actions IR playbook table — show 5–8 rows including HIGH/MED/LOW severity colored chips | Scroll to the bottom of the dashboard |
| `06-demo-fab.png` | Orange demo FAB opened: scenario picker + preview card (6 PHASES / 80 EVENTS / 9 HOSTS / ~1h SPAN) + STREAM SCENARIO button | Click FAB without starting stream |
| `07-configuration.png` | Configuration page top: LIVE MODE READINESS probe table + DATA SOURCE & SCOPE section | Navigate to `…/configuration`, scroll partway down |

## Optional: animated GIF for Splunkbase

Use `ffmpeg` against a Quicktime screen recording of the demo run (orange FAB → stream → topology animates → DVR scrub):

```bash
ffmpeg -i recording.mov -vf "fps=12,scale=1200:-1:flags=lanczos" -loop 0 docs/screenshots/00-demo.gif
```

Reference it at the top of the README in place of `01-hero.png` if you want.
