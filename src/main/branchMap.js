/**
 * Maps between the app's Chinese branch labels (used everywhere in the UI
 * and the local SQLite `jobs` table) and Supabase's `branch_type` Postgres
 * enum (taipei | hsinchu | kaohsiung).
 */

export const ALL_BRANCHES = ['台北', '新竹', '高雄']
// Pseudo-branch: the CEO's combined view across every real branch. Not a
// real `branch_type` enum value — never sent to Supabase as a row's own
// branch, only used to select the "show everything" query.
export const ALL_LABEL = '全部'
export const ALL_BRANCH_ENUMS = ['taipei', 'hsinchu', 'kaohsiung']

const LABEL_TO_ENUM = { 台北: 'taipei', 新竹: 'hsinchu', 高雄: 'kaohsiung' }
const ENUM_TO_LABEL = { taipei: '台北', hsinchu: '新竹', kaohsiung: '高雄' }

export function labelToEnum(label) {
  return LABEL_TO_ENUM[label] || null
}

export function enumToLabel(value) {
  return ENUM_TO_LABEL[value] || null
}

/**
 * A manager sees just their single branch. The CEO (role = 'ceo') instead
 * gets a combined "All" tab across every branch — see auth.js, which
 * decides branches based on role rather than calling this for a CEO.
 */
export function branchesForEnum(value) {
  const label = enumToLabel(value)
  return label ? [label] : []
}
