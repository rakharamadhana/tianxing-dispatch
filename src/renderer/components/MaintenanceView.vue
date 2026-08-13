<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  maintenance: { type: Object, required: true } // the useMaintenance() instance
})
const emit = defineEmits(['back'])
</script>

<template>
  <div class="content">
    <div class="profile-header">
      <button class="btn ghost back-btn" @click="emit('back')">
        <Icon name="chevron-left" :size="16" />
        <span>{{ $t('maintenance.back') }}</span>
      </button>
      <h1 class="profile-title">{{ $t('maintenance.title') }}</h1>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="btn" @click="maintenance.addRow()">
        <Icon name="add" :size="16" /><span>{{ $t('actions.addRow') }}</span>
      </button>

      <span v-if="maintenance.saving.value || maintenance.dirty.value" class="dirty-flag">
        <span class="dot"></span>{{ $t('status.saving') }}
      </span>
      <span v-else class="saved-flag">
        {{ $t('status.saved') }}
      </span>
    </div>

    <div class="card maintenance-grid">
      <div class="grid-head">
        <div class="h">{{ $t('maintenance.columns.dateTime') }}</div>
        <div class="h">{{ $t('maintenance.columns.driverName') }}</div>
        <div class="h">{{ $t('maintenance.columns.amount') }}</div>
        <div class="h">{{ $t('maintenance.columns.description') }}</div>
        <div class="h"></div>
      </div>

      <div v-if="maintenance.rows.value.length === 0" class="empty-state">
        {{ $t('status.empty') }}
      </div>

      <div v-for="(row, i) in maintenance.rows.value" :key="row._key" class="job-row">
        <div class="cell">
          <input
            v-model="row.record_datetime"
            :placeholder="$t('maintenance.fields.dateTime')"
            @change="maintenance.commitEdit()"
          />
        </div>
        <div class="cell">
          <input
            v-model="row.driver_name"
            :placeholder="$t('maintenance.fields.driverName')"
            @change="maintenance.commitEdit()"
          />
        </div>
        <div class="cell cell-amount">
          <input
            v-model.number="row.amount"
            type="number"
            min="0"
            :placeholder="$t('maintenance.fields.amount')"
            @change="maintenance.commitEdit()"
          />
        </div>
        <div class="cell">
          <input
            v-model="row.description"
            :placeholder="$t('maintenance.fields.description')"
            @change="maintenance.commitEdit()"
          />
        </div>
        <div class="cell cell-actions">
          <button class="row-del" :title="$t('actions.delete')" @click="maintenance.removeRow(i)">
            <Icon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.maintenance-grid .grid-head,
.maintenance-grid .job-row {
  grid-template-columns: 180px 140px 120px 1fr 40px;
}
.maintenance-grid .cell-amount input {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
