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
