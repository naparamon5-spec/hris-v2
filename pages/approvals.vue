<template>
  <div>
    <div class="page-head"><div><h1>Approvals</h1><p>Review requests filed by your team.</p></div></div>

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
        </div>
        <div v-if="t.status === 'For Approval'" class="btns">
          <button class="btn btn-danger btn-sm" @click="act([t.id], 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" @click="act([t.id], 'Approved')">Approve</button>
        </div>
        <span v-else class="badge" :class="'badge-' + badge(t.status)">{{ t.status }}</span>
      </div>
      <p v-if="!rows.length" class="empty">Nothing here</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" :class="{ 'bar-space': selected.length }" />

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
const { approvals, badge } = useMockData()
const items = useState('mock-approvals', () => approvals.map(a => ({ ...a })))
const q = ref('')
const selected = ref([])
const toast = ref('')
// Filters menu: category, status, employee and request date.
const extra = ref({ category: '', status: '', employee: '', dateFrom: '', dateTo: '' })
const filterFields = computed(() => [
  { key: 'category', label: 'Category', options: ['Leave of Absence', 'Overtime', 'Call Approval', 'Manual Arrival/Departure', 'Other Requests'] },
  { key: 'status', label: 'Status', options: ['For Approval', 'Approved', 'Disapproved'] },
  { key: 'employee', label: 'Employee', options: uniq(items.value, t => t.name) },
  { key: 'date', label: 'Request date', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  return items.value.filter(t =>
    (!f.category || t.app === f.category) &&
    (!f.status || t.status === f.status) &&
    (!f.employee || t.name === f.employee) &&
    inDateRange(t.date, f.dateFrom, f.dateTo) &&
    `${t.name} ${t.empId} ${t.app} ${t.date} ${t.no}`.toLowerCase().includes(q.value.toLowerCase()))
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
  toast.value = `${s} ${n} record${n === 1 ? '' : 's'}`
  selected.value = selected.value.filter(id => !ids.includes(id))
  setTimeout(() => (toast.value = ''), 2200)
}
const { page, size, total, pages, pageRows } = usePagination(rows, 5)
</script>

<style scoped>
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
/* Only on narrow screens, where the full-width bar would cover the pager. */
@media (max-width: 860px) { .bar-space { margin-bottom: 4.5rem; } }
.action-bar {
  position: fixed; left: 50%; bottom: 1.25rem; transform: translateX(-50%); z-index: 40;
  display: flex; align-items: center; gap: 1.25rem; padding: .6rem .6rem .6rem 1.2rem;
  width: max-content; max-width: calc(100vw - 2rem);
  background: var(--ardent-navy); color: #fff; border-radius: 999px; box-shadow: 0 18px 40px -12px rgba(19,51,65,.6);
}
.ab-count { display: flex; align-items: baseline; gap: .35rem; font-size: .85rem; white-space: nowrap; }
.ab-count b { font-size: 1.1rem; }
.ab-count span { color: rgba(255,255,255,.7); }
.ab-btns { display: flex; gap: .4rem; }
.ab-ghost { background: transparent; color: rgba(255,255,255,.8); }
.ab-ghost:hover { color: #fff; background: rgba(255,255,255,.08); }
.ab-dis { background: rgba(255,255,255,.1); color: #fff; }
.ab-dis:hover { background: rgba(255,255,255,.18); }
.bar-enter-active, .bar-leave-active { transition: opacity .18s, transform .18s; }
.bar-enter-from, .bar-leave-to { opacity: 0; transform: translate(-50%, 12px); }
@media (min-width: 861px) { .action-bar { left: calc(50% + 126px); } }
@media (max-width: 640px) {
  .action-bar { left: 1rem; right: 1rem; transform: none; width: auto; border-radius: 18px; flex-wrap: wrap; justify-content: space-between; gap: .5rem; padding: .7rem; }
  .bar-enter-from, .bar-leave-to { transform: translateY(12px); }
  .ab-btns { flex: 1 1 100%; } .ab-btns .btn { flex: 1; }
}
.list { display: flex; flex-direction: column; gap: .6rem; }
.task { display: flex; align-items: center; gap: .9rem; padding: 1rem 1.25rem; }
.task.done { opacity: .7; }
.task input { accent-color: var(--ardent-red); width: 16px; height: 16px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .88rem; min-width: 0; }
.btns { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.av { width: 40px; height: 40px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; flex-shrink: 0; }
@media (max-width: 700px) { .task { flex-wrap: wrap; } .btns { width: 100%; } }
</style>
