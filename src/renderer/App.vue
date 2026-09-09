<script setup>
import LoginView from './components/LoginView.vue'
import AppShell from './components/AppShell.vue'
import { useAuth } from './composables/useAuth.js'

const { isAuthed, sessionRestored } = useAuth()
</script>

<template>
  <div v-if="!sessionRestored" class="session-loading" />
  <LoginView v-else-if="!isAuthed" />
  <AppShell v-else />
</template>

<style scoped>
.session-loading {
  width: 100vw;
  height: 100vh;
  background: #0a1729;
}
</style>
