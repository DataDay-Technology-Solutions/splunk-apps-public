# Changelog

All notable changes to this project will be documented in this file.

## [v1.9.5] - 2026-06-03

### Changed — Attack Narrative is now a clean timeline
- The narrative used to render the middle phases as one run-on paragraph that was hard
  to read. It's now a **scannable list, one event per row** with aligned columns:
  time · host · what happened · ATT&CK technique.

### Fixed — Lane-view layout
- **Tactic legend** moved clearly **below the x-axis time labels** (it was overlapping
  them); the transport controls drop nearer the scrubber so the legend has room.

### Changed — ⛶ button is now true fullscreen
- The ⛶ transport button **toggles fullscreen** of the replay (the icon reads as
  fullscreen). Double-click the chart still resets pan/zoom.

## [v1.9.4] - 2026-06-03

### Fixed — Lane-view interaction polish
- **⛶ "fit to view" button** was a no-op in lane mode — it now resets the lane
  timeline's pan/zoom (previously only a double-click did).
- **Lane event tooltip couldn't be dismissed** — clicking a dot pinned a card that
  only auto-hid after 7s. It now has an **× button, click-outside, and Esc** to close.
- **Tactic legend was hidden** behind the transport controls / scrubber that overlay
  the SVG's bottom band. The legend now renders in a clear strip above the controls,
  with a readable background.

### Changed — Scrubber label readability
- The playhead **timestamp** is now prominent (first line, larger), and the
  **"Operation Stillwater — Phase N"** line is bigger so the scenario/phase reads at a
  glance.

### Added — Live mode hides demo controls
- In **Live mode** the **Scenario dropdown** and the orange **demo Stream FAB** are now
  hidden, so a user can't confuse the two data sources or accidentally stream bundled
  scenarios into `index=sa_attack_sim` next to real production data.

## [v1.9.3] - 2026-06-03

### Fixed — Demo: streamed scenario now matches the dashboard filter
- The floating demo button (FAB) streamed its **own** internal scenario (defaulting to
  *Midnight Eclipse*), decoupled from the main **Scenario** dropdown that the SPL panels
  filter on. So selecting *Operation Stillwater* up top and clicking Stream landed
  *Midnight Eclipse* data in the index while the panels still filtered for Stillwater —
  leaving the downstream panels empty even though data had been streamed.
- The FAB now streams the scenario selected in the **main dashboard dropdown**, the two
  scenario controls are kept in lock-step (bidirectional sync), and after a stream the
  dashboard filter is pointed at the just-streamed scenario. The panels are then
  **auto-refreshed** (the SearchManagers are re-dispatched on a short spread of retries,
  since a plain Submit reuses the cached pre-stream job and indexing makes the events
  searchable a few seconds later) — so "select a scenario → Stream" reliably populates
  the panels with no manual Submit. Verified end-to-end on Stillwater (4/6/95),
  Ironclaw (6/8/100), and Silent Drift (3/27/95). (Demo SPL panels still only show
  events within the selected time range; a fresh stream anchors events to *now*.)

## [v1.9.2] - 2026-06-01

### Changed — Lane-view declutter (SOC incident-timeline polish)
- The host-swimlane incident timeline (v1.9.x) no longer inherits the old force-graph
  overlay chrome. In lane mode the stale **Protocols/Nodes legend** and the **"DEMO MODE"
  badge** are hidden, and the **playhead KPI counters** move to the top-right — clearing
  the SVG's top band so the attacker-thought caption sits alone in real dead space with
  no overlap. Driven by a `lanes-mode` class on the root + scoped CSS; the thought caption
  width is capped to ~60% of the plot so it can never reach the relocated counters.

### Added — Mode- and entity-aware panel titles
- Panel titles now name what you're looking at: a `title_entity` token (e.g. a specific
  host/IP/user, or "all hosts") and a `title_mode` token ("bundled demo scenario" vs
  "live CIM data"). `title_entity` is recomputed by a lightweight hidden search so it
  updates on **any** entity change — UI, URL deep-link, or programmatic. Titles like
  "Compromised Hosts — WS-MROSS (live CIM data)" make demo-vs-live and scope unambiguous.

### Fixed — Live/Demo mode gating (demo data persisting in Live mode)
- Switching to **Live** — or opening a `?form.mode=live` deep-link — could leave the demo
  panels (and their bundled `index=sa_attack_sim` data) rendering underneath the live
  ones, because the `mode_demo` token wasn't reliably cleared. The SimpleXML radio
  `<change>` handler doesn't fire when a mode is applied from the URL on initial load.
  A small **JS mode normalizer** (ar_features.js) now derives the live/demo gate
  (`mode_demo`/`mode_live`), the KPI macros, and the title wording from the actual mode
  value on every change — URL, programmatic, or click — so demo and live never co-render.
  The `<init>` block no longer hard-sets the `mode` token, so a live deep-link is honored.

