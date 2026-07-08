# Tianxing Design System

This document defines the reusable visual language for Tianxing Moving Co. web and app projects. Use it when building related internal tools, staff apps, customer portals, or admin dashboards so the company products feel consistent.

## Brand Direction

Tianxing products should feel operational, trustworthy, and quick to scan. The interface is for real work: scheduling, project settlement, payroll confirmation, account management, and status checking.

Use a quiet work-tool layout with strong status clarity. Avoid marketing-style hero sections, oversized decorative graphics, soft gradient blobs, or card-heavy landing-page composition.

## Core Colors

Use these as the main tokens:

```css
:root {
  --brand-red: #e3452f;
  --brand-blue: #16aeb8;
  --ink: #0a1729;
  --navy: #0a1729;
  --page-bg: #f5f7fb;
  --card-bg: #ffffff;
  --line: #e4eaf2;
  --muted-line: #edf1f5;
  --text-muted: #6e7f94;
  --text-soft: #738399;
}
```

Color roles:

- `--brand-blue` is the primary action color. Use it for main buttons, active mobile tabs, segmented-control active states, and important app headers.
- `--brand-red` is the brand accent. Use it for logo accents, text actions, switches, destructive emphasis when appropriate, and sheet options.
- `--navy` is the desktop shell/header color.
- `--page-bg` is the default background.
- White cards sit on `--page-bg` with subtle borders.

Status colors:

```css
.status.scheduled {
  color: #b86311;
  background: #fff4db;
}

.status.complete {
  color: #137a54;
  background: #def6e9;
}

.status.muted {
  color: #6b7788;
  background: #eef2f6;
}

.auth-message.error {
  color: #b42318;
  background: #fff1f0;
}
```

Use orange for pending or unconfirmed states, green for complete or received states, gray for internal or neutral states, and red only for errors/destructive actions.

## Typography

Default font stack:

```css
font-family: "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif;
```

Rules:

- Use Traditional Chinese as the default product language.
- Keep letter spacing at `0` for normal headings and UI text.
- Use heavy weights for labels, buttons, status chips, and navigation.
- Keep body/detail text compact. This is an operations app, not an editorial site.

Recommended sizes:

- Page title: `32px`, weight `900`, line-height `1.2`
- Card title: `18px` to `28px`, depending on available space
- Body copy: `13px` to `14px`
- Field label: `12px`, weight `800`
- Status chip: `11px`, weight `900`
- Bottom tab label: `10px` to `11px`, weight `900`

## Layout Principles

Use a full-width app shell with constrained inner content.

Desktop/admin layout:

- Top shell/header uses dark navy.
- Logo sits in a white patch for contrast.
- Main content max width: `1480px`
- Main content padding: `44px clamp(24px, 5vw, 74px)`
- Use grids for dashboards and forms.

Mobile/app-style HR layout:

- Primary navigation belongs at the bottom, like a native app.
- Keep four main tabs visible.
- Current tab uses `--brand-blue` with white icon/text.
- Leave bottom padding so content does not hide behind the nav.

Avoid nested cards. Cards should frame individual tools, lists, settings panels, or repeated items.

## Shape And Elevation

Default radius:

- Inputs/buttons/cards: `5px` to `8px`
- Status chips: `20px` or full pill
- Avatars: `50%`
- Bottom app nav: `8px`

Borders:

```css
border: 1px solid #e4eaf2;
```

Use subtle shadows only for floating app surfaces:

```css
box-shadow: 0 14px 34px rgba(10,23,41,.07);
box-shadow: 0 18px 48px rgba(10,23,41,.16);
```

Do not overuse shadows. Most work surfaces should rely on border, spacing, and background.

## Buttons

Primary button:

```css
.primary-button {
  border: 1px solid var(--brand-blue);
  border-radius: 5px;
  padding: 11px 16px;
  color: #fff;
  background: var(--brand-blue);
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(22,174,184,.22);
}
```

Secondary button:

```css
.secondary-button {
  border: 1px solid #cbd9e9;
  border-radius: 5px;
  padding: 11px 16px;
  color: #264e81;
  background: #fff;
  font-weight: 900;
}
```

Guidelines:

- Use one primary action per form or screen.
- Use icon buttons for compact toolbar actions, search, back, edit, and navigation.
- Use text buttons for clear commands such as Save, Cancel, Logout, and Delete account.
- Use `small` buttons only inside rows or compact controls.

## Forms

Fields:

```css
label {
  display: grid;
  gap: 7px;
  color: #40536d;
  font-size: 12px;
  font-weight: 800;
}

input, select, textarea {
  width: 100%;
  border: 1px solid #cbd7e5;
  border-radius: 5px;
  padding: 11px 12px;
  color: #0a1729;
  background: #fff;
}
```

Form grid:

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.span-2 {
  grid-column: span 2;
}
```

Rules:

- Use two-column form grids on desktop.
- Collapse to one column on mobile.
- Put the final create/save action at the bottom when the workflow is form-heavy.
- For long notes, use a textarea with a character counter.

## Lists And Tables

Use compact rows for projects and records.

Project/history row:

- Date block on the left
- Main title and details in the center
- Amount and status on the right
- Row border top: `#e7edf4`
- Hover background: `#f8fbfd`

