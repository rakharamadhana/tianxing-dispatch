import { ref, computed, toRaw } from 'vue'

/** Deep-clone a reactive value into a plain object safe to send over IPC. */
function plain(value) {
  return JSON.parse(JSON.stringify(toRaw(value)))
}

function newKey() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const AUTOSAVE_DELAY = 500

/**
 * Owns fuel-request state for the active branch: loading, in-memory edits
 * (status changes, a manager-created request), and autosave. Backed by
 * Supabase's `gasoline_requests` — the same table the driver mobile app
 * reads and writes. Mirrors useMaintenance.js.
 */
export function useFuel(initialBranch) {
  const branch = ref(initialBranch)
  const rows = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const savePending = ref(false)

  let autosaveTimer = null
  let flushing = false
  let flushAgain = false

  const dirty = computed(() => savePending.value)

  function normalize(r) {
    return {
      _key: r._key || newKey(),
      id: r.id ?? '',
      branch: r.branch ?? branch.value,
      driver_id: r.driver_id ?? '',
      driver_name: r.driver_name ?? '',
      reported_amount: Number(r.reported_amount) || 0,
      approved_amount: Number(r.approved_amount) || 0,
      status: r.status ?? 'pending',
      created_at: r.created_at ?? ''
    }
  }

  function scheduleAutosave() {
    savePending.value = true
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null
      flushNow()
    }, AUTOSAVE_DELAY)
  }

  function mergeIds(persisted) {
    if (persisted.length !== rows.value.length) return
    persisted.forEach((p, i) => {
      if (rows.value[i] && !rows.value[i].id) rows.value[i].id = p.id
    })
  }

  async function flushNow() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
    if (!savePending.value) return
    if (flushing) {
      flushAgain = true
      return
    }
    flushing = true
    saving.value = true
    const branchAtStart = branch.value
    try {
      const persisted = await window.api.fuel.save(branch.value, {
        rows: rows.value.map((r) => plain(r))
      })
      if (branch.value === branchAtStart) mergeIds(persisted)
      savePending.value = false
    } finally {
      saving.value = false
      flushing = false
      if (flushAgain) {
        flushAgain = false
        await flushNow()
      }
    }
  }

  async function load() {
    await flushNow()
    loading.value = true
    try {
      const data = await window.api.fuel.list(branch.value)
      rows.value = data.map(normalize)
      savePending.value = false
    } finally {
      loading.value = false
    }
  }

  function commitAction(mutate) {
    mutate()
    scheduleAutosave()
  }

  function commitEdit() {
    scheduleAutosave()
  }

  function addRow() {
    commitAction(() => {
      rows.value.push(normalize({ branch: branch.value }))
    })
  }

  /** Only a not-yet-persisted (driver-less, id-less) row can be discarded locally. */
  function removeRow(index) {
    const row = rows.value[index]
    if (!row || row.id) return
    rows.value.splice(index, 1)
  }

  async function setBranch(next) {
    branch.value = next
    await load()
  }

  return {
    branch,
    rows,
    loading,
    saving,
    dirty,
    load,
    addRow,
    removeRow,
    setBranch,
    commitEdit,
    commitAction,
    flushNow
  }
}
