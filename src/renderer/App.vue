<script setup>
import LoginView from './components/LoginView.vue'
import AppShell from './components/AppShell.vue'
import { useAuth } from './composables/useAuth.js'

const { isAuthed } = useAuth()
</script>

<template>
  <LoginView v-if="!isAuthed" />
  <AppShell v-else />
</template>
