<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useI18n } from 'vue-i18n'
import { toggleLocale } from '../i18n/index.js'
import Icon from './Icon.vue'

const emit = defineEmits(['back'])

const { locale } = useI18n()
const { deleteAccount } = useAuth()

const theme = ref(localStorage.getItem('tianxing.theme') || 'light')
const lang = ref(locale.value)
const textSize = ref(localStorage.getItem('tianxing.text_size') || 'default')

const successMsg = ref('')
const errorMsg = ref('')

// Support accordions
const openSupportItem = ref(null)
const problemText = ref('')
const problemSuccess = ref(false)

// About accordions
const openAboutItem = ref(null)
const rating = ref(0)
const ratedStars = ref(0)

// Danger zone modal
const showDeleteModal = ref(false)

onMounted(() => {
  const isDark = document.documentElement.classList.contains('dark')
  theme.value = isDark ? 'dark' : 'light'
  lang.value = locale.value
})

function saveSettings() {
  successMsg.value = ''
  errorMsg.value = ''

  // Save theme
  localStorage.setItem('tianxing.theme', theme.value)
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Save language
  if (lang.value !== locale.value) {
    toggleLocale()
  }

  // Save text size
  localStorage.setItem('tianxing.text_size', textSize.value)
  document.documentElement.classList.remove('text-size-small', 'text-size-large', 'text-size-xlarge')
  if (textSize.value === 'small') {
    document.documentElement.classList.add('text-size-small')
  } else if (textSize.value === 'large') {
    document.documentElement.classList.add('text-size-large')
  } else if (textSize.value === 'xlarge') {
    document.documentElement.classList.add('text-size-xlarge')
  }

  successMsg.value = 'successMsg'
}

function submitProblem() {
  if (!problemText.value.trim()) return
  problemText.value = ''
  problemSuccess.value = true
  setTimeout(() => {
    problemSuccess.value = false
  }, 4000)
}

function setRating(val) {
  rating.value = val
  ratedStars.value = val
}

function handleConfirmDelete() {
  showDeleteModal.value = false
  deleteAccount()
}
</script>

