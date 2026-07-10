<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'
import LangToggle from './LangToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useAuth, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../composables/useAuth.js'

const { login } = useAuth()

const email = ref('')
const password = ref('')
const errorKey = ref('')

function submit() {
  errorKey.value = ''
  const res = login(email.value, password.value)
  if (!res.ok) errorKey.value = res.error
  // On success the shared auth state flips and App swaps to the main shell.
}

function fill(demoEmail) {
  email.value = demoEmail
  password.value = DEMO_PASSWORD
  errorKey.value = ''
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-lang">
      <ThemeToggle />
      <LangToggle />
    </div>

    <div class="auth-card">
      <div class="auth-head">
        <span class="logo-patch">天興</span>
        <div>
          <h1 class="auth-title">{{ $t('auth.title') }}</h1>
          <p class="auth-subtitle">{{ $t('auth.subtitle') }}</p>
        </div>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>{{ $t('auth.email') }}</span>
          <span class="field">
            <Icon name="mail" :size="16" />
            <input
              v-model="email"
              type="email"
              autocomplete="username"
              :placeholder="$t('auth.emailPlaceholder')"
            />
          </span>
        </label>

        <label>
          <span>{{ $t('auth.password') }}</span>
          <span class="field">
            <Icon name="lock" :size="16" />
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              :placeholder="$t('auth.passwordPlaceholder')"
            />
          </span>
        </label>

        <p v-if="errorKey" class="auth-message error">{{ $t('auth.' + errorKey) }}</p>

        <button class="btn primary auth-submit" type="submit">
          {{ $t('auth.signIn') }}
        </button>
      </form>

      <div class="auth-demo">
        <span class="auth-demo-label">{{ $t('auth.demoLabel') }}</span>
        <div class="auth-demo-chips">
          <button
            v-for="a in DEMO_ACCOUNTS"
            :key="a.email"
            type="button"
            class="demo-chip"
            @click="fill(a.email)"
          >
            {{ a.email }}
          </button>
        </div>
        <span class="auth-demo-hint">{{ $t('auth.demoPassword') }} {{ DEMO_PASSWORD }}</span>
      </div>
    </div>
  </div>
</template>
