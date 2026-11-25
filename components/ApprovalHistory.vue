<template>
  <!-- Several root nodes on purpose: they sit straight in the page's flex column, so the
       Pager stays pinned to the bottom like on every other list. -->
  <div class="toolbar">
    <input v-model="q" class="input" type="search" :aria-label="`Search ${title}`" placeholder="Search by No., Employee, Type, Reason…">
    <FilterMenu v-model="extra" :fields="filterFields" />
  </div>

  <div class="card table-wrap" style="padding:.5rem">
    <table class="table stack">
      <thead>
        <tr>
          <th>No.</th><th>Employee</th><th v-if="module === 'records'">Category</th><th>Type</th><th>Date</th>
          <th>Hours</th><th>Reason / Purpose</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in pageRows" :key="r.no">
          <td data-label="No."><b>{{ r.no }}</b></td>
          <td data-label="Employee">{{ r.name }}<br><small class="m">{{ r.empId }}</small></td>
          <td v-if="module === 'records'" data-label="Category">{{ r.app }}</td>
          <td data-label="Type">{{ r.type }}</td>
          <td data-label="Date">{{ r.date }}</td>
          <td data-label="Hours">{{ r.hours || '—' }}</td>
          <td data-label="Reason / Purpose" class="why">
            <span :title="r.reason">{{ r.reason || '—' }}</span>
            <small v-if="r.customer" class="m">{{ r.customer }}</small>
          </td>
          <td data-label="Status"><span class="badge" :class="'badge-' + badge(r.status)">{{ r.status }}</span></td>
        </tr>
      </tbody>
    </table>
    <p v-if="!rows.length" class="empty">Nothing decided yet</p>
  </div>
  <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
</template>

<script setup>
// Approved Records (module "records") / Approved Requests (module "requests"):
// what this approver already approved or disapproved.
// Replace with: api(`/auth/approvals?scope=history&module=${module}`)
const props = defineProps({ module: { type: String, required: true } })
const { badge } = useMockData()
const { items } = useApprovals()

const title = computed(() => (props.module === 'records' ? 'Approved Records' : 'Approved Requests'))
const decided = ['Approved', 'Posted', 'Disapproved', 'Cancelled']
const source = computed(() => items.value
  .filter(a => decided.includes(a.status) && isRequestsModule(a.app) === (props.module === 'requests'))
  .map(a => ({ ...a, type: a.detail.split(' • ')[0] })))

const q = ref('')
const blank = () => ({ status: '', category: '', type: '', employee: '', dateFrom: '', dateTo: '' })
const extra = ref(blank())
watch(() => props.module, () => { q.value = ''; extra.value = blank() })
const filterFields = computed(() => [
  { key: 'status', label: 'Status', options: decided },
  ...(props.module === 'records' ? [{ key: 'category', label: 'Category', options: uniq(source.value, r => r.app) }] : []),
  { key: 'type', label: 'Type', options: uniq(source.value, r => r.type) },
  { key: 'employee', label: 'Employee', options: uniq(source.value, r => r.name) },
  { key: 'date', label: 'Request date', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  const needle = q.value.toLowerCase()
  return newestFirst(source.value.filter(r =>
    (!f.status || r.status === f.status) &&
    (!f.category || r.app === f.category) &&
    (!f.type || r.type === f.type) &&
    (!f.employee || r.name === f.employee) &&
    inDateRange(r.date, f.dateFrom, f.dateTo) &&
    `${r.no} ${r.name} ${r.empId} ${r.app} ${r.type} ${r.reason || ''} ${r.customer || ''}`.toLowerCase().includes(needle)), r => r.date, r => r.no)
})
const { page, size, total, pages, pageRows } = usePagination(rows, 7)
</script>

<style scoped>
.why { max-width: 260px; }
.why span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.why small { display: block; font-size: .74rem; }
@media (max-width: 640px) { .why { max-width: none; } .why span { white-space: normal; } }
</style>
