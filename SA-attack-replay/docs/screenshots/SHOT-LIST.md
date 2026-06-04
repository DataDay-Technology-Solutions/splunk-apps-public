# Screenshot Shot-List — Blast Radius (SA-attack-replay)

Capture guide for the Splunkbase / GitHub listing gallery. Every step below was
verified working in the running app (v1.8.0 / build 19). Total time ~15 minutes.

**Capture settings:** browser at **1440×900 or wider**, dark OS theme, 100% zoom.
Use the browser's built-in screenshot or ⌘⇧4. Save as PNG into this folder using
the exact filenames below (the README already references them).

**One-time setup (required before any topology shot):**
1. Open `http://localhost:8002/en-US/app/SA-attack-replay/blast_radius`
2. Demo mode is the default. Click the **orange ⚡ FAB** (bottom-right) →
   **STREAM SCENARIO** → wait for "✓ COMPLETE — DATA LIVE" → click to dismiss.
3. Set **Time Range = Last 24 hours**, **Scenario = All Scenarios**, then Submit.
   (KPIs should read 9 / 19 / 100.)

---

## 00-demo.gif — hero (ALREADY EXISTS, keep)
The animated end-to-end flow. Stays as the listing's lead visual.

## 01-hero-topology.png — THE money shot
- **Shows:** the blast radius mid-replay — risk-colored nodes, protocol-colored
  edges, attacker thought-bubble, DVR scrubber.
- **How:** scroll to the topology. Press **▶** then immediately **⏸**, or click the
  **⏭ step-forward** button **~7–8 times** to reach **Phase 4 (Deeper Compromise)**.
  *Tip: Phase 4 (~9–11 nodes) photographs cleaner than the maxed Phase 6 — full
  enough to read as "spreading," sparse enough that labels breathe.*
- **Crop:** the topology panel only (KPI overlay top-left through the scrubber).
- **Why it matters:** this is the single most memorable, original frame. Lead the
  still gallery with it.

## 02-coverage-scoring.png — the differentiator
- **Shows:** Detection Coverage Score **16%** + Undetected High-Risk **21** KPIs and
  the color-coded **MITRE Detection Coverage by Tactic** table (Priv-Esc 0% red …).
- **How:** scroll down past the topology and the 4 "When/Who/What/Detections" KPIs
  to the two coverage KPIs + the tactic table.
- **Crop:** both coverage KPIs + the full tactic table.
- **Why:** this is the strongest "no other Splunk app does this" image — quantified
  detection-gap posture. Put it second.

## 03-dvr-controls.png — the signature interaction
- **Shows:** the playback controls (⏮ ▶ ⏭ 1x ⛶) + the timeline scrubber with the
  phase banner ("Operation Midnight Eclipse — Phase N").
- **How:** same topology view; crop tight on the controls + scrubber bar.
- **Why:** communicates "DVR for attacks" in one glance.

## 04-detection-singles.png — the analyst questions
- **Shows:** the four single-value KPIs: **When did this start? / Who got hit first?
  (WS-JSMITH) / What did they steal? (4,501 MB) / Would our detections fire? (5)**.
- **How:** the row directly under the big KPI tiles.
- **Crop:** the 4 single-value panels as one strip.
- **Why:** frames the app around the questions an IR analyst actually asks.

## 05-recommended-actions.png — practical IR value
- **Shows:** the **Recommended Actions** header + **Incident Response Playbook**
  table (severity / action / MITRE refs / scenario).
- **How:** scroll down past the coverage table.
- **Crop:** header + first ~8 playbook rows.
- **Why:** proves it's not just a viz — it tells the analyst what to do next.

## 06-stream-fab.png — the demo engine
- **Shows:** the **Stream Attack Scenario** panel (scenario card: 6 phases / 80
  events / 9 hosts / ~1h simulated + the compressed-timeline note + STREAM button).
- **How:** click the orange ⚡ FAB to open the panel (don't stream again — just open).
- **Crop:** the panel.
- **Why:** shows the self-contained demo data generator — judges can run it with zero
  setup, which de-risks installation.

## 07-live-guard.png — graceful degradation (engineering maturity)
- **Shows:** **LIVE MODE** banner + amber **"NO CIM DATA IN THIS RANGE"** guard.
- **How:** switch **Data Source → Live (CIM data models)** + Submit.
- **Crop:** the LIVE banner + the amber guard banner.
- **Why:** a subtle but real signal of polish — the app never shows a broken-looking
  empty state; it explains itself. Reviewers notice this.

## 08-configuration.png — the config UX (optional)
- **Shows:** the **Configuration** page.
- **How:** click **Configuration** in the app nav.
- **Crop:** full settings panel.

---

### Gallery order for the listing
1. `00-demo.gif` (lead)  2. `01-hero-topology.png`  3. `02-coverage-scoring.png`
4. `03-dvr-controls.png`  5. `04-detection-singles.png`  6. `05-recommended-actions.png`
7. `06-stream-fab.png`  8. `07-live-guard.png`

After capturing, drop the PNGs in this folder and the README table renders them
automatically (no path changes needed).
