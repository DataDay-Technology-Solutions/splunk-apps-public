# Splunkbase / Contest Listing Copy — Blast Radius

Drop-in copy for the Splunkbase listing and the contest submission. Three lengths
(tagline / short / full) so you can paste whichever each field wants.

---

## App title
**Blast Radius — DVR Attack Replay & Detection-Gap Scoring**

## Tagline (one line)
Scrub a multi-phase cyber attack across a live topology like a DVR — then see, in
one number, how many of those techniques your detections would actually catch.

## Short description (~50 words, for the listing summary field)
Blast Radius turns an attack into something you can *replay*. Scrub a multi-phase
kill chain across an animated topology — hosts light up, the blast radius spreads,
the attacker narrates each move. Then a quantified **Detection Coverage Score** and
per-tactic MITRE gap table show exactly where you're blind. Runs on bundled demo
data out of the box, or your real CIM-tagged data.

---

## Full description

**What if you could DVR an attack?**

Blast Radius is an interactive incident-replay dashboard. Pick a scenario, hit play,
and watch a multi-phase attack unfold across an animated network topology — initial
access, credential dumping, lateral movement, golden-ticket forgery, exfiltration —
each host lighting up by risk as the blast radius spreads. Scrub the timeline back
and forth like a video, and the topology, the kill-chain phase, and the attacker's
own running commentary move with you. When a critical event lands (LSASS dump,
DCSync, Golden Ticket) the whole canvas pulses red.

**It doesn't just *show* the attack — it scores your blind spots.**

Every replay is paired with a quantified **Detection Coverage Score** (0–100), a
count of **undetected high-risk techniques**, and a **MITRE ATT&CK Detection
Coverage by Tactic** table sorted worst-first — so the analyst instantly sees which
tactics (Privilege Escalation, Collection, Defense Evasion…) they have *zero*
coverage for. It's the difference between "here's what happened" and "here's where
you'd have missed it."

**Two modes, one engine:**
- **Demo mode** streams three hand-crafted, CIM-compliant scenarios (APT-29-style
  espionage, fast ransomware, slow insider theft) into a local index — zero setup,
  works the moment you install it. Perfect for SOC training, tabletops, and
  customer-facing breach narratives.
- **Live mode** points the *same* replay engine and detection-gap analysis at your
  real CIM-tagged production data, clustering events into kill-chain phases on the
  fly. When there's no data, it tells you so plainly instead of showing empty panels.

**Built like a Splunk app should be:** a shared base search drives the demo panels
(one job, not eight), the SPL leans on `tstats` / `streamstats` / `eventstats`, every
table drills down to the raw events, and it's keyboard- and screen-reader-aware.
No external dependencies; CIM data models recommended (works without).

### Who it's for
- **SOC analysts & IR teams** — reconstruct an incident and pivot to the raw events
- **Detection engineers / purple teams** — quantify and close MITRE coverage gaps
- **SOC trainers** — run a full kill chain as a 90-second teaching tool
- **MSSPs / consultants** — a visceral "this is what an attack looks like" narrative

### 30-second tour
1. Open **Blast Radius**. Click the orange **⚡** button → **Stream Scenario**.
2. Hit **▶** and watch the attack replay across the topology. Drag the timeline to
   scrub; click any node to inspect it.
3. Scroll to the **Detection Coverage Score** and the per-tactic gap table — see
   exactly where you're blind.
4. Click any technique in **Top Notable Events** to drill into the raw events.
5. Switch **Data Source → Live** to run the same analysis on your real data.

### Requirements
- Splunk Enterprise 9.x+ (built/tested on 10.2.3), Classic dashboards
- Optional: Splunk Common Information Model (CIM) for accelerated Live-mode queries —
  the dashboard degrades gracefully without it
- No external app dependencies

### Install
1. Install the app (Splunkbase or `$SPLUNK_HOME/etc/apps`) and restart Splunk.
2. Open **Attack Replay → Blast Radius**.
3. Click the **⚡ Stream Scenario** button to load bundled demo data, or switch to
   **Live** mode to use your own CIM-tagged data.

---

## Contest "why this is different" blurb (for the submission notes)
Most dashboards *display* data. Blast Radius makes you *experience* an attack — a
DVR-scrubbed, narrated replay on a custom-built animated topology, in Classic Simple
XML (no Dashboard Studio, no external JS libs). Then it does the thing no topology
dashboard does: it scores your detection coverage against what just happened and
shows you the gaps. It's original in *form* (the replay), original in *substance*
(the coverage scoring), and it's engineered to Splunk best practices end-to-end.
