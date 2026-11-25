<template>
  <div>
    <div class="page-head">
      <div><h1>Approvals</h1><p>{{ tabInfo.desc }}</p></div>
      <div class="tabs" role="tablist" aria-label="Approvals">
        <button
          v-for="t in tabs" :key="t.key" type="button" role="tab" :aria-selected="tab === t.key"
          :class="{ on: tab === t.key }" @click="setTab(t.key)"
        >
          {{ t.label }}<span v-if="t.count" class="count">{{ t.count }}</span>
        </button>
      </div>
    </div>

    <ApprovalHistory v-if="tab !== 'pending'" :module="tab" />

    <template v-else>
    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search approvals" placeholder="Search by name, ID, type, date…">
      <FilterMenu v-model="extra" :fields="filterFields" />
    </div>

    <div class="select-row">
      <label class="all" :class="{ off: !pendingIds.length }">
        <input ref="allBox" type="checkbox" :checked="allChecked" :disabled="!pendingIds.length" @change="toggleAll">
        <span>{{ allChecked ? 'Deselect all' : `Select all pending (${pendingIds.length})` }}</span>
      </label>
      <small v-if="selected.length" class="m">{{ selected.length }} of {{ pendingIds.length }} selected</small>
    </div>

    <div class="list" :class="{ selecting: selected.length }">
      <div
        v-for="t in pageRows" :key="t.id" class="card task"
        :class="{ done: t.status !== 'For Approval', picked: selected.includes(t.id) }"
        :role="t.status === 'For Approval' ? 'checkbox' : undefined"
        :aria-checked="t.status === 'For Approval' ? selected.includes(t.id) : undefined"
        :tabindex="t.status === 'For Approval' ? 0 : undefined"
        @click="t.status === 'For Approval' && toggle(t.id, $event)"
        @keydown.space.self.prevent="t.status === 'For Approval' && toggle(t.id, $event)"
      >
        <input v-if="t.status === 'For Approval'" v-model="selected" type="checkbox" :value="t.id" :aria-label="`Select ${t.name}`" @click.stop>
        <span v-else style="width:16px" />
        <span class="av">{{ t.name.split(' ').map(s => s[0]).join('') }}</span>
        <div class="info">
          <b>{{ t.name }} <small class="m">{{ t.empId }}</small></b>
          <small>{{ t.app }} • {{ t.no }}</small>
          <small class="m">{{ t.date }} · {{ t.detail }}<template v-if="t.hours"> · {{ t.hours }} hrs</template></small>
          <small v-if="t.reason" class="why"><b>{{ t.app === 'Call Approval' ? 'Purpose' : 'Reason' }}:</b> {{ t.reason }}<template v-if="t.customer"> · {{ t.customer }}</template></small>
        </div>
        <div v-if="t.status === 'For Approval'" class="btns">
          <button class="btn btn-danger btn-sm" @click="act([t.id], 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" @click="act([t.id], 'Approved')">Approve</button>
        </div>
        <span v-else class="badge" :class="'badge-' + badge(t.status)">{{ t.status }}</span>
      </div>
      <p v-if="!rows.length" class="empty">No requests waiting for your approval</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" :class="{ 'bar-space': selected.length }" />
    </template>

    <!-- Bulk action bar: stays on screen while anything is selected -->
    <Transition name="bar">
      <div v-if="selected.length" class="action-bar" role="toolbar" aria-label="Bulk actions">
        <div class="ab-count"><b>{{ selected.length }}</b><span>selected</span></div>
        <div class="ab-btns">
          <button class="btn btn-sm ab-ghost" @click="selected = []">Clear</button>
          <button class="btn btn-sm ab-dis" @click="act(selected, 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" @click="act(selected, 'Approved')">Approve {{ selected.length }}</button>
        </div>
      </div>
    </Transition>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
const { badge } = useMockData()
const { items, access, canApprove, pending } = useApprovals()
// Approver-only page (the sidebar hides it for everyone else).
if (!canApprove) navigateTo('/', { replace: true })