### Fixed — Live-mode lane legibility
- Lane events with no ATT&CK tactic (common in real CIM data) now render as a labeled
  **"Untagged (no ATT&CK tag)"** entry in the legend and tooltip instead of an unexplained
  grey dot.

## [v1.9.1] - 2026-06-01

### Added
- **Pan + scroll-zoom** on the host-lane timeline (drag to pan, wheel to zoom toward the cursor, double-click resets) for finer granularity.
- **Click/hover event tooltip** on lane dots — MITRE technique, tactic, host → dest, time, description, and risk.

### Fixed
- **Attack Narrative** is now generated from the selected scenario's bundled events (JS), so it refreshes instantly on a scenario switch, matches the lane view, and works without streaming. (It previously stuck on the last-streamed scenario because the SPL panel didn't re-render on a zero-result scenario.)
- **Attacker thought caption** moved into the lane SVG's reserved top band (true dead space) — it can no longer overlap the tactic legend or surrounding panels, on any scenario or window size; dwell greatly increased.
- Aligned the require `?v=` cache-bust across `ar_blast`/`ar_controls`/`ar_features` so `ar_streamer` resolves to a single fresh module (a stale copy was missing `op_stillwater`, which silently broke the narrative for it).

## [v1.9.0] - 2026-05-31

### Added — SOC-analyst host-lane incident timeline (primary visual)
- **Host-swimlane "incident timeline"** replaces the force-graph as the primary visual (`ar_lanes.js`): each entity (host/user/external) is a lane, the X-axis is time, every event is a dot colored by MITRE tactic, a red "now" line sweeps as the DVR plays, with a wrapped tactic legend below. Works for all demos AND live mode.
- **Pan + scroll-zoom** on the timeline for granularity (drag to pan, wheel to zoom, double-click resets).
- **Click/hover event tooltip** — technique, tactic, host→dest, time, description, risk.
- **Operation Stillwater** — a realistic 21-day low-and-slow APT scenario, indexed compressed into the dashboard window so panels still populate; first-person attacker narration across the three weeks.
- **Date-aware timeline** — campaign start/end + per-phase "Day N · date · time"; scrubber end-labels show the true span.
- **Summary-index seeding on stream** — streaming a scenario now seeds `summary_sa_attack_replay`; `ar_kpi_from_summary` rewritten to prefer summary then fall back to raw (fixes a latent double-count).

### Fixed
- Scenario switch now rebuilds the topology AND the description (handler bound to both token models / event names).
- "Search in Splunk" + table drilldowns pointed at a non-existent in-app `search` view (404) — now target Search & Reporting.
- Topology no longer fails to render the opening phase (`currentTimeIndex` init) or churns on duplicate data callbacks.
- SPL: lateral "Destinations" populated; LSASS/DCSync group by real host (not container id); ransomware detector fires on its own demo; live MITRE-coverage inventory broadened.
- Attacker thought captions restored + dwell greatly increased.
- Require'd JS modules cache-bust on release (`?v=`) so upgrades load fresh.

## [v1.8.0] - 2026-05-30

### Added — Detection-coverage scoring (SplunkTrust-panel round 2, Originality)
- **Detection Coverage Score** KPI — a single 0–100 posture number (16% on the demo data): "% of observed techniques with a bundled detection." Color-blocked red/amber/green.
- **Undetected High-Risk Techniques** KPI — count of techniques with `risk_score >= 70` and no detection (21 on demo data).
- **MITRE ATT&CK Detection Coverage by Tactic** table — per-tactic coverage %, techniques observed, gap count, and max risk, sorted worst-first with heat-mapped color formatting (Privilege Escalation/Collection/Defense Evasion show 0% coverage). Turns the passive detection-gap table into a quantified, glanceable risk-posture view. All three run as post-process children of the shared `demo_base` search. Browser-verified rendering.
- **Critical-event "Red Alert" pulse** — the topology canvas flashes crimson for ~2s when a `risk_score >= 95` node lands (LSASS dump, DCSync, Golden Ticket) — a visceral "oh no" beat synced to the replay. Respects `prefers-reduced-motion`.

### Added — per-scenario description, above the topology
- The **Attack Narrative** panel moved **above** the topology and now leads with a
  **per-scenario description** that updates live with the Scenario dropdown — name,
  subtitle, the full attack story, and the real-world-span note. Selecting "All
  Scenarios" shows a three-line overview of the bundled attacks. So an analyst knows
  exactly what they're watching before/while the replay runs.

