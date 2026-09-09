import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

/**
 * Singleton Supabase client for the main process.
 *
 * The session is persisted to a JSON file in the app's userData folder (the
 * default supabase-js storage assumes a browser's localStorage, which doesn't
 * exist in the main process) so a login survives an app restart.
 */

function sessionFilePath() {
  return join(app.getPath('userData'), 'supabase-session.json')
}

function readSessionFile() {
  try {
    return JSON.parse(readFileSync(sessionFilePath(), 'utf-8'))
  } catch {
    return {}
  }
}

function writeSessionFile(data) {
  try {
    writeFileSync(sessionFilePath(), JSON.stringify(data))
  } catch (e) {
    console.error('Failed to persist Supabase session', e)
  }
}

const fileStorage = {
  getItem: async (key) => readSessionFile()[key] ?? null,
  setItem: async (key, value) => {
    const data = readSessionFile()
    data[key] = value
    writeSessionFile(data)
  },
  removeItem: async (key) => {
    const data = readSessionFile()
    delete data[key]
    writeSessionFile(data)
  }
}

let client = null

export function isSupabaseConfigured() {
  return !!(import.meta.env.MAIN_VITE_SUPABASE_URL && import.meta.env.MAIN_VITE_SUPABASE_ANON_KEY)
}

export function getSupabase() {
  if (!isSupabaseConfigured()) return null
  if (client) return client

  client = createClient(
    import.meta.env.MAIN_VITE_SUPABASE_URL,
    import.meta.env.MAIN_VITE_SUPABASE_ANON_KEY,
    {
      auth: { storage: fileStorage, persistSession: true, autoRefreshToken: true },
      // Electron's main-process Node has no native WebSocket; supabase-js's
      // realtime module needs one just to construct the client, even though
      // this app doesn't use realtime subscriptions.
      realtime: { transport: WebSocket }
    }
  )
  return client
}
