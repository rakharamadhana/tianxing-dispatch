<script setup>
import { toggleLocale } from '../i18n/index.js'
import Icon from './Icon.vue'
</script>

<template>
  <button class="btn ghost" @click="toggleLocale" :title="$t('actions.langToggle')">
    <Icon name="language" :size="16" />
    <span>{{ $t('actions.langToggle') }}</span>
  </button>
</template>