### Housekeeping
- Collapsed the cache-busting versioned asset copies (`ar_blast-v160…v165.js`,
  `attack-replay-v1xx.css`, etc.) back to clean unversioned filenames referenced by
  the dashboard — removes repo bloat and appinspect noise.

### Fixed — true DVR rewind (reconstruct past state)
- Scrubbing/rewinding the timeline now rebuilds the topology to its **exact state at
  that moment** — going back removes the nodes/edges that hadn't happened yet, instead
  of leaving an append-only graph. Added:
  - **Drag-to-scrub**: click *or drag* the timeline; the blast radius reconstructs live
    as you move (reset + replay up to the playhead, rAF-coalesced for smoothness).
  - **Step-back button** (⏪) next to step-forward — rebuilds to the previous event.
  - **Keyboard scrubbing** (←/→ step, Home/End) on the focused timeline (WCAG 2.1.1).

### Changed — Attack Narrative placement
- Moved the **Attack Narrative** panel directly under the topology (was last) so the
  analyst reads the auto-generated "what just happened" summary right after watching
  the replay — clearer storytelling for each scenario in Demo mode.

### Changed — Attacker thought-bubble dwell time
- The in-replay attacker callouts ("2.3GB customer database staged…") held for a fixed 3.6s regardless of length, so the longer ones vanished before you could finish reading. Display time now scales with text length (`max(5.5s, ~95ms/char)`), keeping the long callouts on screen ~6–7.6s.

### Changed — Topology label readability
- Node labels (host names / IPs) and edge technique labels now render with a dark `paint-order: stroke` **text-halo** plus brighter, bolder, slightly larger type. In a dense blast radius the labels previously washed into the background and collided illegibly; they now stay crisp over edges, node glow, and adjacent labels — directly improving the hero topology screenshot.

### Added/Changed — Rounds 3–5 (Practical / Visual / Description)
- **Practical**: demo Host Blast Radius table is now click-to-drilldown (row → that host's raw events). (Live-mode table drilldowns + a "run correlation searches" panel are specced and ready to wire once real CIM data is available to verify against.)
- **Visual**: themed result-table polish — comfortable cell padding, monospace for technical columns (technique IDs / hosts / IPs), faint cyan row-hover affordance signalling clickable rows, and tidier empty states.
- **Description**: README corrected (33 macros, 20 eventtypes), documented the base-search / coverage-scoring / Red Alert features + a new 30-second-tour step; sharpened the `app.conf` launcher pitch to lead with the Detection Coverage Score differentiator; PDF-briefing footer version → v1.8.0.

### Changed — Technical hardening (SplunkTrust-panel round 1)
- **Base-search refactor**: the 8 demo analysis panels now post-process ONE shared base search (`demo_base` → `ar_demo_base`) instead of each dispatching its own `index=sa_attack_sim` job. Standard Splunk dashboard best practice; cuts the demo dashboard from 8 search jobs to 1 + 8 lightweight post-process children. Every post-process chain was CLI-verified to produce output identical to the original macro, and all 8 panels were confirmed rendering correctly in the browser.
  - Fixed a Simple-XML token-collision the refactor exposed: the "Would our detections fire?" post-process used regex `$`-anchors (`^T1059\.001$`), which Splunk's dashboard parser read as `$token$` delimiters → the panel hung on "Search is waiting for input". Escaped each literal `$` as `$$`.
- **`ar_lateral_signature_clusters`**: replaced the opaque `cluster t=0.8` (which collapsed 12 lateral events into 2 meaningless rows) with deterministic protocol/technique grouping — now returns labeled patterns (Valid Accounts, SMB, RDP, PsExec, SSH, MSSQL, MySQL) with event counts and max risk.
- **`ar_attack_velocity`**: reordered to `timechart` → `streamstats` so the spike-vs-baseline columns survive (the prior `streamstats`-then-`timechart` silently dropped the alert column).
- **`ar_patient_zero`**: `stats earliest()` instead of `sort 0 _time | head 1` — no full-dataset sort.
- **`ar_detections_triggered`**: anchored `mvfind("^T….$")` exact-technique matching instead of `mvjoin`+`match` (prevents substring false matches).
- **`ar_host_blast_radius`**: `coalesce(peak_risk,0)` so hosts with no risk_score don't render blank cells on real data.

## [v1.6.0] - 2026-05-30

### Added — Graceful degradation for Live mode (no CIM data)
- **"No CIM data in range" guard banner.** When Live mode finds no CIM-tagged events outside the demo index, an amber banner now explains that this is expected on a fresh install (not an error) and points the user to Demo mode. Replaces a wall of empty/confusing panels — the single biggest credibility risk for a fresh install / contest-judge environment.
- New macro `ar_live_data_check` — a cheap `head 1` probe that drives a dashboard `<condition>` token (`live_data_missing`) to show/hide the guard.

### Fixed — Live macros searched internal indexes (self-referential false positive)
- `ar_live_data_check`, `ar_live_base`, and `ar_max_risk_live` used `NOT index=sa_attack_sim` **without** a positive `index=*`, so they searched Splunk's internal `_audit`/`_internal` indexes. Searching for `mitre_technique=*` then matched the audit log of the search **itself** — a self-referential false positive that made Live mode report Splunk's own audit noise as "real attack data." Scoped all three to `index=*` (excludes internal indexes, where CIM data never lives). Verified against a clean container: probe now correctly returns `has_data=0`.

### Fixed — MITRE coverage panel threw a `rex` error
- `ar_live_mitre_coverage`'s detection-coverage subsearch used `rex field=search "T\d{4}..."` with **no named capture group**, which Splunk rejects outright (`The regex ... does not extract anything`). Added the named group `(?<mitre_technique>...)`, a null guard, broadened the REST search to all apps (`-/-`) so it actually finds ES correlation searches (not just this app's), and pinned `splunk_server=local`. Panel now renders cleanly (graceful empty state with no CIM data) instead of a red error.

