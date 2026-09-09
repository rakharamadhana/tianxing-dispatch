import { ref } from 'vue'

/**
 * Driver picker options for the active branch — used when a manager creates
 * a fuel/maintenance request on a driver's behalf. Refetched on every
 * setBranch() so a CEO switching branches always sees that branch's drivers.
 */
export function useDrivers(initialBranch) {
  const drivers = ref([])
  const loading = ref(false)

  async function load(branch) {
    loading.value = true
    try {
      drivers.value = await window.api.drivers.list(branch)
    } finally {
      loading.value = false
    }
  }

  load(initialBranch)

  return { drivers, loading, load }
}
