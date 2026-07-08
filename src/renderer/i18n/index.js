import { createI18n } from 'vue-i18n'
import zhTW from './zh-TW.js'
import enUS from './en-US.js'

const STORAGE_KEY = 'tianxing.locale'
export const SUPPORTED = ['zh-TW', 'en-US']

function initialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return SUPPORTED.includes(saved) ? saved : 'zh-TW' // zh-TW is the default
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'zh-TW',
  messages: {
    'zh-TW': zhTW,
    'en-US': enUS
  }
})

/** One-press toggle between Traditional Chinese and English; persists choice. */
export function toggleLocale() {
  const next = i18n.global.locale.value === 'zh-TW' ? 'en-US' : 'zh-TW'
  i18n.global.locale.value = next
  localStorage.setItem(STORAGE_KEY, next)
  document.documentElement.lang = next === 'zh-TW' ? 'zh-Hant' : 'en'
}
