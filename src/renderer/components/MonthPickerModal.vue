<script setup>
import { ref } from 'vue'

const props = defineProps({
  years: { type: Array, required: true }, // number[] or string[], most-recent first
  initialMonth: { type: Number, default: () => new Date().getMonth() + 1 },
  showMonth: { type: Boolean, default: true }
})
const emit = defineEmits(['confirm', 'cancel'])

const pickerYear = ref(props.years[0])
const pickerMonth = ref(props.initialMonth)

function confirm() {
  emit('confirm', props.showMonth ? { year: pickerYear.value, month: pickerMonth.value } : { year: pickerYear.value })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-box">
      <h3 class="modal-title">{{ $t('export.selectMonthTitle') }}</h3>
      <div class="picker-row">
        <label class="picker-field">
          <span>{{ $t('export.selectYear') }}</span>
          <select v-model="pickerYear">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>
        <label v-if="showMonth" class="picker-field">
          <span>{{ $t('export.selectMonth') }}</span>
          <select v-model.number="pickerMonth">
            <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" type="button" @click="emit('cancel')">{{ $t('export.cancel') }}</button>
        <button class="btn primary" type="button" @click="confirm">{{ $t('export.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-row {
  display: flex;
  gap: var(--s3);
  margin-bottom: var(--s4);
}
.picker-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-soft);
}
.picker-field select {
  border: 1.5px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  color: var(--ink);
  background: var(--card-bg);
  color-scheme: light dark;
}
.picker-field select option {
  color: var(--ink);
  background: var(--card-bg);
}
</style>
