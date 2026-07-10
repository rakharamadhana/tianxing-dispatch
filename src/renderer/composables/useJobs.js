import { ref, computed, toRaw } from 'vue'

/** Deep-clone a reactive value into a plain object safe to send over IPC. */
function plain(value) {
  return JSON.parse(JSON.stringify(toRaw(value)))
}

/**
 * Owns the dispatch-table state for the active branch:
 * loading, in-memory edits, dirty tracking, save/restore.
 * Talks to the main process only through window.api (see preload).
 */
export function useJobs(initialBranch = '台北') {
  const branch = ref(initialBranch)
  const rows = ref([]) // working copy (editable)
  const deletedIds = ref([]) // ids removed since last load
  const loading = ref(false)
  const saving = ref(false)
  let baseline = '[]' // JSON snapshot of last-loaded/saved state

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

  const dirty = computed(
    () => deletedIds.value.length > 0 || JSON.stringify(rows.value) !== baseline
  )

  function snapshot() {
    baseline = JSON.stringify(rows.value)
    deletedIds.value = []
  }

  async function load() {
    loading.value = true
    try {
      const data = await window.api.jobs.list(branch.value, plain(filters.value))
      rows.value = data.map(normalize)
      snapshot()
    } finally {
      loading.value = false
    }
  }

  function normalize(r) {
    return {
      id: r.id ?? '',
      branch: r.branch ?? branch.value,
      job_date: r.job_date ?? '',
      job_time: r.job_time ?? '',
      customer_name: r.customer_name ?? '',
      phone: r.phone ?? '',
      move_in_address: r.move_in_address ?? '',
      move_out_address: r.move_out_address ?? '',
      unit_price: Number(r.unit_price) || 0,
      tax_status: r.tax_status ?? '未稅',
      quantity: Number(r.quantity) || 1,
      payment_method: r.payment_method ?? '現金',
      payment_status: r.payment_status ?? '未付款',
      note: r.note ?? ''
    }
  }

  function total(row) {
    return (Number(row.unit_price) || 0) * (Number(row.quantity) || 0)
  }

  function addRow() {
    const yearPrefill = filters.value.year || '2026'
    rows.value.push(
      normalize({ id: '', branch: branch.value, job_date: yearPrefill, quantity: 1 })
    )
  }

  function removeRow(index) {
    const [removed] = rows.value.splice(index, 1)
    if (removed && /^\d+$/.test(String(removed.id))) {
      deletedIds.value.push(String(removed.id))
    }
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

  async function save() {
    saving.value = true
    try {
      const persisted = await window.api.jobs.save(branch.value, {
        rows: rows.value.map((r) => ({ ...plain(r), total_price: total(r) })),
        deletedIds: [...deletedIds.value],
        filters: plain(filters.value)
      })
      rows.value = persisted.map(normalize)
      snapshot()
    } finally {
      saving.value = false
    }
  }

  async function restore() {
    await load() // reload last-saved state, discard edits
  }

  return {
    branch,
    rows,
    filters,
    loading,
    saving,
    dirty,
    total,
    load,
    addRow,
    removeRow,
    setBranch,
    applyFilters,
    clearFilters,
    save,
    restore
  }
}
