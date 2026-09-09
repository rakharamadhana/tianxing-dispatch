<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BranchTabs from './BranchTabs.vue'
import LangToggle from './LangToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import DispatchTable from './DispatchTable.vue'
import ProfileView from './ProfileView.vue'
import SettingsView from './SettingsView.vue'
import FuelView from './FuelView.vue'
import MaintenanceView from './MaintenanceView.vue'
import SalaryView from './SalaryView.vue'
import YearSelectView from './YearSelectView.vue'
import Icon from './Icon.vue'
import { useJobs } from '../composables/useJobs.js'
import { useFuel } from '../composables/useFuel.js'
import { useMaintenance } from '../composables/useMaintenance.js'
import { useAuth } from '../composables/useAuth.js'

const { user, allowedBranches, logout } = useAuth()

const currentView = ref('year-select')

// Start on the first branch this user is allowed to see.
const jobs = useJobs(allowedBranches.value[0])
// Fuel/maintenance requests aren't year-scoped, so load them as soon as the branch is known.
const fuel = useFuel(allowedBranches.value[0])
fuel.load()
const maintenance = useMaintenance(allowedBranches.value[0])
maintenance.load()

// Warn before closing with unsaved changes.
function onBeforeUnload(e) {
  if (jobs.dirty.value || fuel.dirty.value || maintenance.dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
window.addEventListener('beforeunload', onBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

// Branch tabs are shared between the dispatch table, fuel, and maintenance requests.
function onBranchChange(next) {
  jobs.setBranch(next)
  fuel.setBranch(next)
  maintenance.setBranch(next)
}

function changeYear(event) {
  const year = event.target.value
  jobs.filters.value.year = year
  localStorage.setItem('tianxing.selected_year', year)
  jobs.load()
}

function onYearSelected(year) {
  jobs.filters.value.year = year
  localStorage.setItem('tianxing.selected_year', year)
  jobs.load()
  currentView.value = 'dispatch'
}

const currentYear = new Date().getFullYear()
const availableYears = []
for (let y = currentYear; y >= 2024; y--) {
  availableYears.push(y)
}
</script>

<template>
  <YearSelectView
    v-if="currentView === 'year-select'"
    @select="onYearSelected"
    @logout="logout"
  />
  <div v-else class="app">
    <header class="app-header">
      <span class="logo-patch clickable" @click="currentView = 'dispatch'">天興</span>
      <div class="titles">
        <span class="main">{{ $t('app.company') }} · {{ $t('app.title') }}</span>
        <span class="sub">{{ $t('app.edition') }}</span>
      </div>

      <div class="header-year-selector">
        <Icon name="summary" :size="14" />
        <select :value="jobs.filters.value.year" @change="changeYear">
          <option v-for="y in availableYears" :key="y" :value="String(y)">{{ y }}</option>
        </select>
      </div>

      <span class="header-spacer"></span>

      <button
        class="btn ghost icon-only"
        :class="{ active: currentView === 'settings' }"
        @click="currentView = 'settings'"
        :title="$t('tabs.settings')"
      >
        <Icon name="settings" :size="16" />
      </button>

      <span class="user-chip clickable" @click="currentView = 'profile'" :title="$t('profile.title')">
        <Icon name="user" :size="15" />
        <span>{{ user.email }}</span>
      </span>
      <ThemeToggle />
      <LangToggle />
      <button class="btn ghost" @click="logout" :title="$t('auth.logout')">
        <Icon name="logout" :size="16" /><span>{{ $t('auth.logout') }}</span>
      </button>
    </header>

    <template v-if="['dispatch', 'fuel', 'maintenance', 'salary'].includes(currentView)">
      <BranchTabs
        :active="jobs.branch.value"
        :branches="allowedBranches"
        :active-utility="['fuel', 'maintenance'].includes(currentView) ? currentView : ''"
        @change="onBranchChange"
        @fuel="currentView = 'fuel'"
        @maintenance="currentView = 'maintenance'"
      />
      <DispatchTable v-if="currentView === 'dispatch'" :jobs="jobs" @payroll="currentView = 'salary'" />
      <FuelView v-else-if="currentView === 'fuel'" :fuel="fuel" @back="currentView = 'dispatch'" />
      <MaintenanceView v-else-if="currentView === 'maintenance'" :maintenance="maintenance" @back="currentView = 'dispatch'" />
      <SalaryView v-else :jobs="jobs" @back="currentView = 'dispatch'" />
    </template>
    <ProfileView v-else-if="currentView === 'profile'" @back="currentView = 'dispatch'" />
    <SettingsView v-else-if="currentView === 'settings'" @back="currentView = 'dispatch'" />
  </div>
</template>