Use lists rather than large panels when many records are expected. Open detail pages/panels only after a row is selected.

## Status And Payroll Rows

Payroll rows should remain highly scannable:

- Role dot
- Person name
- Role label and deduction/allocation note
- Amount
- Transfer status
- Received status

Role dots:

```css
.role-dot.driver { background: #2f74c0; }
.role-dot.assistant { background: #e5328b; }
.role-dot.office { background: #7b61c7; }
```

Project billing should keep the existing Tianxing settlement logic:

- Driver counts as 2 units.
- Assistant counts as 1 unit.
- Base unit = project amount / total units.
- Driver gross = base unit × 2.
- Assistant gross = base unit × 1.
- Driver contributes 25%.
- Assistant contributes 40%.
- Office/admin receives all contributed amounts.

Time billing is separate:

- Show only when billing type is time based.
- Fields: hours, driver amount, assistant amount.
- Driver amount = driver rate × hours.
- Assistant amount = assistant rate × hours.

## Bottom Navigation

For app-like HR/customer experiences, use fixed bottom navigation.

```css
.hr-bottom-nav {
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 18px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 760px;
  border: 1px solid #dfe8f2;
  border-radius: 8px;
  padding: 8px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 18px 48px rgba(10,23,41,.16);
  backdrop-filter: blur(12px);
}
```

Navigation rules:

- Use four primary tabs where possible.
- Use icons plus short labels.
- Active tab uses `--brand-blue`.
- Bottom nav should stay visible and not overlap content.

## Settings And Profile

Profile screens should feel native-app-like:

- Top profile card with avatar, name, and role.
- Settings is a row button that opens a deeper settings view.
- Logout sits below settings.
- Delete account belongs inside settings under account/security.

Settings rows:

- Icon on the left
- Title and short description in the middle
- Chevron/toggle/value on the right
- Row separator between items

Use action sheets for short option choices such as language, font size, and transfer state.

## Action Sheets

Use bottom sheets for quick choices.

```css
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  background: rgba(10,23,41,.35);
}

.action-sheet {
  width: min(560px, 100%);
  display: grid;
  gap: 8px;
}
```

Rules:

- Sheet options use brand red text.
- Cancel is visually separated at the bottom.
- Tap outside closes the sheet.
- Use sheets for binary/small option sets, not long forms.

## Authentication Screens

Auth screens use a centered panel over a soft background.

```css
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #f7f9fd 0%, #eef6fb 46%, #fff7fb 100%);
}
```

Rules:

- Show Tianxing logo at the top.
- Keep inputs simple: email, password, captcha.
- Error messages use red-tinted panels.
- Success messages use green-tinted panels.
- Do not make auth pages decorative or marketing-heavy.

## Responsive Rules

Mobile:

- Collapse grids to one column.
- Reduce card padding to about `16px` to `20px`.
- Bottom nav left/right: `12px`; bottom: `12px`.
- Payroll rows collapse actions/statuses onto new lines.
- Avoid text overflow inside buttons and rows.

Desktop:

- Use wider content grids for overview + detail.
- Keep operational lists dense and scannable.
- Use the dark header/sidebar shell to anchor the brand.

## Icons

Use simple line icons with:

```css
fill: none;
stroke: currentColor;
stroke-width: 2;
stroke-linecap: round;
stroke-linejoin: round;
```

Prefer icons for:

- Bottom tabs
- Search
- Back
- Edit
- Settings
- Account/security rows

Avoid replacing obvious icons with text-only rounded rectangles.

## Copywriting Tone

Use direct operational labels:

- 新增項目
- 待處理項目
- 歷史紀錄
- 我的
- 結束時間
- 計費方式
- 人員名單
- 備注項目
- 已匯款
- 未處理
- 確認到帳

Keep labels short. Avoid explanatory text inside the app unless the user needs it to complete the workflow.

## Do Not Do

- Do not dominate pages with a single hue family.
- Do not use purple/blue gradients as the main theme.
- Do not use beige/brown/orange-heavy palettes.
- Do not create marketing landing pages for operational tools.
- Do not put cards inside cards.
- Do not use oversized hero typography inside dashboards or app screens.
- Do not hide primary work actions behind decorative UI.
- Do not let text overflow buttons, chips, or rows.

## File References

The current implementation uses these source files:

- `src/style.css`
- `src/main/AppShell.vue`
- `src/main/LoginView.vue`
- `src/main/RegisterView.vue`
- `src/main/HR/HrView.vue`
- `src/main/HR/NewProjectView.vue`
- `src/main/HR/PendingProjectsView.vue`
- `src/main/HR/HistoryView.vue`
- `src/main/HR/HrProfileView.vue`

When starting a related Tianxing project, copy the color tokens, typography, button styles, form styles, card rules, status styles, action sheet rules, and bottom navigation pattern first.
