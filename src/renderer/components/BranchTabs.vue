<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  active: { type: String, required: true },
  // Cities this user may access (CEO = all three; a manager = just theirs).
  branches: { type: Array, default: () => ['台北', '新竹', '高雄'] }
})
const emit = defineEmits(['change'])

const utilities = [
  { key: 'settings', icon: 'settings' },
  { key: 'fuel', icon: 'fuel' },
  { key: 'maintenance', icon: 'maintenance' }
]
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

    <!-- Utility tabs: visible placeholders (wired in a later phase) -->
    <button v-for="u in utilities" :key="u.key" class="tab disabled" disabled>
      <Icon :name="u.icon" :size="15" /><span>{{ $t('tabs.' + u.key) }}</span>
    </button>
  </div>
</template>
