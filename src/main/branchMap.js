/**
 * Maps between the app's Chinese branch labels (used everywhere in the UI
 * and the local SQLite `jobs` table) and Supabase's `branch_type` Postgres
 * enum (headquarters | taipei | hsinchu | kaohsiung).
 */

export const ALL_BRANCHES = ['台北', '新竹', '高雄']
export const HEADQUARTERS_LABEL = '總公司'
// Pseudo-branch: the CEO's combined view across every real branch plus
// headquarters-only rows. Not a real `branch_type` enum value — never sent
// to Supabase as a row's own branch, only used to select the "show everything" query.
export const ALL_LABEL = '全部'
export const ALL_BRANCH_ENUMS = ['taipei', 'hsinchu', 'kaohsiung', 'headquarters']

const LABEL_TO_ENUM = { 台北: 'taipei', 新竹: 'hsinchu', 高雄: 'kaohsiung', 總公司: 'headquarters' }
const ENUM_TO_LABEL = { taipei: '台北', hsinchu: '新竹', kaohsiung: '高雄', headquarters: '總公司' }

export function labelToEnum(label) {
  return LABEL_TO_ENUM[label] || null
}

export function enumToLabel(value) {
  return ENUM_TO_LABEL[value] || null
}

/**
 * CEO (branch = 'headquarters') sees a combined "All" tab (every dispatch
 * branch plus headquarters-only rows) alongside each individual branch tab;
 * a manager sees just their single branch. Only a headquarters user's RLS
 * grants read access to headquarters rows, so those rows are only ever
 * visible via the All tab — headquarters never gets a tab of its own.
 */
export function branchesForEnum(value) {
  if (value === 'headquarters' || !value) return [ALL_LABEL, ...ALL_BRANCHES]
  const label = enumToLabel(value)
  return label ? [label] : []
}
