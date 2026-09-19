# tianxing-dispatch (天興搬家 出車表)

Cross-platform desktop app (Windows + macOS) for the Tianxing Moving Co. dispatch
table. Built with Electron + Vue 3, styled per `DESIGN.md`.

Project / package / repository name: **tianxing-dispatch**.

## Download

Get the latest installer for your operating system — these links always point to the
newest release:

| System | Download |
|--------|----------|
| **Windows** | [⬇ Download for Windows (.exe)](https://github.com/rakharamadhana/tianxing-dispatch/releases/latest/download/tianxing-dispatch-setup.exe) |
| **macOS** | [⬇ Download for macOS (.dmg)](https://github.com/rakharamadhana/tianxing-dispatch/releases/latest/download/tianxing-dispatch.dmg) |

All versions and changelogs: **[Releases page](https://github.com/rakharamadhana/tianxing-dispatch/releases/latest)**.

**First launch (the app isn't code-signed yet):**
- **Windows** — if SmartScreen warns, click **More info → Run anyway**.
- **macOS** — right-click the app → **Open** the first time (Gatekeeper blocks unsigned apps by default).

## Features

- **Accounts & access**: Real Supabase Auth login (no more front-end-only demo
  accounts). Each account is a driver / assistant / manager / CEO, scoped to a
  branch — a manager only ever sees their own branch; the CEO sees a combined
  "全部" (All) tab across all three branches and can move a job between branches.
  Access is enforced server-side (Postgres Row Level Security), not just hidden
  in the UI.
- **Year select**: A lightweight onboarding screen right after login to pick
  the working year before entering the dispatch table.
- **Dispatch table** (branch tabs: 台北 / 新竹 / 高雄, plus 全部 for the CEO):
  - Editable job grid: date/time, customer, move-in/out addresses, unit price,
    tax toggle (含稅/未稅), quantity, live total, payment method + status.
  - Three job types: 搬工 (standard moving), 包材 (packaging, with a per-job
    material list), and 時薪 (hourly) — the latter two price by worker count.
  - Assign named workers to a job with a commission % for payroll.
  - Search by date/phone and filter by tax status/payment status.
  - Save (儲存) / Restore (回復) with unsaved-change tracking and autosave.
- **Fuel requests** (加油): drivers submit a reported amount; managers/CEO
  review and approve or reject it, optionally adjusting the approved amount.
- **Maintenance requests** (保養): drivers submit location/amount/note (with
  an optional receipt link); managers/CEO approve or reject.
- **Salary / Payroll**: one row per job payout (not just a per-worker total),
  filterable by worker, project, and date range.
- **Reports**: per-branch monthly *Summary* and yearly *Full Summary* xlsx
  exports for jobs, fuel, and maintenance, plus a branch-aware yearly
  Revenue/Cost (income statement) export that rolls up fuel and maintenance
  costs against job revenue.
- **Settings & Profile**: dark mode, text size (including an extra-large
  option), a one-press 中文/English toggle (top-right 🌐), update email/password
  (with current-password verification), a support/report-a-problem form with
  a rating widget, and account deletion.

## Roles

| Role | Sees | Notes |
|------|------|-------|
| Driver | Their own branch | Submits fuel/maintenance requests |
| Assistant | Their own branch | |
| Manager | Their own branch | Approves fuel/maintenance requests, edits dispatch/payroll |
| CEO | All branches (全部 tab) | Everything a manager can do, across every branch; can move a job between branches |

## Development

```bash
npm install       # first time (also rebuilds better-sqlite3 for Electron)
npm run dev        # launch the app in dev mode
```

## Data storage

Jobs, auth, and driver/worker profiles live in a shared Supabase (Postgres)
project — see `MIGRATION.md` for the schema and RLS design. Fuel and
maintenance requests are Supabase-only (no local fallback). If Supabase isn't
configured (`MAIN_VITE_SUPABASE_URL` / `MAIN_VITE_SUPABASE_ANON_KEY` in
`.env` — see `.env.example`), jobs fall back to a local SQLite database at the
OS user-data path; all job access goes through
`src/main/repository/JobRepository.js`, so either backend works with no UI
changes.

## Building installers

```bash
npm run build:win   # Windows .exe installer (run on Windows) -> release/
npm run build:mac   # macOS .dmg (must run on macOS) -> release/
```

A macOS `.dmg` **cannot** be built on Windows. Pushing a `v*` tag triggers
`.github/workflows/build.yml`, which builds both installers on GitHub Actions
(Windows + macOS runners) and publishes them straight to a GitHub Release for
that tag — no Mac required, and no manual upload step.
