import { ref, computed } from 'vue'

/**
 * Front-end-only demo auth with fixed dummy accounts.
 *
 * NOTE: this is UI-level gating only (no real backend, no real security).
 * When the app moves to Supabase, replace this store with Supabase Auth +
 * row-level security so branch access is enforced on the server too.
 */

const ALL_BRANCHES = ['台北', '新竹', '高雄']

const DEFAULT_ACCOUNTS = {
  'ceo@fyf.com.tw': { password: '123456', role: 'ceo', label: 'CEO', branches: [...ALL_BRANCHES] },
  'taipei@fyf.com.tw': { password: '123456', role: 'manager', label: '台北', branches: ['台北'] },
  'hsinchu@fyf.com.tw': { password: '123456', role: 'manager', label: '新竹', branches: ['新竹'] },
  'kaohsiung@fyf.com.tw': { password: '123456', role: 'manager', label: '高雄', branches: ['高雄'] }
}

const ACCOUNTS_STORAGE_KEY = 'tianxing.accounts'

function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load accounts', e)
  }
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
  return { ...DEFAULT_ACCOUNTS }
}

let accounts = loadAccounts()

// Accounts surfaced on the login screen as quick-fill demo chips.
export const DEMO_ACCOUNTS = Object.keys(DEFAULT_ACCOUNTS).map((email) => ({
  email,
  label: DEFAULT_ACCOUNTS[email].label,
  role: DEFAULT_ACCOUNTS[email].role
}))
export const DEMO_PASSWORD = '123456'

const STORAGE_KEY = 'tianxing.auth'

function currentFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const email = JSON.parse(raw).email
    return accounts[email] ? { email, ...accounts[email] } : null
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
    const acct = accounts[key]
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

  function updateProfile(newEmail, newPassword, currentPassword) {
    if (!user.value) return { ok: false, error: 'notAuthed' }
    const oldEmail = user.value.email
    const formattedEmail = String(newEmail || '').trim().toLowerCase()

    if (!formattedEmail) {
      return { ok: false, error: 'emptyEmail' }
    }

    const allAccounts = { ...accounts }
    const userAcct = allAccounts[oldEmail]
    if (!userAcct) return { ok: false, error: 'accountNotFound' }

    if (!currentPassword || currentPassword !== userAcct.password) {
      return { ok: false, error: 'wrongCurrentPassword' }
    }

    if (newPassword) {
      userAcct.password = newPassword
    }

    if (formattedEmail !== oldEmail) {
      if (allAccounts[formattedEmail]) {
        return { ok: false, error: 'emailTaken' }
      }
      delete allAccounts[oldEmail]
      allAccounts[formattedEmail] = userAcct
    }

    accounts = allAccounts
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))

    user.value = { email: formattedEmail, ...userAcct }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: formattedEmail }))

    return { ok: true }
  }

  function deleteAccount() {
    if (!user.value) return { ok: false, error: 'notAuthed' }
    const emailToDelete = user.value.email

    const allAccounts = { ...accounts }
    delete allAccounts[emailToDelete]

    accounts = allAccounts
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))

    logout()
    return { ok: true }
  }

  return { user, isAuthed, allowedBranches, login, logout, updateProfile, deleteAccount }
}