### Changed — DVR controls layout
- Moved the playback controls (rewind / play-pause / step / speed / fit) **clearly above the status bar**. They previously sat at `bottom: 90px`, colliding with the top rim of the ~70px-tall timeline/status container — the buttons appeared to rest on the scrubber's edge. Raised to `bottom: 124px` with `z-index` so they float with a clean gap above it.

### Added / Changed — UX polish pass
- **First-run hint** overlay on the topology ("Replaying the attack… drag the timeline or use the controls below to scrub"), hides on any control interaction or after 6s.
- **Disambiguated the topology overlay counters** ("Compromised · now / Active · now / Peak risk") from the KPI tiles above (which show totals for the whole range), with an explanatory tooltip.
- **Idle scrubber** now reads "Loading replay… / start / end" instead of bare `--:--:--`.
- **Export bar** (Copy Link + Export Briefing) moved from `position:fixed` (which overlapped the KPI tiles when scrolled) into a right-aligned in-flow strip.
- **Default time range** changed from 4h to **24h** so demo KPIs populate on first load.
- **Honest "compressed timeline" footnote** on each scenario card — states the real-world campaign duration (e.g. multi-week APT dwell) vs the compressed simulated span, so the replay's time compression is transparent rather than misleading.

### Fixed — robustness, correctness, accessibility (deep-eval pass)
- **Live-mode probe** now `depends="$mode_live$"` so the `index=*` data-presence fan-out no longer runs in Demo mode.
- **JS crash hardening**: `handleResize` guards against a divide-by-zero (0 prior size → NaN viewBox blanking the topology); `showTooltip` early-exits and null-guards every DOM write (a throw there previously killed all subsequent node clicks).
- **WCAG**: `aria-label` toggles on the play/pause button, live `aria-valuenow`/`aria-valuetext` on the scrubber, a global `prefers-reduced-motion` guard, and `:focus-visible` rings on all custom interactive controls.
- **SPL correctness**: `ar_bytes_exfiltrated` no longer keys on the non-existent `orig_sourcetype` (catches large exfil by volume instead); `ar_live_auth_anomalies` requires ≥3 attempts before flagging off-hours to kill single-event false positives.
- **Readability**: bumped 14 unreadable 8–9px font declarations (MITRE technique IDs, Attack Chain labels) to 10–10.5px so they survive listing screenshots.
- **Packaging**: added `app.manifest` (required by Splunkbase appinspect).
- **Docs**: README now documents Live mode (detection-gap matrix, Export Briefing, Copy Link), corrected the macro count (29), and removed a misleading screenshot footnote.

