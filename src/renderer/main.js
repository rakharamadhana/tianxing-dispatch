import { createApp } from 'vue'
import { i18n } from './i18n/index.js'
import App from './App.vue'
import './style.css'

// Apply initial theme
const savedTheme = localStorage.getItem('tianxing.theme') || 'light'
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

// Apply initial text size scale
const savedTextSize = localStorage.getItem('tianxing.text_size') || 'default'
if (savedTextSize === 'small') {
  document.documentElement.classList.add('text-size-small')
} else if (savedTextSize === 'large') {
  document.documentElement.classList.add('text-size-large')
} else if (savedTextSize === 'xlarge') {
  document.documentElement.classList.add('text-size-xlarge')
}

createApp(App).use(i18n).mount('#app')
