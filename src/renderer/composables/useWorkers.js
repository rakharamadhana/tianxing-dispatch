import { ref } from 'vue'

/**
 * Full worker roster (driver/manager/assistant) for the active branch —
 * used to assign named workers + a commission % to a job for payroll.
 * Unlike useDrivers.js, not filtered to role === 'driver'.
 */
export function useWorkers(initialBranch) {
  const workers = ref([])
  const loading = ref(false)

  async function load(branch) {
    loading.value = true
    try {
      workers.value = await window.api.workers.list(branch)
    } finally {
      loading.value = false
    }
  }

  load(initialBranch)

  return { workers, loading, load }
}
