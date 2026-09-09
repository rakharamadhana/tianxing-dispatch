import { ref, computed, toRaw } from 'vue'
import { requiresMaterials, totalFor } from '../config/projectTypes.js'
import { ALL_LABEL } from '../config/branches.js'

/** Deep-clone a reactive value into a plain object safe to send over IPC. */
function plain(value) {
  return JSON.parse(JSON.stringify(toRaw(value)))
}

function newKey() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const AUTOSAVE_DELAY = 500
const MAX_HISTORY = 100

/**
 * Owns the dispatch-table state for the active branch:
 * loading, in-memory edits, autosave, and an in-session undo/redo stack.
 * Talks to the main process only through window.api (see preload).
 *
 * Every committed edit is autosaved to SQLite after a short debounce.
 * Undo/redo only cover the current app session — the history stack is
 * in-memory only and resets whenever the branch/filters reload from disk.
 */
export function useJobs(initialBranch = '台北') {
  const branch = ref(initialBranch)
  const rows = ref([]) // working copy (editable)
  const deletedIds = ref([]) // ids queued for deletion, not yet flushed
  const loading = ref(false)
  const saving = ref(false) // an autosave request is currently in flight
  const savePending = ref(false) // there are edits not yet confirmed persisted
  const saveError = ref('')

  const history = ref([]) // past states, most recent last
  const future = ref([]) // undone states, for redo
  let pendingEditSnapshot = null // state captured at the start of an in-progress field edit
  let autosaveTimer = null
  let flushing = false
  let flushAgain = false

  const canUndo = computed(() => history.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)
  const dirty = computed(() => savePending.value) // unpersisted changes exist (used for the close-window warning)

  const getInitialYear = () => {
    const saved = localStorage.getItem('tianxing.selected_year')
    const current = new Date().getFullYear()
    if (saved && Number(saved) >= 2024 && Number(saved) <= current) {
      return saved
    }
    return String(current)
  }

  const filters = ref({
    year: getInitialYear(),
    dateQuery: '',
    phoneQuery: '',
    taxFilter: '',
    paymentMethod: '',
    paymentStatus: ''
  })

  function stateSnapshot() {
    return plain({ rows: rows.value, deletedIds: deletedIds.value })
  }

  function applyState(state) {
    rows.value = state.rows.map((r) => ({ ...r }))
    deletedIds.value = [...state.deletedIds]
  }

  function pushHistory(snap) {
    history.value.push(snap)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    future.value = []
  }

  function resetHistory() {
    history.value = []
    future.value = []
    pendingEditSnapshot = null
  }

  /** Call on focus/before a field edit begins, to capture the pre-edit state. */
  function beginEdit() {
    pendingEditSnapshot = stateSnapshot()
  }

  /** Call on blur/change once a field edit is done, to commit it as one undo step. */
  function commitEdit() {
    if (pendingEditSnapshot) {
      pushHistory(pendingEditSnapshot)
      pendingEditSnapshot = null
      scheduleAutosave()
    }
  }

  /** Wrap a single discrete mutation (button click, add/remove row) as one undo step. */
  function commitAction(mutate) {
    const before = stateSnapshot()
    mutate()
    pushHistory(before)
    scheduleAutosave()
  }

  function undo() {
    if (!canUndo.value) return
    pendingEditSnapshot = null
    const current = stateSnapshot()
    const prev = history.value.pop()
    future.value.push(current)
    applyState(prev)
    scheduleAutosave()
  }

  function redo() {
    if (!canRedo.value) return
    const current = stateSnapshot()
    const next = future.value.pop()
    history.value.push(current)
    applyState(next)
    scheduleAutosave()
  }

  function scheduleAutosave() {
    savePending.value = true
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null
      flushNow()
    }, AUTOSAVE_DELAY)
  }

  function validate() {
    const hasMissingMaterials = rows.value.some(
      (r) => requiresMaterials(r.project_type) && (!Array.isArray(r.materials) || r.materials.length === 0)
    )
    saveError.value = hasMissingMaterials ? 'materialsRequiredForPackaging' : ''
    return !hasMissingMaterials
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
    if (!validate()) {
      // Leave savePending set so a future fix retries the autosave.
      return
    }
    flushing = true
    saving.value = true
    const branchAtStart = branch.value
    const sentDeletedIds = [...deletedIds.value]
    try {
      const persisted = await window.api.jobs.save(branch.value, {
        rows: rows.value.map((r) => ({ ...plain(r), total_price: total(r) })),
        deletedIds: sentDeletedIds,
        filters: plain(filters.value)
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
    await flushNow() // don't lose in-flight edits from the previous branch/filters
    loading.value = true
    try {
      const data = await window.api.jobs.list(branch.value, plain(filters.value))
      rows.value = data.map(normalize)
      deletedIds.value = []
      savePending.value = false
      resetHistory()
    } finally {
      loading.value = false
    }
  }

  function normalize(r) {
    return {
      _key: r._key || newKey(),
      id: r.id ?? '',
      branch: r.branch ?? branch.value,
      project_type: r.project_type ?? '搬工',
      job_date: r.job_date ?? '',
      job_time: r.job_time ?? '',
      customer_name: r.customer_name ?? '',
      phone: r.phone ?? '',
      move_in_address: r.move_in_address ?? '',
      move_out_address: r.move_out_address ?? '',
      unit_price: Number(r.unit_price) || 0,
      tax_status: r.tax_status ?? '未稅',
      quantity: Number(r.quantity) || 1,
      worker_count: Number(r.worker_count) || 0,
      payment_method: r.payment_method ?? '現金',
      payment_status: r.payment_status ?? '未付款',
      note: r.note ?? '',
      materials: Array.isArray(r.materials) ? r.materials : [],
      member_ids: Array.isArray(r.member_ids) ? r.member_ids : [],
      member_percentages: r.member_percentages && typeof r.member_percentages === 'object' ? r.member_percentages : {},
      // Read-only signal from the shared payroll workflow (see
      // SupabaseJobRepository#computeProjectStatus); null for jobs with no
      // payroll data attached (e.g. rows created directly in this app).
      project_status: r.project_status ?? null
    }
  }

  function total(row) {
    return totalFor(row)
  }

  function addRow() {
    const yearPrefill = filters.value.year || '2026'
    // The All tab has no real branch of its own — a brand-new row needs one
    // to save against, so default to the first real branch; the CEO can
    // still move it via the row's own branch selector.
    const rowBranch = branch.value === ALL_LABEL ? '台北' : branch.value
    commitAction(() => {
      rows.value.push(
        normalize({ id: '', branch: rowBranch, job_date: `${yearPrefill}0101`, quantity: 1 })
      )
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

  async function applyFilters(next) {
    filters.value = { ...filters.value, ...next }
    await load()
  }

  async function clearFilters() {
    const activeYear = filters.value.year
    filters.value = {
      year: activeYear,
      dateQuery: '',
      phoneQuery: '',
      taxFilter: '',
      paymentMethod: '',
      paymentStatus: ''
    }
    await load()
  }

  return {
    branch,
    rows,
    filters,
    loading,
    saving,
    saveError,
    dirty,
    canUndo,
    canRedo,
    total,
    load,
    addRow,
    removeRow,
    setBranch,
    applyFilters,
    clearFilters,
    beginEdit,
    commitEdit,
    commitAction,
    undo,
    redo,
    flushNow
  }
}
