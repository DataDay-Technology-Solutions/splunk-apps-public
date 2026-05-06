# Splunk Apps Public — Context for Dex / Claude agents

This is the **public-distribution** repo for DataDay's Splunk apps. Apps
here ship to Splunk admins via Splunkbase / direct download. Each
top-level subdirectory is a separate Splunk app with its own
`app.manifest`, `default/app.conf`, and assets.

When triaging a feedback submission tagged with one of these apps, this
file is what you should read first.

## Apps in this repo

| Subdir | Splunk app id | What it is |
|---|---|---|
| `splunk-innovators-toolkit/` | `splunk-innovators-toolkit` | CSS/JS toolkit for Classic Simple XML dashboards — themes, animations, controls, Design Studio. |

## Feedback flow (this repo)

End users hit a 💬 Feedback button in any dashboard that loads the
toolkit's `feedback-widget.js`. The button POSTs directly to
`https://feedback-api.datadaytech.com/api/feedback` with the
toolkit's public API key bundled in the JS (registered as
`splunk-innovators-toolkit` in feedback-api).

That submission gets:

1. Stored in feedback-api's PostgreSQL.
2. Picked up by Dex's `runSweep` cron (every ~15 min) — a triage run
   spawns automatically for any `pending` submission older than 5 min.
3. Routed to a code repo. **For this app, the code lives in the
   private `DataDay-Technology-Solutions/splunk-apps` repo, NOT this
   public repo.** This repo is a downstream distribution mirror; the
   actual development happens in `splunk-apps`. Triages on
   `splunk-innovators-toolkit` feedback should `open_repo` against
   `DataDay-Technology-Solutions/splunk-apps`, not against
   `DataDay-Technology-Solutions/splunk-apps-public`.

## The Trial system — how this app gets in front of users

Most submissions you'll see for `splunk-innovators-toolkit` come from
the **self-service trial system** at `trials.datadaytech.com`, not from
existing Splunkbase installs (yet). The trial system stands up a fully
provisioned Splunk Cloud-like sandbox with the Innovators Toolkit
pre-installed so prospects (often via the Splunk Innovators Network
LinkedIn group) can kick the tires before downloading.

### Trial system topology

- **Production host**: Proxmox node `192.168.72.111` LXC `110`
- **Service**: systemd `trial-manager`, FastAPI backend at
  `trials.datadaytech.com`
- **Code root on prod**: `/opt/trial-manager`
- **Two-repo layout (important):**
  - **Parent**: `/opt/trial-manager/` —
    `DataDay-Technology-Solutions/self-service-trials` (FastAPI backend,
    dashboard, Traefik routing config).
  - **Nested**: `/opt/trial-manager/apps/splunk-innovators-toolkit-repo/`
    — `DataDay-Technology-Solutions/splunk-apps` (the actual Splunk app
    source). This is a **nested git repo, NOT a registered git
    submodule** — there's no `.gitmodules` entry in the parent. A
    naive `git pull` on the parent does NOT touch the nested repo.

### deploy.sh on the trial host

After PR #53 to `self-service-trials`, the deploy is:

- `./deploy.sh deploy` — pulls BOTH repos + restarts service + prints
  the deployed parent SHA, splunk-apps SHA, and installed Splunk app
  versions.
- `./deploy.sh pull` — pull both layers (no restart).
- `./deploy.sh pull-core` / `pull-apps` — pull one layer only.
- `./deploy.sh versions` — read-only inspection of what's deployed.
- `./deploy.sh sync` — local→prod file push (dev mode only — see the
  warning in `self-service-trials`'s CLAUDE.md about overwriting
  hotfixes that landed via the deploy.sh path).

### Common failure modes (operational)

- **Stale `.git/index.lock`** — interrupted git operations leave a
  lock file that silently blocks all future pulls. The new
  `remote_safe_pull` reaper removes locks older than 10 min. If
  something even older blocks, `pct exec 110 -- ls -la
  /opt/trial-manager/apps/splunk-innovators-toolkit-repo/.git/index.lock`.
- **`SA-ECA-backup/` / `SA-ECA-temp-backup/` directories** appearing
  in the nested repo — those are someone's manual backups. They'll
  show up as duplicate `v1.0.0` / `v1.x.x` apps in the Splunk UI.
  Delete them.
- **GitHub PAT embedded in the remote URL** on the LXC (e.g.
  `ghp_lAH...`, `gho_m6Y...`) — known security follow-up to rotate to
  a deploy key.

### CLAUDE.md gotchas already in `self-service-trials`

- Branch protection on `main`; never direct-push, always PR.
- HTML element IDs must be unique across ALL tabs (not just the
  visible one) — Splunk dashboards inject content into a single DOM.
- Service worker `sw.js` is network-first; bump `CACHE_NAME` when
  changing SW logic.
- Cache-bust static assets with `?v=N` in `dashboard.html`.
- Temperatures display in Fahrenheit (user pref).
- Auth flow: login response includes `api_key` (master `API_KEY` from
  `.env`) — JS stores it for `X-API-Key` header. Sessions are
  in-memory; service restart invalidates them.

## How to triage feedback against this app (Dex playbook)

1. **Read the user's description verbatim.** The feedback's
   `context.url` will usually point at a Splunk dashboard URL. The
   `tags` array typically contains `splunk-innovators-toolkit` plus
   the Splunk app the dashboard belongs to (e.g. `search`,
   `dashboard-studio`, custom installs).
2. **Distinguish "Toolkit bug" vs "Trial host bug" vs "user
   misuse".** Look at `context.userAgent` (browser + OS), `context.
   splunkUser`, `context.dashboardName`. If the dashboardName is
   `null` and the URL hostname is `trials.datadaytech.com`, the bug
   is more likely in the trial system (FastAPI, Traefik, signup
   flow). If the user is on their own Splunk install
   (`splunkbase.splunk.com` referrer or unknown hostname), the bug is
   in the Toolkit code itself.
3. **For Toolkit code bugs**, `open_repo` against
   `DataDay-Technology-Solutions/splunk-apps` (the private dev repo —
   NOT splunk-apps-public). Patch there. After merge,
   `splunk-apps-public` gets a release-time export, NOT a per-fix push.
4. **For trial-system bugs**, `open_repo` against
   `DataDay-Technology-Solutions/self-service-trials`. The CLAUDE.md
   in that repo has further conventions — read it first.
5. **For user-misuse / "is this expected behavior?" submissions**, do
   NOT recommend a code change. Reply via `record_customer_summary`
   with the corrected mental model + a doc link. Mark the feedback as
   `failed` rather than `completed` so the email body explains the
   non-fix outcome.

## Steve

Steve Koelpin (DataDay co-founder, Splunk SME) is the primary author of
the Innovators Toolkit and the trial system. When you see feedback from
Steve specifically, treat it as an **internal validation test** rather
than a customer report — he's testing flows end-to-end, not necessarily
reporting unknown bugs. Be precise; if the symptom doesn't match a
known-broken pattern, ask if it's a real bug or a smoke test before
patching.