### Fixed — final polish (post 10-phase end-to-end test)
- **README screenshots blocker**: the Screenshots section referenced 6 PNGs that didn't exist on disk (broken-image placeholders on GitHub/Splunkbase). Reworked to feature the working animated demo GIF + a descriptive bullet list; zero broken image links remain.
- **Mode switch**: flipping the Data Source radio at runtime now resets the topology and reloads for the new mode (added a `change:mode` handler) — Live mode no longer shows leftover demo nodes. The demo-only Recommended Actions + Incident Response Playbook rows are now gated `depends="$mode_demo$"`.
- **Realism**: replaced an impossible single 800 MB packet to port 53 with a realistic DNS tunnel (~2.7 MB over 6,240 TXT queries); fixed an internal MITRE inconsistency (T1558.001 tagged two different tactics).
- Minor: PDF briefing header version string → v1.6.0; stripped a stray `_time` column from the live first-seen fallback; repaired a malformed CSS comment header.
- Validated by a structured 10-phase end-to-end test (every demo + live macro executes cleanly, XML/JS/packaging/CIM/a11y/docs all pass) — two reviewer-proposed "fixes" were rejected after verification as false positives (they would have broken working behavior).

### Verified
- Full Demo-mode flow exercised end-to-end on a clean Splunk 10.2.3 container: stream scenario → 80 events injected → KPIs populate (9 hosts / 19 connections / risk 100) → DVR topology renders the full blast radius with risk-tier coloring and protocol-colored edges → scrubbing works.

## [v1.5.3] - 2026-05-26

### Added — Shareable investigation links
- **Copy Link button** (top-right floating, next to Export Briefing). Builds a URL containing the current entity, time range, mode, scenario, AND playhead offset (`?t=NN`), copies to clipboard, shows "Copied!" feedback.
- **URL playhead parser** — on page load, if `?t=NN` is present, the DVR seeks to that offset after the scenario finishes loading. Works for both demo and live scenarios (retries up to 15× over 9 seconds while Live mode CIM query completes).
- Replaces the "ping me on Slack with screenshots" workflow — analyst can now share the exact moment of an investigation with one click.

## [v1.5.2] - 2026-05-26

### Added — One-click PDF export
- **Export Briefing button** (top-right floating). Triggers `window.print()`. Browser's print dialog opens; user selects "Save as PDF" (most modern browsers default to PDF preview).
- **Comprehensive print stylesheet** strips Splunk chrome (nav, filters, FAB, DVR controls, demo button), forces monochrome-friendly rendering, hides demo-only fluff, and adds a print-only header: "INCIDENT BRIEFING — Blast Radius — Entity: $X$ — Time Range: $earliest$ → $latest$ — Generated by SA-attack-replay v1.5.2".
- Tables get black-on-white borders for paper readability. Page-break hints prevent rows from splitting across pages.
- The topology SVG remains visible in the printed output at its current playhead state — frozen snapshot of the kill chain.
- No external dependencies (no jsPDF / html2canvas) — pure browser print path.

## [v1.5.1] - 2026-05-26

### Added — Topology replay against real CIM data
The existing DVR-style topology animation now works on real production data, not just the bundled demo scenarios. Same engine, same scrubbing, same phase banners — but the scenario is materialized from a live CIM query instead of `ar_streamer.js`.

How it works:
1. On dashboard load with `mode=live`, a search runs: `| `ar_live_top_events("$entity$")` | sort _time | head 300`
2. JS clusters the events into phases using **5-minute MITRE tactic buckets** — each time the dominant tactic changes between buckets, a new phase boundary is created. Tactic names normalized to ATT&CK canonical labels (Initial Access, Credential Access, Lateral Movement, etc.).
3. Hosts become nodes (risk-colored by max risk_score). `src→dest` pairs become edges. Non-RFC1918 destinations are flagged `EXT-*` and rendered as external nodes.
4. The materialized `{nodes, timeline}` object is fed into the same `initWithData()` path the demo uses → same DVR scrubber, same phase banners, same hover tooltips, same drilldowns.
5. Empty result (no matching events) → topology shows the empty state with controls still functional, so the analyst gets clear feedback that the time-range + entity combo had nothing matching.

### Added — JS
- `clusterEventsByTactic(events)` — phase-boundary detection by MITRE tactic change
- `materializeLiveScenario(rows, sid)` — rows → `{nodes, timeline}` compatible with the existing DVR engine
- `generateLiveScenario(entity, _, callback)` — async wrapper that runs the SearchManager + materializes + calls back
- `generateScenario(callback)` — mode-aware sync/async dispatcher
- `invalidateLiveScenarioCache()` — clears the cache (for v1.5.2 mode-toggle handling)
- 15-second hard timeout fallback so the topology always initializes even if Splunk is slow.

### Changed
- `init()` now branches on `form.mode` token. Live mode bypasses the legacy `tryESData()` (which mixed demo + CIM concerns) and goes directly to `generateLiveScenario()`.
- Live mode banner updated to describe what now works: topology replay + insight panels both powered by real data.