<template>
  <div class="content profile-page">
    <div class="profile-header">
      <button class="btn ghost back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('profile.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('profile.title') }}</h1>
    </div>

    <!-- System Settings Card -->
    <div class="card profile-card">
      <form class="profile-form" @submit.prevent="saveSettings">
        <h2 class="section-title">{{ $t('profile.settingsSection') }}</h2>
        <div class="form-group row-group">
          <label>
            <span class="label-text">{{ $t('profile.theme') }}</span>
            <select v-model="theme" class="select-input">
              <option value="light">{{ $t('profile.themeLight') }}</option>
              <option value="dark">{{ $t('profile.themeDark') }}</option>
            </select>
          </label>
          <label>
            <span class="label-text">{{ $t('profile.langSelect') }}</span>
            <select v-model="lang" class="select-input">
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
        </div>

        <div class="form-group">
          <label>
            <span class="label-text">{{ $t('profile.textSize') }}</span>
            <select v-model="textSize" class="select-input">
              <option value="small">{{ $t('profile.textSizeSmall') }}</option>
              <option value="default">{{ $t('profile.textSizeDefault') }}</option>
              <option value="large">{{ $t('profile.textSizeLarge') }}</option>
              <option value="xlarge">{{ $t('profile.textSizeExtraLarge') }}</option>
            </select>
          </label>
        </div>

        <!-- Alerts -->
        <p v-if="successMsg" class="alert success">{{ $t('profile.' + successMsg) }}</p>

        <!-- Submit Settings -->
        <div class="form-actions">
          <button class="btn primary save-btn" type="submit">
            <Icon name="save" :size="16" />
            <span>{{ $t('profile.saveBtn') }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Help & Support Card -->
    <div class="card profile-card" style="margin-top: var(--s4);">
      <h2 class="section-title" style="margin-bottom: 0;">{{ $t('profile.supportSection') }}</h2>
      <div class="settings-group">
        
        <!-- Help Center -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openSupportItem = (openSupportItem === 'help' ? null : 'help')">
            <div>
              <div class="settings-item-title">{{ $t('profile.helpCenter') }}</div>
              <div class="settings-item-sub">{{ $t('profile.helpCenterSub') }}</div>
            </div>
            <Icon :name="openSupportItem === 'help' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openSupportItem === 'help'" class="settings-item-content">
            {{ $t('profile.supportHelpText') }}
          </div>
        </div>

        <!-- Contact Us -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openSupportItem = (openSupportItem === 'contact' ? null : 'contact')">
            <div>
              <div class="settings-item-title">{{ $t('profile.contactUs') }}</div>
              <div class="settings-item-sub">{{ $t('profile.contactUsSub') }}</div>
            </div>
            <Icon :name="openSupportItem === 'contact' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openSupportItem === 'contact'" class="settings-item-content">
            {{ $t('profile.supportContactText') }}
          </div>
        </div>

        <!-- Report a Problem -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openSupportItem = (openSupportItem === 'report' ? null : 'report')">
            <div>
              <div class="settings-item-title">{{ $t('profile.reportProblem') }}</div>
              <div class="settings-item-sub">{{ $t('profile.reportProblemSub') }}</div>
            </div>
            <Icon :name="openSupportItem === 'report' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openSupportItem === 'report'" class="settings-item-content">
            <form class="report-form" @submit.prevent="submitProblem">
              <textarea v-model="problemText" required :placeholder="$t('profile.reportPlaceholder')"></textarea>
              <button class="btn primary" type="submit" style="align-self: flex-end;">{{ $t('profile.reportSubmit') }}</button>
            </form>
            <p v-if="problemSuccess" class="alert success" style="margin-top: var(--s2);">{{ $t('profile.problemReportedAlert') }}</p>
          </div>
        </div>

      </div>
    </div>

    <!-- About Card -->
    <div class="card profile-card" style="margin-top: var(--s4);">
      <h2 class="section-title" style="margin-bottom: 0;">{{ $t('profile.aboutSection') }}</h2>
      <div class="settings-group">

        <!-- About Us -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openAboutItem = (openAboutItem === 'about' ? null : 'about')">
            <div>
              <div class="settings-item-title">{{ $t('profile.aboutUs') }}</div>
              <div class="settings-item-sub">{{ $t('profile.aboutUsSub') }}</div>
            </div>
            <Icon :name="openAboutItem === 'about' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openAboutItem === 'about'" class="settings-item-content">
            {{ $t('profile.aboutUsText') }}
          </div>
        </div>

        <!-- Terms & Privacy -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openAboutItem = (openAboutItem === 'terms' ? null : 'terms')">
            <div>
              <div class="settings-item-title">{{ $t('profile.terms') }}</div>
              <div class="settings-item-sub">{{ $t('profile.termsSub') }}</div>
            </div>
            <Icon :name="openAboutItem === 'terms' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openAboutItem === 'terms'" class="settings-item-content">
            {{ $t('profile.termsText') }}
          </div>
        </div>

        <!-- Rate Us -->
        <div class="settings-item">
          <div class="settings-item-header" @click="openAboutItem = (openAboutItem === 'rate' ? null : 'rate')">
            <div>
              <div class="settings-item-title">{{ $t('profile.rateUs') }}</div>
              <div class="settings-item-sub">{{ $t('profile.rateUsSub') }}</div>
            </div>
            <Icon :name="openAboutItem === 'rate' ? 'resort' : 'chevron-right'" :size="16" />
          </div>
          <div v-if="openAboutItem === 'rate'" class="settings-item-content">
            <div class="rating-widget">
              <span
                v-for="star in 5"
                :key="star"
                class="rating-star"
                :class="{ selected: star <= rating }"
                @click="setRating(star)"
              >
                ★
              </span>
            </div>
            <p v-if="ratedStars > 0" class="alert success" style="margin-top: var(--s2);">
              {{ $t('profile.rateUsAlert', { stars: ratedStars }) }}
            </p>
          </div>
        </div>

        <!-- Version -->
        <div class="settings-item">
          <div class="settings-item-header">
            <div>
              <div class="settings-item-title">{{ $t('profile.version') }}</div>
              <div class="settings-item-sub">{{ $t('profile.versionSub') }}</div>
            </div>
            <span style="font-size: 13px; font-weight: 800; color: var(--text-muted);">v0.1.4</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Danger Zone Card -->
    <div class="danger-zone-card">
      <h2 class="danger-zone-title">{{ $t('profile.dangerZone') }}</h2>
      <p class="danger-zone-desc">{{ $t('profile.deleteAccountSub') }}</p>
      <button class="btn danger" type="button" @click="showDeleteModal = true">
        <Icon name="trash" :size="16" />
        <span>{{ $t('profile.deleteAccount') }}</span>
      </button>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-box">
        <h3 class="modal-title">{{ $t('profile.deleteConfirmTitle') }}</h3>
        <p class="modal-body">{{ $t('profile.deleteConfirmBody') }}</p>
        <div class="modal-actions">
          <button class="btn ghost" type="button" @click="showDeleteModal = false">
            {{ $t('profile.deleteConfirmNo') }}
          </button>
          <button class="btn danger" type="button" @click="handleConfirmDelete">
            {{ $t('profile.deleteConfirmYes') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
