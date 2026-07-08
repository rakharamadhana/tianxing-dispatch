# tianxing-dispatch (天興搬家 出車表)

Cross-platform desktop app (Windows + macOS) for the Tianxing Moving Co. dispatch
table. Built with Electron + Vue 3, styled per `DESIGN.md`.

Project / package / repository name: **tianxing-dispatch**.

## Features (v0.1)

- Editable job grid: date/time, customer, move-in/out addresses, unit price,
  tax toggle (含稅/未稅), quantity, live total, payment method + status.
- Branch tabs (台北 / 新竹 / 高雄); each branch has its own jobs.
- Search by date/phone and filter by tax/payment.
- Save (儲存) / Restore (回復) with unsaved-change tracking.
- Traditional Chinese by default, one-press toggle to English (top-right 🌐).

## Development

```bash
npm install       # first time (also rebuilds better-sqlite3 for Electron)
npm run dev        # launch the app in dev mode
```

## Data storage

Jobs are stored locally in SQLite at the OS user-data path (temporary backend).
All access goes through `src/main/repository/JobRepository.js`; a future
`SupabaseJobRepository` implements the same interface to move to the cloud with
no UI changes.

## Building installers

```bash
npm run build:win   # Windows .exe installer (run on Windows) -> release/
npm run build:mac   # macOS .dmg (must run on macOS) -> release/
```

A macOS `.dmg` **cannot** be built on Windows. Pushing a `v*` tag triggers
`.github/workflows/build.yml`, which builds both installers on GitHub Actions
(Windows + macOS runners) and uploads them as artifacts — no Mac required.