## [v1.5.0] - 2026-05-26

### Added — Live mode delivers real analyst insight
Pivoted the app's value prop from "demo-only" to "actually useful for IR analysts." Live mode now shows real, actionable insight from any CIM-tagged production data.

- **Investigation Summary** — when activity started, when it ended, span in minutes. Powered by `ar_live_first_seen` macro.
- **Blast Radius Summary** — distinct hosts touched, users involved, network destinations contacted, MITRE techniques observed. Powered by `ar_live_blast_summary` macro.
- **MITRE ATT&CK Coverage Matrix** — every technique observed in the time range, joined against your `savedsearches.conf` to surface **DETECTION GAP**s (technique seen but no correlation search exists for it). The single most actionable insight in the app: tells the SOC manager exactly which detections are missing for the attack patterns happening in their environment. Powered by `ar_live_mitre_coverage`.
- **Top-Risk Events Table** — the 20 highest-risk_score events for the entity in the time range, with full host/user/dest/technique/tactic/description/risk_score. Color-coded by risk score. Powered by `ar_live_top_events`.
- **Anomaly Trio** (three side-by-side tables) —
  - **Anomalous Destinations** — non-RFC1918 outbound destinations the entity contacted (`ar_live_anomalous_destinations`)
  - **Authentication Anomalies** — failure bursts (>3) and off-hours (before 6am, after 8pm) auth events (`ar_live_auth_anomalies`)
  - **Suspicious Processes** — LOLBins (`certutil -urlcache`, `bitsadmin`, `mshta`), `%TEMP%`/`%APPDATA%` execution, encoded PowerShell (`ar_live_suspicious_processes`)

### Added — Macros
- `ar_live_base(entity)` — shared CIM-tag base search excluding demo index. Used by all 7 live macros.
- `ar_live_first_seen(entity)` — investigation timeline boundaries
- `ar_live_blast_summary(entity)` — single-row hosts/users/destinations/techniques counts
- `ar_live_top_events(entity)` — top-N risk_score events
- `ar_live_mitre_coverage(entity)` — observed-vs-detected technique matrix
- `ar_live_anomalous_destinations(entity)` — non-RFC1918 egress
- `ar_live_auth_anomalies(entity)` — off-hours / failure bursts
- `ar_live_suspicious_processes(entity)` — LOLBins + path anomalies

### Changed
- Live mode banner rewritten to describe the new value: "KPIs + Investigation Summary + MITRE coverage matrix + top-risk events all show your real CIM-tagged production data. Topology replay against real data lands in v1.5.1."

### Coming in v1.5.1
- Topology replay against real data — same DVR engine, scenario derived from CIM query results with 5-min MITRE-tactic-bucket phase clustering, factual third-person narration.

## [v1.4.0] - 2026-05-26

### Changed — Demo/Live data isolation
- **Live mode no longer shows demo data.** Demo events were CIM-tagged so they were appearing in Live mode CIM data model queries (correct by design for "Live mode works on tagged data," but confusing in practice). All 3 Live KPI macros (`ar_compromised_count_live`, `ar_connection_count_live`, `ar_max_risk_live`) now include `NOT index=sa_attack_sim` / `AND index!=sa_attack_sim` so Live KPIs only count real production data.
- **Scenario-specific panels are hidden in Live mode.** Event Volume by Kill Chain Phase, Top Notable Events, SOC Q&A row, Attack Velocity, Host Blast Radius, and Auto-Narrate query the hard-coded demo index and have no meaningful Live equivalent yet — wrapped in `<row depends="$mode_demo$">` so they only render in Demo mode. Real-data replay arrives in v1.5.0.
- **Live mode banner rewritten** to explain the new behavior: "KPIs are your real production numbers. Scenario-specific panels are hidden — switch to Demo to explore bundled scenarios, or wait for v1.5.0 for real-data replay."

### Added — Topology UX
- **Fit-to-view button** in the play-controls toolbar (⛶) resets the topology zoom + pan to its initial framing in one click. ARIA-labeled, keyboard-focusable.
- **Scroll-trap fix on the topology SVG.** Mousewheel previously zoomed the topology, capturing every wheel event and trapping the user inside the panel when trying to scroll the dashboard. Zoom now requires `Ctrl+wheel` (or `Cmd+wheel` on macOS) — plain mousewheel scrolls the page normally.

## [v1.3.2] - 2026-05-26

### Added
- **Animated demo GIF** at top of README (`docs/screenshots/00-demo.gif`, 1499×812, 3.4 MB, 18 frames). Captures the demo flow: orange FAB → scenario picker → STREAMING phase progression → ✓ COMPLETE — DATA LIVE. Replaces the static `01-hero.png` placeholder so the Splunkbase / GitHub listing has a moving demo without judges having to install.

