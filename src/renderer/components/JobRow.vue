<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import { PROJECT_TYPES, isHourlyType, usesMaterials, requiresMaterials, totalFor } from '../config/projectTypes.js'
import { MATERIAL_PRESETS } from '../config/materials.js'

const props = defineProps({
  row: { type: Object, required: true },
  jobs: { type: Object, required: true } // the useJobs() instance
})
const emit = defineEmits(['delete'])

const hourly = computed(() => isHourlyType(props.row.project_type))
const hasMaterials = computed(() => usesMaterials(props.row.project_type))
const materialsInvalid = computed(
  () => requiresMaterials(props.row.project_type) && props.row.materials.length === 0
)

const total = computed(() => totalFor(props.row))
const formattedTotal = computed(() => total.value.toLocaleString())

function setTax(value) {
  props.jobs.commitAction(() => { props.row.tax_status = value })
}
function setMethod(value) {
  props.jobs.commitAction(() => { props.row.payment_method = value })
}
function togglePaid() {
  props.jobs.commitAction(() => {
    props.row.payment_status = props.row.payment_status === '已付款' ? '未付款' : '已付款'
  })
}
function addMaterial() {
  props.jobs.commitAction(() => {
    props.row.materials.push({ name: MATERIAL_PRESETS[0], quantity: 1 })
  })
}
function removeMaterial(index) {
  props.jobs.commitAction(() => { props.row.materials.splice(index, 1) })
}
</script>

<template>
  <div class="job-row">
    <!-- Project type -->
    <div class="cell cell-type">
      <select v-model="row.project_type" @focus="jobs.beginEdit()" @change="jobs.commitEdit()">
        <option v-for="t in PROJECT_TYPES" :key="t" :value="t">{{ $t('projectTypes.' + t) }}</option>
      </select>
    </div>

    <!-- Date / Time -->
    <div class="cell">
      <input v-model="row.job_date" :placeholder="$t('fields.date')" maxlength="8" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
      <input v-model="row.job_time" :placeholder="$t('fields.time')" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
    </div>

    <!-- Name / Phone -->
    <div class="cell">
      <input v-model="row.customer_name" :placeholder="$t('fields.name')" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
      <input v-model="row.phone" :placeholder="$t('fields.phone')" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
    </div>

    <!-- Move in / Move out -->
    <div class="cell cell-inout">
      <input v-model="row.move_in_address" :placeholder="$t('fields.moveIn')" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
      <input v-model="row.move_out_address" :placeholder="$t('fields.moveOut')" @focus="jobs.beginEdit()" @change="jobs.commitEdit()" />
    </div>

    <!-- Unit price / hourly rate + tax toggle -->
    <div class="cell">
      <input
        v-model.number="row.unit_price"
        type="number"
        min="0"
        :placeholder="hourly ? $t('fields.rate') : $t('fields.unitPrice')"
        @focus="jobs.beginEdit()"
        @change="jobs.commitEdit()"
      />
      <div class="seg">
        <button :class="{ on: row.tax_status === '含稅' }" @click="setTax('含稅')">
          {{ $t('tax.included') }}
        </button>
        <button :class="{ on: row.tax_status === '未稅' }" @click="setTax('未稅')">
          {{ $t('tax.excluded') }}
        </button>
      </div>
    </div>

    <!-- Quantity / hours -->
    <div class="cell">
      <input
        v-model.number="row.quantity"
        type="number"
        min="0"
        :placeholder="hourly ? $t('fields.hours') : $t('fields.trips')"
        @focus="jobs.beginEdit()"
        @change="jobs.commitEdit()"
      />
    </div>

    <!-- Worker count -->
    <div class="cell cell-worker">
      <input
        v-if="hourly"
        v-model.number="row.worker_count"
        type="number"
        min="0"
        :placeholder="$t('fields.workerCount')"
        @focus="jobs.beginEdit()"
        @change="jobs.commitEdit()"
      />
      <span v-else class="cell-muted">—</span>
    </div>

    <!-- Total (computed) -->
    <div class="cell">
      <span class="cell-total">{{ formattedTotal }}</span>
    </div>

    <!-- Note + payment method + status -->
    <div class="cell cell-note">
      <textarea v-model="row.note" :placeholder="$t('fields.note')" rows="1" @focus="jobs.beginEdit()" @change="jobs.commitEdit()"></textarea>
      <div class="pay-line">
        <div class="seg">
          <button
            :class="{ on: row.payment_method === '現金' }"
            @click="setMethod('現金')"
          >
            {{ $t('payMethod.現金') }}
          </button>
          <button
            :class="{ on: row.payment_method === '月結' }"
            @click="setMethod('月結')"
          >
            {{ $t('payMethod.月結') }}
          </button>
        </div>
        <button
          class="chip"
          :class="row.payment_status === '已付款' ? 'paid' : 'unpaid'"
          @click="togglePaid"
        >
          {{ $t('payStatus.' + row.payment_status) }}
        </button>
      </div>
    </div>

    <!-- Delete -->
    <div class="cell cell-actions">
      <button class="row-del" :title="$t('actions.delete')" @click="emit('delete')">
        <Icon name="trash" :size="16" />
      </button>
    </div>
  </div>

  <!-- Materials used — full-width sub-row, packaging (包材) rows only -->
  <div v-if="hasMaterials" class="material-row" :class="{ invalid: materialsInvalid }">
    <div class="material-row-label">{{ $t('columns.materials') }}</div>
    <div class="material-list">
      <div v-for="(m, i) in row.materials" :key="i" class="material-line">
        <select v-model="m.name" @focus="jobs.beginEdit()" @change="jobs.commitEdit()">
          <option v-for="p in MATERIAL_PRESETS" :key="p" :value="p">{{ $t('materialPresets.' + p) }}</option>
        </select>
        <input
          v-model.number="m.quantity"
          type="number"
          min="0"
          :placeholder="$t('fields.materialQuantity')"
          @focus="jobs.beginEdit()"
          @change="jobs.commitEdit()"
        />
        <button class="material-del" :title="$t('actions.delete')" @click="removeMaterial(i)">
          <Icon name="trash" :size="14" />
        </button>
      </div>
      <button class="material-add" @click="addMaterial">
        <Icon name="add" :size="14" /><span>{{ $t('actions.addMaterial') }}</span>
      </button>
    </div>
  </div>
</template>
