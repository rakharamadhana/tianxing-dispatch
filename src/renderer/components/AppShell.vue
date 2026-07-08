<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import BranchTabs from './BranchTabs.vue'
import LangToggle from './LangToggle.vue'
import DispatchTable from './DispatchTable.vue'
import Icon from './Icon.vue'
import { useJobs } from '../composables/useJobs.js'
import { useAuth } from '../composables/useAuth.js'

const { user, allowedBranches, logout } = useAuth()

// Start on the first branch this user is allowed to see.
const jobs = useJobs(allowedBranches.value[0])

onMounted(() => jobs.load())

// Warn before closing with unsaved changes.
function onBeforeUnload(e) {
  if (jobs.dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
window.addEventListener('beforeunload', onBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div class="app">
    <header class="app-header">
      <span class="logo-patch">天興</span>
      <div class="titles">
        <span class="main">{{ $t('app.company') }} · {{ $t('app.title') }}</span>
        <span class="sub">{{ $t('app.edition') }}</span>
      </div>
      <span class="header-spacer"></span>

      <span class="user-chip">
        <Icon name="user" :size="15" />
        <span>{{ user.email }}</span>
      </span>
      <LangToggle />
      <button class="btn ghost" @click="logout" :title="$t('auth.logout')">
        <Icon name="logout" :size="16" /><span>{{ $t('auth.logout') }}</span>
      </button>
    </header>

    <BranchTabs
      :active="jobs.branch.value"
      :branches="allowedBranches"
      @change="jobs.setBranch"
    />

    <DispatchTable :jobs="jobs" />
  </div>
</template>
