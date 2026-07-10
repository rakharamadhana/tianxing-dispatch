<script setup>
import { ref, onMounted } from 'vue'

const theme = ref('light')

onMounted(() => {
  const isDark = document.documentElement.classList.contains('dark')
  theme.value = isDark ? 'dark' : 'light'
})

function toggleTheme() {
  const next = theme.value === 'light' ? 'dark' : 'light'
  theme.value = next
  localStorage.setItem('tianxing.theme', next)
  if (next === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
</script>

<template>
  <button
    class="btn ghost theme-toggle-btn"
    @click="toggleTheme"
    :title="theme === 'light' ? 'Dark Mode' : 'Light Mode'"
  >
    <!-- Sun Icon (shown in dark mode) -->
    <svg
      v-if="theme === 'dark'"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M20 12h2" />
      <path d="M4 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>

    <!-- Moon Icon (shown in light mode) -->
    <svg
      v-else
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>
