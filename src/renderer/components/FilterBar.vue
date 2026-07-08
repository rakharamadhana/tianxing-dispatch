<script setup>
import { reactive } from 'vue'
import Icon from './Icon.vue'

const emit = defineEmits(['apply', 'clear'])

const local = reactive({
  dateQuery: '',
  phoneQuery: '',
  taxFilter: '',
  paymentMethod: '',
  paymentStatus: ''
})

function apply() {
  emit('apply', { ...local })
}

function toggle(key, value) {
  local[key] = local[key] === value ? '' : value
  apply()
}

function clearAll() {
  local.dateQuery = ''
  local.phoneQuery = ''
  local.taxFilter = ''
  local.paymentMethod = ''
  local.paymentStatus = ''
  emit('clear')
}
</script>

<template>
  <div class="filterbar">
    <div class="search-field">
      <Icon name="search" :size="15" />
      <input
        v-model="local.dateQuery"
        :placeholder="$t('filters.searchDate')"
        @keyup.enter="apply"
        @blur="apply"
      />
    </div>
    <div class="search-field">
      <Icon name="search" :size="15" />
      <input
        v-model="local.phoneQuery"
        :placeholder="$t('filters.searchPhone')"
        @keyup.enter="apply"
        @blur="apply"
      />
    </div>

    <span class="filter-group">
      <span class="filter-label">{{ $t('filters.tax') }}</span>
      <button
        class="pill"
        :class="{ on: local.taxFilter === '含稅' }"
        @click="toggle('taxFilter', '含稅')"
      >
        {{ $t('tax.included') }}
      </button>
      <button
        class="pill"
        :class="{ on: local.taxFilter === '未稅' }"
        @click="toggle('taxFilter', '未稅')"
      >
        {{ $t('tax.excluded') }}
      </button>
    </span>

    <span class="filter-group">
      <span class="filter-label">{{ $t('filters.payment') }}</span>
      <button
        class="pill"
        :class="{ on: local.paymentMethod === '現金' }"
        @click="toggle('paymentMethod', '現金')"
      >
        {{ $t('payMethod.現金') }}
      </button>
      <button
        class="pill"
        :class="{ on: local.paymentMethod === '月結' }"
        @click="toggle('paymentMethod', '月結')"
      >
        {{ $t('payMethod.月結') }}
      </button>
      <button
        class="pill"
        :class="{ on: local.paymentStatus === '已付款' }"
        @click="toggle('paymentStatus', '已付款')"
      >
        {{ $t('payStatus.已付款') }}
      </button>
      <button
        class="pill"
        :class="{ on: local.paymentStatus === '未付款' }"
        @click="toggle('paymentStatus', '未付款')"
      >
        {{ $t('payStatus.未付款') }}
      </button>
    </span>

    <span class="grow"></span>
    <button class="btn small" @click="clearAll">{{ $t('filters.clear') }}</button>
  </div>
</template>
