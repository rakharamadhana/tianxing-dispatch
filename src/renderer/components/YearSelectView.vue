<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'
import LangToggle from './LangToggle.vue'
import ThemeToggle from './ThemeToggle.vue'

const emit = defineEmits(['select', 'logout'])

const currentYear = new Date().getFullYear()
const availableYears = []
for (let y = currentYear; y >= 2024; y--) {
  availableYears.push(y)
}
</script>

<template>
  <div class="auth-page year-select-page">
    <div class="auth-lang">
      <ThemeToggle />
      <LangToggle />
      <button class="btn ghost logout-btn" @click="emit('logout')" :title="$t('auth.logout')">
        <Icon name="logout" :size="16" />
        <span>{{ $t('auth.logout') }}</span>
      </button>
    </div>

    <div class="auth-card year-select-card">
      <div class="auth-head">
        <span class="logo-patch">天興</span>
        <div>
          <h1 class="auth-title">{{ $t('profile.yearSelectTitle') }}</h1>
          <p class="auth-subtitle">{{ $t('profile.yearSelectSubtitle') }}</p>
        </div>
      </div>

      <div class="year-buttons-grid">
        <button
          v-for="y in availableYears"
          :key="y"
          class="btn year-btn"
          @click="emit('select', String(y))"
        >
          <Icon name="summary" :size="20" />
          <span class="year-text">{{ y }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
