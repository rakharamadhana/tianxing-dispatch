import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'
import { ALL_BRANCHES, ALL_LABEL, branchesForEnum } from './branchMap.js'

/**
 * Real Supabase Auth, replacing the old front-end-only demo login.
 * The demo accounts (ceo@fyf.com.tw etc.) now exist as real Supabase Auth
 * users with matching rows in `public.profiles` — see project notes.
 */

async function fetchProfile(supabase, userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data || null
}

function toAuthUser(authUser, profile) {
  const isCeo = profile?.role === 'ceo'
  return {
    email: authUser.email,
    role: isCeo ? 'ceo' : profile?.role || 'manager',
    label: profile?.name || authUser.email,
    branches: isCeo ? [ALL_LABEL, ...ALL_BRANCHES] : branchesForEnum(profile?.branch)
  }
}

export async function login(email, password) {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: 'supabaseNotConfigured' }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password
  })
  if (error || !data.user) return { ok: false, error: 'invalidCredentials' }

  const profile = await fetchProfile(supabase, data.user.id)
  return { ok: true, user: toAuthUser(data.user, profile) }
}

export async function logout() {
  const supabase = getSupabase()
  if (!supabase) return { ok: true }
  await supabase.auth.signOut()
  return { ok: true }
}

export async function getSession() {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null

  const profile = await fetchProfile(supabase, data.session.user.id)
  return toAuthUser(data.session.user, profile)
}

export async function updateProfile(newEmail, newPassword, currentPassword) {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: 'supabaseNotConfigured' }

  const { data: sessionData } = await supabase.auth.getSession()
  const currentEmail = sessionData.session?.user?.email
  if (!currentEmail) return { ok: false, error: 'notAuthed' }

  // Re-verify the current password before allowing any change.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword
  })
  if (reauthError) return { ok: false, error: 'wrongCurrentPassword' }

  const formattedEmail = String(newEmail || '').trim().toLowerCase()
  if (!formattedEmail) return { ok: false, error: 'emptyEmail' }

  const updates = {}
  if (formattedEmail !== currentEmail) updates.email = formattedEmail
  if (newPassword) updates.password = newPassword

  if (Object.keys(updates).length === 0) {
    const profile = await fetchProfile(supabase, sessionData.session.user.id)
    return { ok: true, user: toAuthUser(sessionData.session.user, profile) }
  }

  const { data, error } = await supabase.auth.updateUser(updates)
  if (error) {
    if (error.status === 422 || /already/i.test(error.message)) return { ok: false, error: 'emailTaken' }
    return { ok: false, error: 'invalidCredentials' }
  }

  const profile = await fetchProfile(supabase, data.user.id)
  return { ok: true, user: toAuthUser(data.user, profile) }
}

export async function deleteAccount() {
  // Deleting an auth user requires the service_role (admin) key, which must
  // never be shipped in the desktop app. Not supported from the client.
  return { ok: false, error: 'notSupported' }
}