## [v1.3.1] - 2026-05-26

### Fixed
- **Live mode KPI panels threw `Error in 'tstats' command: This command must be the first command of a search.`** Splunk Web's dashboard renderer auto-prefixes `search ` to `<query>` text that doesn't begin with `|`. Because `ar_compromised_count_live` and `ar_connection_count_live` definitions began with `| tstats`, the panel's effective search became `search | tstats ...` — putting `tstats` as the *second* command. Fix:
  - Removed the leading `|` from both macro definitions (now start directly with `tstats`).
  - Added explicit `| ` prefix to the 3 KPI `<query>` strings in `blast_radius.xml` so the panel never falls into Splunk's `search ` auto-prefix path.
  - `ar_connection_count_live` also picked up the missing `append [| makeresults ...]` guarantee that the other KPI macros use (so it returns `count=0` instead of "No results found" when the data model is empty).

## [v1.3.0] - 2026-05-26

### Performance
- **Removed duplicate `ar_narrative_events` search.** `blast_radius.xml` had a hidden `<row depends="$ar_narrate_feed$">` that ran the narrative macro from XML, while `ar_features.js` ran the *same* macro via a SearchManager. The XML row's `depends` token was never set, so the panel was hidden but the search still ran — twice per dashboard load. Deleted the XML row entirely.

### Accessibility
- **Keyboard focus + ARIA on playback controls.** `play-controls` now has `role="toolbar"`. Each `.play-btn` has `aria-label` and `type="button"`. The DVR slider has `role="slider"`, `tabindex="0"`, and `aria-valuemin/max/now`. Tooltip toggles `aria-hidden` in sync with `.visible`. New `:focus-visible` outline styles for `.play-btn`, `.time-slider-track`, and `#demo-fab`.

### Responsive
- **Mobile breakpoint (≤768px) no longer overlaps topology chrome.** `.blast-legend` repositioned to bottom-right, `.blast-stats` shrunk and re-anchored top-left, `.time-slider-container` and `.play-controls` re-spaced. Topology container grown to 460px so the playhead area stays visible.

### Fixed
- **Tooltip click-handler leak.** `showTooltip()` in `ar_blast.js` registered a new `document.click` listener on every node click and only removed one when fired. Rapid clicks stacked listeners → all fired together on first dismiss, breaking subsequent tooltips. Replaced with a single module-scoped `_activeTipDismiss` that is removed before re-attaching.
- **Node-tooltip drilldown** now also searches `src_ip`, `dest_ip`, and `orig_host` fields (previously only `host`/`src`/`dest`), so IP-labeled topology nodes return results instead of empty searches.
- **Data-model probe timeout** in `ar_blast.js` dropped from 5s to 2.5s. Reduces the "LIVE MODE error" flash on first load when Splunk is slow to respond to the CIM probe.

## [v1.2.0] - 2026-05-25

### Added
- **KPI drilldowns** on the 3 single-value tiles (Compromised Hosts, Active Connections, Max Risk Score) — click any tile to open a Splunk search showing the underlying matching events. Adds an exploration path that judges can click through.
- **README judging-criteria mapping table** + 30-second tour section + 7 placeholder screenshots referenced from `docs/screenshots/`.
- **`docs/screenshots/CAPTURE.md`** — guide for capturing the 7 README screenshots locally.

### Changed
- **`ar_max_risk_live`** macro no longer depends on the ES-only `Risk` data model. Rewritten to compute max risk from any tagged event (`tag=alert`, `tag=attack`, `risk_score=*`, or `mitre_technique=*`) with a `coalesce` fallback to numeric severity. Live mode now works in vanilla Splunk Enterprise without Enterprise Security installed.

### Fixed
- **`ar_streamer.js`** had three bare-comma syntax errors inside scenario object literals (lines 43, 214, 356) — one per scenario. Splunk's RequireJS loader tolerated them silently but stricter parsers (Node, V8 `new Function()`) rejected the whole file. Removed.

## [v1.1.1] - 2026-05-25

### Fixed
- **KPI panels showed "No results found" instead of `0` when no events matched.**
  - Root cause: `| stats max(...) | fillnull value=0 count` returns 0 rows when input is empty; `fillnull` only fills existing rows, so the panel rendered Splunk's default empty-result message instead of a numeric zero.
  - Fix applied to `ar_compromised_count_demo`, `ar_max_risk_demo`, `ar_compromised_count_live`, `ar_max_risk_live`: append a guaranteed-0 row via `makeresults` then `stats max(count)` to coalesce.
  - Verified end-to-end: with a non-matching entity filter (worst-case empty result), all KPIs now correctly render `0`.

