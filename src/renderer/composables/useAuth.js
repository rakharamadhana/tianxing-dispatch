import { ref, computed } from 'vue'

/**
 * Real Supabase Auth, via IPC to the main process (src/main/auth.js).
 *
 * The demo accounts below are now real Supabase Auth users (see project
 * notes) — kept here only to drive the login screen's quick-fill chips.
 */

const DEMO_ACCOUNTS_META = {
  'ceo@fyf.com.tw': 'CEO',
  'taipei@fyf.com.tw': '台北',
  'hsinchu@fyf.com.tw': '新竹',
  'kaohsiung@fyf.com.tw': '高雄'
}

export const DEMO_ACCOUNTS = Object.keys(DEMO_ACCOUNTS_META).map((email) => ({
  email,
  label: DEMO_ACCOUNTS_META[email]
}))
export const DEMO_PASSWORD = '123456'

// Module-level singleton state — every useAuth() call shares this.
const user = ref(null)
const sessionRestored = ref(false)

async function restoreSession() {
  try {
    user.value = await window.api.auth.session()
  } catch (e) {
    console.error('Failed to restore session', e)
  } finally {
    sessionRestored.value = true
  }
}
restoreSession()

export function useAuth() {
  const isAuthed = computed(() => !!user.value)
  const allowedBranches = computed(() => (user.value ? user.value.branches : []))

  async function login(email, password) {
    const res = await window.api.auth.login(email, password)
    if (!res.ok) return res
    user.value = res.user
    return { ok: true }
  }

  async function logout() {
    await window.api.auth.logout()
    user.value = null
  }

  async function updateProfile(newEmail, newPassword, currentPassword) {
    const res = await window.api.auth.updateProfile(newEmail, newPassword, currentPassword)
    if (res.ok && res.user) user.value = res.user
    return res
  }

  async function deleteAccount() {
    return window.api.auth.deleteAccount()
  }

  return { user, isAuthed, sessionRestored, allowedBranches, login, logout, updateProfile, deleteAccount }
}
