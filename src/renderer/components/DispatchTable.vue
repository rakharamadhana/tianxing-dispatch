<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import JobRow from './JobRow.vue'
import FilterBar from './FilterBar.vue'
import Icon from './Icon.vue'

const props = defineProps({
  jobs: { type: Object, required: true } // the useJobs() instance
})

// Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z to redo — app-level, overrides native input undo.
function onKeydown(e) {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
  e.preventDefault()
  if (e.shiftKey) {
    props.jobs.redo()
  } else {
    props.jobs.undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const PAGE_SIZE = 10
const page = ref(1)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.jobs.rows.value.length / PAGE_SIZE))
)

const pagedRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return props.jobs.rows.value.slice(start, start + PAGE_SIZE)
})

// Keep the page in range when the row count changes.
watch(pageCount, (n) => {
  if (page.value > n) page.value = n
})

function absoluteIndex(localIndex) {
  return (page.value - 1) * PAGE_SIZE + localIndex
}

function prevPage() {
  if (page.value > 1) page.value--
}
function nextPage() {
  if (page.value < pageCount.value) page.value++
}

function addRow() {
  props.jobs.addRow()
  page.value = pageCount.value // jump to the page holding the new row
}
</script>

<template>
  <!-- Toolbar: page nav (left) + actions (right) -->
  <div class="toolbar">
    <div class="pager">
      <button class="btn icon-only" @click="prevPage" :disabled="page <= 1" :title="$t('actions.prevPage')">
        <Icon name="chevron-left" :size="16" />
      </button>
      <span class="page-indicator">{{ page }} / {{ pageCount }}</span>
      <button class="btn icon-only" @click="nextPage" :disabled="page >= pageCount" :title="$t('actions.nextPage')">
        <Icon name="chevron-right" :size="16" />
      </button>
    </div>

    <button class="btn" @click="addRow">
      <Icon name="add" :size="16" /><span>{{ $t('actions.addRow') }}</span>
    </button>

    <span v-if="jobs.saving.value || jobs.dirty.value" class="dirty-flag">
      <span class="dot"></span>{{ $t('status.saving') }}
    </span>
    <span v-else-if="!jobs.saveError.value" class="saved-flag">
      {{ $t('status.saved') }}
    </span>
    <span v-if="jobs.saveError.value" class="error-flag">
      <span class="dot"></span>{{ $t('validation.' + jobs.saveError.value) }}
    </span>

    <span class="grow"></span>

    <!-- Summary / payroll: placeholders for a later phase -->
    <button class="btn" disabled>
      <Icon name="summary" :size="16" /><span>{{ $t('actions.summary') }}</span>
    </button>
    <button class="btn" disabled>
      <Icon name="summary" :size="16" /><span>{{ $t('actions.fullSummary') }}</span>
    </button>
    <button class="btn" disabled>
      <Icon name="payroll" :size="16" /><span>{{ $t('actions.payroll') }}</span>
    </button>

    <button class="btn icon-only" :disabled="!jobs.canUndo.value" :title="$t('actions.undo')" @click="jobs.undo()">
      <Icon name="undo" :size="16" />
    </button>
    <button class="btn icon-only" :disabled="!jobs.canRedo.value" :title="$t('actions.redo')" @click="jobs.redo()">
      <Icon name="redo" :size="16" />
    </button>
  </div>

  <!-- Grid -->
  <div class="content">
    <div class="card">
      <div class="grid-head">
        <div class="h">{{ $t('columns.projectType') }}</div>
        <div class="h">{{ $t('columns.dateTime') }}</div>
        <div class="h">{{ $t('columns.namePhone') }}</div>
        <div class="h">{{ $t('columns.inOut') }}</div>
        <div class="h">{{ $t('columns.unitPrice') }}</div>
        <div class="h">{{ $t('columns.quantity') }}</div>
        <div class="h">{{ $t('columns.workerCount') }}</div>
        <div class="h">{{ $t('columns.total') }}</div>
        <div class="h">{{ $t('columns.note') }}</div>
        <div class="h"></div>
      </div>

      <div v-if="jobs.rows.value.length === 0" class="empty-state">
        {{ $t('status.empty') }}
      </div>

      <JobRow
        v-for="(row, i) in pagedRows"
        :key="row._key"
        :row="row"
        :jobs="jobs"
        @delete="jobs.removeRow(absoluteIndex(i))"
      />
    </div>
  </div>

  <!-- Bottom search / filters -->
  <FilterBar @apply="jobs.applyFilters" @clear="jobs.clearFilters" />
</template>
