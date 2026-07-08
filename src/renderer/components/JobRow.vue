<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  row: { type: Object, required: true }
})
const emit = defineEmits(['delete'])

const total = computed(
  () => (Number(props.row.unit_price) || 0) * (Number(props.row.quantity) || 0)
)

const formattedTotal = computed(() => total.value.toLocaleString())

function setTax(value) {
  props.row.tax_status = value
}
function setMethod(value) {
  props.row.payment_method = value
}
function togglePaid() {
  props.row.payment_status =
    props.row.payment_status === '已付款' ? '未付款' : '已付款'
}
</script>

<template>
  <div class="job-row">
    <!-- Date / Time -->
    <div class="cell">
      <input v-model="row.job_date" :placeholder="$t('fields.date')" maxlength="8" />
      <input v-model="row.job_time" :placeholder="$t('fields.time')" />
    </div>

    <!-- Name / Phone -->
    <div class="cell">
      <input v-model="row.customer_name" :placeholder="$t('fields.name')" />
      <input v-model="row.phone" :placeholder="$t('fields.phone')" />
    </div>

    <!-- Move in / Move out -->
    <div class="cell cell-inout">
      <input v-model="row.move_in_address" :placeholder="$t('fields.moveIn')" />
      <input v-model="row.move_out_address" :placeholder="$t('fields.moveOut')" />
    </div>

    <!-- Unit price + tax toggle -->
    <div class="cell">
      <input v-model.number="row.unit_price" type="number" min="0" />
      <div class="seg">
        <button :class="{ on: row.tax_status === '含稅' }" @click="setTax('含稅')">
          {{ $t('tax.included') }}
        </button>
        <button :class="{ on: row.tax_status === '未稅' }" @click="setTax('未稅')">
          {{ $t('tax.excluded') }}
        </button>
      </div>
    </div>

    <!-- Quantity -->
    <div class="cell">
      <input v-model.number="row.quantity" type="number" min="0" />
    </div>

    <!-- Total (computed) -->
    <div class="cell">
      <span class="cell-total">{{ formattedTotal }}</span>
    </div>

    <!-- Note + payment method + status -->
    <div class="cell cell-note">
      <textarea v-model="row.note" :placeholder="$t('fields.note')" rows="1"></textarea>
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
</template>
