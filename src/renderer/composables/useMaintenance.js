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
 * Owns the maintenance-records state for the active branch: loading,
 * in-memory edits, and autosave. Talks to the main process only through
 * window.api (see preload). Mirrors useJobs.js, minus undo/redo/filters
 * which maintenance records don't need.
 */
export function useMaintenance(initialBranch) {
  const branch = ref(initialBranch)
  const rows = ref([]) // working copy (editable)
  const deletedIds = ref([]) // ids queued for deletion, not yet flushed
  const loading = ref(false)
  const saving = ref(false) // an autosave request is currently in flight
  const savePending = ref(false) // there are edits not yet confirmed persisted

  let autosaveTimer = null
  let flushing = false
  let flushAgain = false

  const dirty = computed(() => savePending.value)

  function normalize(r) {
    return {
      _key: r._key || newKey(),
      id: r.id ?? '',
      branch: r.branch ?? branch.value,
      record_datetime: r.record_datetime ?? '',
      driver_name: r.driver_name ?? '',
      amount: Number(r.amount) || 0,
      description: r.description ?? ''
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

  /** Persist the current state now, coalescing overlapping calls. */
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
    const sentDeletedIds = [...deletedIds.value]
    try {
      const persisted = await window.api.maintenance.save(branch.value, {
        rows: rows.value.map((r) => plain(r)),
        deletedIds: sentDeletedIds
      })
      if (branch.value === branchAtStart) {
        mergeIds(persisted)
        deletedIds.value = deletedIds.value.filter((id) => !sentDeletedIds.includes(id))
      }
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
    await flushNow() // don't lose in-flight edits from the previous branch
    loading.value = true
    try {
      const data = await window.api.maintenance.list(branch.value)
      rows.value = data.map(normalize)
      deletedIds.value = []
      savePending.value = false
    } finally {
      loading.value = false
    }
  }

  /** Wrap a discrete mutation (button click, add/remove row) and schedule a save. */
  function commitAction(mutate) {
    mutate()
    scheduleAutosave()
  }

  function commitEdit() {
    scheduleAutosave()
  }

  function addRow() {
    commitAction(() => {
      rows.value.push(normalize({ id: '', branch: branch.value }))
    })
  }

  function removeRow(index) {
    commitAction(() => {
      const [removed] = rows.value.splice(index, 1)
      if (removed && /^\d+$/.test(String(removed.id))) {
        deletedIds.value.push(String(removed.id))
      }
    })
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
