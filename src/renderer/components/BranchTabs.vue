<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  active: { type: String, required: true },
  // Cities this user may access (CEO = all three; a manager = just theirs).
  branches: { type: Array, default: () => ['台北', '新竹', '高雄'] },
  // Which utility screen (if any) is currently open, e.g. 'maintenance'.
  activeUtility: { type: String, default: '' }
})
const emit = defineEmits(['change', 'settings', 'maintenance'])

const utilities = [
  { key: 'settings', icon: 'settings' },
  { key: 'fuel', icon: 'fuel' },
  { key: 'maintenance', icon: 'maintenance' }
]

// fuel is still a placeholder; settings and maintenance are wired up
const enabledKeys = ['settings', 'maintenance']
</script>

<template>
  <div class="tabbar">
    <button
      v-for="b in props.branches"
      :key="b"
      class="tab"
      :class="{ active: props.active === b }"
      @click="emit('change', b)"
    >
      {{ $t('branches.' + b) }}
    </button>

    <span class="tab-sep"></span>

    <!-- Utility tabs: fuel is still a visible placeholder -->
    <button
      v-for="u in utilities"
      :key="u.key"
      class="tab"
      :class="{ disabled: !enabledKeys.includes(u.key), active: u.key === props.activeUtility }"
      :disabled="!enabledKeys.includes(u.key)"
      @click="enabledKeys.includes(u.key) ? emit(u.key) : null"
    >
      <Icon :name="u.icon" :size="15" /><span>{{ $t('tabs.' + u.key) }}</span>
    </button>
  </div>
</template>