// Tabs: Pending | Approved Records | Approved Requests (kept in ?tab= so links and Back work).
const route = useRoute()
const router = useRouter()
const tabs = computed(() => [
  { key: 'pending', label: 'Pending', count: pending.value.length, desc: 'Requests from your team waiting for your decision.' },
  { key: 'records', label: 'Approved Records', desc: 'Leave, call approval, manual arrival/departure and overtime you approved or disapproved.' },
  ...(access.approvesRequests ? [{ key: 'requests', label: 'Approved Requests', desc: 'Other requests (COE, EPP items and more) you approved or disapproved.' }] : [])
])
const tab = computed(() => (tabs.value.some(t => t.key === route.query.tab) ? route.query.tab : 'pending'))
const tabInfo = computed(() => tabs.value.find(t => t.key === tab.value))
const setTab = (key) => router.replace({ query: key === 'pending' ? {} : { tab: key } })
watch(tab, () => { selected.value = [] })
// Header search links here with ?q=<request no.>.
const q = ref(String(route.query.q || ''))
watch(() => route.query.q, v => { if (v) q.value = String(v) })
const selected = ref([])
const toast = ref('')
// Only pending items live here (GET /auth/approvals?scope=pending). Once approved or
// disapproved they leave this list and show on Approved Records / Approved Requests.
// Filters menu: category, employee and request date.
const extra = ref({ category: '', employee: '', dateFrom: '', dateTo: '' })
const filterFields = computed(() => [
  { key: 'category', label: 'Category', options: ['Leave of Absence', 'Overtime', 'Call Approval', 'Manual Arrival/Departure', 'Other Requests'] },
  { key: 'employee', label: 'Employee', options: uniq(pending.value, t => t.name) },
  { key: 'date', label: 'Request date', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  return pending.value.filter(t =>
    (!f.category || t.app === f.category) &&
    (!f.employee || t.name === f.employee) &&
    inDateRange(t.date, f.dateFrom, f.dateTo) &&
    `${t.name} ${t.empId} ${t.app} ${t.date} ${t.no} ${t.reason || ''}`.toLowerCase().includes(q.value.toLowerCase()))
})
const { confirm } = useConfirm()

// Select all = every still-pending record in the current filtered view.
const pendingIds = computed(() => rows.value.filter(t => t.status === 'For Approval').map(t => t.id))
const allChecked = computed(() => pendingIds.value.length > 0 && pendingIds.value.every(id => selected.value.includes(id)))
const allBox = ref(null)
watchEffect(() => {
  if (allBox.value) allBox.value.indeterminate = selected.value.length > 0 && !allChecked.value
})
// Clicking anywhere on a pending card (not its buttons) checks / unchecks it.
const toggle = (id, e) => {
  if (e.target.closest('button, a, input')) return
  selected.value = selected.value.includes(id) ? selected.value.filter(x => x !== id) : [...selected.value, id]
}
const toggleAll = () => {
  selected.value = allChecked.value
    ? selected.value.filter(id => !pendingIds.value.includes(id))
    : [...new Set([...selected.value, ...pendingIds.value])]
}
// Drop selections that are no longer visible after filtering.
watch(pendingIds, ids => { selected.value = selected.value.filter(id => ids.includes(id)) })

const act = async (ids, s) => {
  const n = ids.length
  const approve = s === 'Approved'
  const one = n === 1 ? items.value.find(t => t.id === ids[0]) : null
  const ok = await confirm({
    title: `${approve ? 'Approve' : 'Disapprove'} ${n === 1 ? 'this request' : `${n} requests`}?`,
    message: one
      ? `${one.name} · ${one.app} (${one.no}) will be marked ${s.toLowerCase()}.`
      : `All ${n} selected requests will be marked ${s.toLowerCase()}.`,
    confirmText: approve ? 'Yes, approve' : 'Yes, disapprove',
    tone: approve ? 'primary' : 'danger',
    icon: approve ? 'check' : 'shield'
  })
  if (!ok) return
  items.value.forEach(t => { if (ids.includes(t.id)) t.status = s })
  const where = ids.every(id => items.value.find(t => t.id === id)?.app === 'Other Requests') ? 'Approved Requests'
    : ids.some(id => items.value.find(t => t.id === id)?.app === 'Other Requests') ? 'Approved Records / Requests' : 'Approved Records'
  toast.value = `${s} ${n} record${n === 1 ? '' : 's'} · see ${where}`
  selected.value = selected.value.filter(id => !ids.includes(id))
  setTimeout(() => (toast.value = ''), 2200)
}
const { page, size, total, pages, pageRows } = usePagination(rows, 5)
</script>

<style scoped>
.page-head .tabs { margin-bottom: 0; }
.tabs .count { margin-left: .45rem; font-size: .7rem; font-weight: 700; padding: .05rem .45rem; border-radius: 999px; background: var(--ardent-red); color: #fff; }
.select-row { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .2rem .4rem .7rem 1.3rem; }
.all { display: flex; align-items: center; gap: .9rem; font-size: .85rem; font-weight: 600; cursor: pointer; }
.all.off { opacity: .5; cursor: default; }
.all input { accent-color: var(--ardent-red); width: 16px; height: 16px; }
.task { transition: border-color .15s, background .15s, box-shadow .15s; }
.task.picked { border-color: var(--ardent-red); background: #fff7f8; box-shadow: var(--ring); }
.task:not(.done) { cursor: pointer; user-select: none; }
.task:not(.done):hover:not(.picked) { border-color: var(--ardent-gray, #d7d7d7); background: #fcfcfd; }
.task:focus-visible { outline: none; box-shadow: var(--ring); }
.selecting .btns { display: none; }
.why { color: var(--text); }
.why b { font-weight: 600; color: var(--muted); }
.list { display: flex; flex-direction: column; gap: .6rem; }
.task { display: flex; align-items: center; gap: .9rem; padding: 1rem 1.25rem; }
.task.done { opacity: .7; }
.task input { accent-color: var(--ardent-red); width: 16px; height: 16px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .88rem; min-width: 0; }
.btns { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.av { width: 40px; height: 40px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; flex-shrink: 0; }
@media (max-width: 700px) { .task { flex-wrap: wrap; } .btns { width: 100%; } }
</style>
