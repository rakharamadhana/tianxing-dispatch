# Changelog

All notable changes to **tianxing-dispatch** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

How to use this file:

- Add your notes under **[Unreleased]** as you work.
- When you cut a release, move those notes into a new `## [x.y.z] - YYYY-MM-DD`
  section, then run `npm version …` and `git push --follow-tags`.
- CI copies that version's section into the GitHub Release notes automatically.

Group changes under: **Added**, **Changed**, **Fixed**, **Removed**.

## [Unreleased]

## [0.2.0-beta.1] - 2026-09-19

### Added
- **Supabase Backend**: Migrated jobs, auth, and driver profiles onto a shared Supabase
  Postgres backend (`projects` table) with real Row-Level-Security-based access control,
  replacing the local-only SQLite store (kept as a fallback).
- **Fuel & Maintenance Requests**: New branch-scoped request screens (driver-submitted,
  manager-approved), backed by Supabase (`gasoline_requests` / `maintenance_requests`).
- **Worker Salary / Payroll**: Jobs can now have named workers assigned with a
  commission %. New Salary view with one row per job payout, filterable by worker,
  project, and date range.
- **Hourly & Packaging job types**: New 時薪 (hourly) and 包材 (packaging, with a
  material list) project types alongside 搬工, with worker-count-aware totals.
- **Income Statement Export**: "Full Summary" export now clones the shared xlsx
  template per month, with a branch-aware yearly Revenue/Cost summary that rolls up
  Fuel and Maintenance costs.

### Fixed
- **CEO branch access**: The CEO account could only ever see its own branch —
  `'headquarters'` was never a valid database value, so the check silently failed.
  CEO detection now uses a real `ceo` role, and the CEO can read/write all three
  branches.
- **Ghost button contrast**: Several buttons (back navigation, approve/reject) used a
  button style meant for the dark header bar, making them nearly invisible on white
  backgrounds. Fixed contrast, and stopped the status chip from stretching across its
  column instead of hugging its own text.

### Removed
- **"Headquarters" branch**: Dropped the unused/broken `總公司` pseudo-branch; branch
  assignment is now strictly Taipei / Hsinchu / Kaohsiung.

## [0.1.4] - 2026-07-10

### Added
- **Year Onboarding Screen**: Intermediate year select view immediately after login.
- **Year Dropdown**: Scopes database results dynamically between 2024 and the current year.
- **Settings View**: A new utility view containing theme toggles, locale switchers, support guides, rating stars, and problem report forms.
- **Extra Large Text size**: Added `xlarge` class to support 18px text layouts.
- **Current Password check**: Added verification constraints to updateProfile to protect email and password changes.
- **Danger Zone**: Added account deactivation and data removal.

### Changed
- **Profile / Settings Separation**: Refactored account details (Email/Password) to a simplified ProfileView, and other options to SettingsView.
- **Enabled Settings tab**: Wired up the settings tab button on the main branch selector.

### Fixed
- **Dark Mode consistency**: Inverted top-left logo patch, styled inactive/disabled tab switchers, input boxes, and page navigators.

## [0.1.3] - 2026-07-08

### Added
- `CHANGELOG.md`, and automatic release notes — each version tag now publishes with its
  changelog section filled into the GitHub Release automatically.

## [0.1.2] - 2026-07-08

### Added
- One-click, per-OS download links in the README that always point to the latest release.

### Changed
- Installer filenames are now version-less (`tianxing-dispatch-setup.exe` /
  `tianxing-dispatch.dmg`) so the "latest download" links never break between versions.

## [0.1.1] - 2026-07-08

### Added
- CI publishes the Windows `.exe` and macOS `.dmg` installers to GitHub Releases on
  every version tag.

## [0.1.0] - 2026-07-08

### Added
- Initial release: dispatch table (出車表) with an editable job grid — date/time,
  customer, move-in/out addresses, unit price, tax toggle, quantity, live total,
  payment method and status.
- Branch tabs (台北 / 新竹 / 高雄); search by date/phone and filter by tax/payment.
- Traditional Chinese by default with a one-press English toggle.
- Demo login with role-based city access (CEO sees all cities; each manager sees only
  their own).
- Local SQLite storage behind a Supabase-ready repository interface.
- Windows / macOS packaging via electron-builder.
