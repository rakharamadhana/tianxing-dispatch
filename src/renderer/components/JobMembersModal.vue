<script setup>
import { ref } from 'vue'

const props = defineProps({
  workers: { type: Array, required: true }, // [{id, name, role, branch}]
  memberIds: { type: Array, default: () => [] },
  memberPercentages: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['confirm', 'cancel'])

const selected = ref(new Set(props.memberIds))
const percentages = ref({ ...props.memberPercentages })
const percentageOptions = Array.from({ length: 101 }, (_, i) => i)

function isSelected(id) {
  return selected.value.has(id)
}

function toggle(id) {
  if (selected.value.has(id)) {
    selected.value.delete(id)
    delete percentages.value[id]
  } else {
    selected.value.add(id)
    if (!Number.isFinite(Number(percentages.value[id]))) percentages.value[id] = 100
  }
  // Force reactivity — Set mutation isn't tracked by Vue's ref() on its own.
  selected.value = new Set(selected.value)
}

function setPercentage(id, value) {
  percentages.value = { ...percentages.value, [id]: Number(value) }
}

function confirm() {
  const memberIds = [...selected.value]
  const memberPercentages = {}
  memberIds.forEach((id) => { memberPercentages[id] = Number(percentages.value[id]) || 0 })
  emit('confirm', { memberIds, memberPercentages })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-box">
      <h3 class="modal-title">{{ $t('salary.assignWorkers') }}</h3>

      <p v-if="!workers.length" class="empty-hint">{{ $t('salary.noWorkers') }}</p>

      <div v-else class="member-list">
        <div v-for="w in workers" :key="w.id" class="member-row">
          <label class="member-check">
            <input type="checkbox" :checked="isSelected(w.id)" @change="toggle(w.id)" />
            <span class="member-name">{{ w.name }}</span>
            <span class="member-role">{{ $t('salary.roles.' + w.role) }}</span>
          </label>
          <select
            v-if="isSelected(w.id)"
            class="member-pct"
            :value="Math.round(Number(percentages[w.id]) || 0)"
            @change="setPercentage(w.id, $event.target.value)"
          >
            <option v-for="p in percentageOptions" :key="p" :value="p">{{ p }}%</option>
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn ghost" type="button" @click="emit('cancel')">{{ $t('export.cancel') }}</button>
        <button class="btn primary" type="button" @click="confirm">{{ $t('export.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: var(--s4);
}
.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
  padding: 8px 6px;
  border-radius: 8px;
}
.member-row:hover {
  background: var(--hover-bg, rgba(0, 0, 0, 0.03));
}
.member-check {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.member-name {
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.member-role {
  font-size: 12px;
  color: var(--text-soft);
}
.member-pct {
  border: 1.5px solid var(--line);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  background: var(--card-bg);
  color-scheme: light dark;
}
.empty-hint {
  color: var(--text-soft);
  font-size: 13px;
  margin-bottom: var(--s4);
}
</style>