## [v1.1.0] - 2026-05-25

### Added
- **Configuration page** (`configuration.xml`) — dedicated dark-themed settings UI:
  - Live Mode Readiness probe table (auto-detects which CIM data models are installed/accelerated)
  - Defaults for Mode (Demo/Live), Scenario, Time Range, Entity Filter, Protocol Filter, Playback Speed
  - Playback & Display toggles (Auto-play, Phase banners, Attacker thought-bubbles, Recommended Actions panel, Mode banner)
  - `localStorage` persistence with versioned key `sa-attack-replay-cfg-v1`
- **Recommended Actions IR playbook** (`lookups/ar_recommendations.csv`) — 18 data-driven, severity-graded incident response actions tied to each scenario.
- **Advanced macros** in `macros.conf`:
  - `ar_attack_velocity` — `streamstats` events-per-minute calculation for phase pacing
  - `ar_lateral_signature_clusters` — `cluster` command on auth/network patterns to surface lateral-movement signatures
  - `ar_host_blast_radius` — `eventstats` host-impact scoring weighted by phase + asset criticality
  - `ar_kpi_from_summary` — Splunk_SA_CIM summary-index fallback for live-mode KPIs
- **Bundled CIM data model definitions** (`default/data/models/{Authentication,Network_Traffic,Endpoint}.json`) — Live mode works without external Splunk_SA_CIM install.
- **Topology hero polish**: 9-node attack chain, color-coded protocols, phase-name overlay, attacker thought-bubbles narrative annotations.
- **MITRE ATT&CK donut**, SOC Q&A panel, Host Blast Radius treemap, Auto-Narrate timeline.
- App icons / alt logos for nav and launcher.
- Documentation screenshots in `docs/screenshots/`.

### Changed
- Major typography + visual polish pass (Bloomberg-terminal + cyberpunk aesthetic).
- All custom JS modules renamed `ar_*.js` (resolves RequireJS module collision with sibling SA-attack-analyzer).
- `blast_radius.xml` expanded from 6 → 11+ panels.
- Demo scenario streamer (`ar_streamer.js`) — phase events + per-event attacker thoughts.

### Fixed
- Splunk HTML-panel sanitizer was stripping inline `<style>` and `<script>` tags from the Configuration page — moved to external `appserver/static/css/cfg-v2.css` and `appserver/static/js/cfg-v2.js` referenced via dashboard `stylesheet=` / `script=` attributes.
- Splunk `bootstrap-dark.css` was forcing `height: 32px; line-height: 32px` on selects, clipping text behind the chevron — overridden with `!important` in `cfg-v2.css`.
- Form `<button>` default `type="submit"` was reloading the page on Save — all Configuration buttons now `type="button"`.
- Toggle row labels were unreadable behind highlighted backgrounds — explicit transparent backgrounds + white text in `cfg-v2.css`.
- 14 issues from brutal judge-perspective audit pass (8 + 6).

## [v1.0.0] - 2026-05-24

### Added
- Initial release for Splunk Community Dashboard Contest 2026.
- Single dashboard: **Blast Radius** — animated attack topology with DVR-style scrubbing.
- 6-panel layout: 3 KPI singles (Compromised / Connections / Max Risk), hero SVG topology, phase timeline chart, notable events table.
- 3 built-in attack scenarios streamable via the demo control panel:
  - **Operation Midnight Eclipse** — APT-29 style espionage (6 phases, ~80 events)
  - **Operation Ironclaw** — Ransomware deployment (5 phases, ~65 events)
  - **Operation Silent Drift** — Insider data theft (4 phases, ~50 events)
- CIM-compliant demo data — events tagged into `Authentication`, `Network_Traffic`, `Endpoint`, `Web`, `Malware`, `Email`, `Change` data models without external TA dependencies.
- All dashboard SPL queries use `| tstats summariesonly=false` against ES data models — same code path on demo data or real CIM-tagged production data.
- Playback speed selector: 0.5x / 1x / 2x / 4x.
- Phase-transition banner annotations during playback.
- ES-style correlation searches (`savedsearches.conf`) bundled — would actually detect each scenario in production.
- "Clear Demo Data" button for repeatable demos.

### Notes
- Author: Steve Koelpin (`@skoelpin`) / DataDay Technology Solutions
- License: Apache 2.0
- Splunk version: 10.2.3+
- Recommended companion app: Splunk_SA_CIM (for accelerated data models)
