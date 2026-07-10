<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import Icon from './Icon.vue'

const emit = defineEmits(['back'])

const { user, updateProfile } = useAuth()

const email = ref(user.value ? user.value.email : '')
const password = ref('')
const confirmPassword = ref('')
const currentPassword = ref('')

const successMsg = ref('')
const errorMsg = ref('')

onMounted(() => {
  if (user.value) {
    email.value = user.value.email
  }
})

function saveSettings() {
  successMsg.value = ''
  errorMsg.value = ''

  // Validate email
  if (!email.value.trim()) {
    errorMsg.value = 'emptyEmail'
    return
  }

  // Validate passwords
  if (password.value && password.value !== confirmPassword.value) {
    errorMsg.value = 'passwordsMismatch'
    return
  }

  // Current password is required for any update
  if (!currentPassword.value) {
    errorMsg.value = 'wrongCurrentPassword'
    return
  }

  // Update mock credentials
  const res = updateProfile(email.value, password.value, currentPassword.value)
  if (!res.ok) {
    errorMsg.value = res.error
    return
  }

  password.value = ''
  confirmPassword.value = ''
  currentPassword.value = ''
  successMsg.value = 'successMsg'
}
</script>

<template>
  <div class="content profile-page">
    <div class="profile-header">
      <button class="btn ghost back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('profile.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('profile.accountSection') }}</h1>
    </div>

    <!-- Main Settings Card -->
    <div class="card profile-card">
      <form class="profile-form" @submit.prevent="saveSettings">
        
        <!-- Account Settings -->
        <div class="form-group">
          <label>
            <span class="label-text">{{ $t('profile.email') }}</span>
            <input
              v-model="email"
              type="email"
              required
              :placeholder="$t('profile.emailPlaceholder')"
            />
          </label>
        </div>

        <div class="form-group">
          <label>
            <span class="label-text">{{ $t('profile.currentPassword') }}</span>
            <input
              v-model="currentPassword"
              type="password"
              required
              :placeholder="$t('profile.currentPasswordPlaceholder')"
            />
          </label>
        </div>

        <div class="form-group row-group">
          <label>
            <span class="label-text">{{ $t('profile.password') }}</span>
            <input
              v-model="password"
              type="password"
              :placeholder="$t('profile.passwordPlaceholder')"
            />
          </label>
          <label>
            <span class="label-text">{{ $t('profile.confirmPassword') }}</span>
            <input
              v-model="confirmPassword"
              type="password"
              :placeholder="$t('profile.confirmPasswordPlaceholder')"
            />
          </label>
        </div>

        <!-- Alerts -->
        <p v-if="successMsg" class="alert success">{{ $t('profile.' + successMsg) }}</p>
        <p v-if="errorMsg" class="alert error">{{ $t('profile.' + errorMsg) }}</p>

        <!-- Submit Settings -->
        <div class="form-actions">
          <button class="btn primary save-btn" type="submit">
            <Icon name="save" :size="16" />
            <span>{{ $t('profile.saveBtn') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
