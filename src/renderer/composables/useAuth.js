import { ref, computed } from 'vue'

/**
 * Front-end-only demo auth with fixed dummy accounts.
 *
 * NOTE: this is UI-level gating only (no real backend, no real security).
 * When the app moves to Supabase, replace this store with Supabase Auth +
 * row-level security so branch access is enforced on the server too.
 */

const ALL_BRANCHES = ['台北', '新竹', '高雄']

// email -> account. Password is 123456 for every demo account.
const ACCOUNTS = {
  'ceo@fyf.com.tw': { password: '123456', role: 'ceo', label: 'CEO', branches: [...ALL_BRANCHES] },
  'taipei@fyf.com.tw': { password: '123456', role: 'manager', label: '台北', branches: ['台北'] },
  'hsinchu@fyf.com.tw': { password: '123456', role: 'manager', label: '新竹', branches: ['新竹'] },
  'kaohsiung@fyf.com.tw': { password: '123456', role: 'manager', label: '高雄', branches: ['高雄'] }
}

// Accounts surfaced on the login screen as quick-fill demo chips.
export const DEMO_ACCOUNTS = Object.keys(ACCOUNTS).map((email) => ({
  email,
  label: ACCOUNTS[email].label,
  role: ACCOUNTS[email].role
}))
export const DEMO_PASSWORD = '123456'

const STORAGE_KEY = 'tianxing.auth'

function currentFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const email = JSON.parse(raw).email
    return ACCOUNTS[email] ? { email, ...ACCOUNTS[email] } : null
  } catch {
    return null
  }
}

// Module-level singleton state — every useAuth() call shares this.
const user = ref(currentFromStorage())

export function useAuth() {
  const isAuthed = computed(() => !!user.value)
  const allowedBranches = computed(() => (user.value ? user.value.branches : []))

  function login(email, password) {
    const key = String(email || '').trim().toLowerCase()
    const acct = ACCOUNTS[key]
    if (!acct || acct.password !== password) {
      return { ok: false, error: 'invalidCredentials' }
    }
    user.value = { email: key, ...acct }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: key }))
    return { ok: true }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, isAuthed, allowedBranches, login, logout }
}
