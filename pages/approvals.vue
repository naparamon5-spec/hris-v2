<template>
  <div>
    <div class="page-head">
      <div><h1>{{ tabInfo.title }}</h1><p>{{ tabInfo.desc }}</p></div>
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
        :class="{ done: !isPendingStatus(t.status), picked: selected.includes(t.id) }"
        :role="isPendingStatus(t.status) ? 'checkbox' : undefined"
        :aria-checked="isPendingStatus(t.status) ? selected.includes(t.id) : undefined"
        :tabindex="isPendingStatus(t.status) ? 0 : undefined"
        @click="isPendingStatus(t.status) && toggle(t.id, $event)"
        @keydown.space.self.prevent="isPendingStatus(t.status) && toggle(t.id, $event)"
      >
        <input v-if="isPendingStatus(t.status)" v-model="selected" type="checkbox" :value="t.id" :aria-label="`Select ${t.name}`" @click.stop>
        <span v-else style="width:16px" />
        <span class="av">{{ initialsOf(t.name) }}</span>
        <div class="info">
          <b>{{ t.name }} <small class="m">{{ t.empId }}</small></b>
          <small>{{ t.app }} • {{ t.no }}</small>
          <small class="m">{{ t.date }} · {{ t.detail }}<template v-if="t.hours"> · {{ t.hours }} hrs</template></small>
          <small v-if="t.reason" class="why"><b>{{ t.app === 'Call Approval' ? 'Purpose' : 'Reason' }}:</b> {{ t.reason }}</small>
          <small v-if="t.status === 'For Witness Approval'" class="m">Waiting for you as witness</small>
          <!-- OT approved hours: POST /auth/approvals/overtime/:id/approved-hours (never more than applied). -->
          <div v-if="t.apiType === 'overtime' && t.status === 'For Approval'" class="ot" @click.stop>
            <template v-if="otEdit === t.id">
              <input v-model.number="otH" class="input" type="number" min="0" aria-label="Approved hours"> h
              <input v-model.number="otM" class="input" type="number" min="0" max="59" aria-label="Approved minutes"> m
              <button class="btn btn-primary btn-sm" :disabled="busy" @click="saveOt(t)">Save</button>
              <button class="btn btn-ghost btn-sm" @click="otEdit = null">Cancel</button>
            </template>
            <button v-else class="btn btn-ghost btn-sm" @click="editOt(t)">Edit approved OT hours</button>
          </div>
        </div>
        <div v-if="isPendingStatus(t.status)" class="btns">
          <button class="btn btn-danger btn-sm" :disabled="busy" @click="act([t.id], 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" :disabled="busy" @click="act([t.id], 'Approved')">Approve</button>
        </div>
        <span v-else class="badge" :class="'badge-' + badge(t.status)">{{ t.status }}</span>
      </div>
      <p v-if="loading" class="empty">Loading…</p>
      <p v-else-if="loadError" class="empty">{{ loadError }} <a href="#" @click.prevent="load">Try again</a></p>
      <p v-else-if="!rows.length" class="empty">No requests waiting for your approval</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" :class="{ 'bar-space': selected.length }" />
    </template>

    <!-- Bulk action bar: stays on screen while anything is selected -->
    <Transition name="bar">
      <div v-if="selected.length" class="action-bar" role="toolbar" aria-label="Bulk actions">
        <div class="ab-count"><b>{{ selected.length }}</b><span>selected</span></div>
        <div class="ab-btns">
          <button class="btn btn-sm ab-ghost" @click="selected = []">Clear</button>
          <button class="btn btn-sm ab-dis" :disabled="busy" @click="act(selected, 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" :disabled="busy" @click="act(selected, 'Approved')">Approve {{ selected.length }}</button>
        </div>
      </div>
    </Transition>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
import { badge } from '~/utils/format'
// Approver inbox (BACKEND.md §8): GET /auth/approvals?scope=pending for records, requests
// (Versatech HR) and witness MADs; POST /auth/requests/:type/:id/approve|disapprove per item
// (no bulk endpoint — §0 #9); OT hours via /auth/approvals/overtime/:id/approved-hours.
const api = useApi()
const { access, canApprove, approvesRequests, reloadAccess } = useApprovals()
// Approver-only page (the sidebar hides it for everyone else).
if (access.value && !canApprove.value) navigateTo('/', { replace: true })

const isPendingStatus = (s) => s === 'For Approval' || s === 'For Witness Approval'
const initialsOf = (n) => String(n || '').replace(',', ' ').split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join('').toUpperCase()

const items = ref([])
const loading = ref(true)
const loadError = ref('')
const load = async () => {
  loading.value = true
  loadError.value = ''
  const modules = [
    access.value?.isApprover && 'records',
    approvesRequests.value && 'requests',
    access.value?.isWitness && 'witness'
  ].filter(Boolean)
  try {
    const lists = await Promise.all(modules.map(m => api(`/auth/approvals?scope=pending&module=${m}`).then(r => r.data || [])))
    const seen = new Set()
    items.value = lists.flat().map(toApproval).filter(t => !seen.has(t.id) && seen.add(t.id))
  } catch (e) {
    loadError.value = apiError(e, 'Unable to load approvals.')
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => access.value, (a, old) => { if (a && !old) load() })
const pending = computed(() => items.value.filter(t => isPendingStatus(t.status)))

// Tabs: Pending | Approved Records | Approved Requests (kept in ?tab= so links and Back work).
const route = useRoute()
const router = useRouter()
const tabs = computed(() => [
  { key: 'pending', label: 'Pending', title: 'Approvals', count: pending.value.length, desc: 'Requests from your team waiting for your decision.' },
  ...(access.value?.isApprover ? [{ key: 'records', label: 'Approved Records', title: 'Approved Records', desc: 'Leave, call approval, manual arrival/departure and overtime you approved or disapproved.' }] : []),
  ...(approvesRequests.value ? [{ key: 'requests', label: 'Approved Requests', title: 'Approved Requests', desc: 'Other requests (COE, EPP items and more) you approved or disapproved.' }] : [])
])
const tab = computed(() => (tabs.value.some(t => t.key === route.query.tab) ? route.query.tab : 'pending'))
const tabInfo = computed(() => tabs.value.find(t => t.key === tab.value))
const setTab = (key) => router.replace({ query: key === 'pending' ? {} : { tab: key } })
watch(tab, () => { selected.value = [] })
// Header search links here with ?q=<request no.>.
const q = ref(String(route.query.q || ''))
watch(() => route.query.q, v => { if (v) q.value = String(v) })
// ?item=<type>:<id> (from a notification): show just that request once the list is loaded.
const focusItem = () => {
  const id = route.query.item
  if (!id || loading.value) return
  router.replace({ query: { ...route.query, item: undefined } })
  const t = items.value.find(x => x.id === String(id))
  if (t) q.value = String(t.no)
  else flash('This request has already been handled')
}
watch([() => route.query.item, loading], focusItem, { immediate: true })
const selected = ref([])
const toast = ref('')
const busy = ref(false)
const flash = (m) => { toast.value = m; setTimeout(() => (toast.value = ''), 2600) }
// Filters menu: category, employee and request date.
const extra = ref({ category: '', employee: '', dateFrom: '', dateTo: '' })
const filterFields = computed(() => [
  { key: 'category', label: 'Category', options: uniq(pending.value, t => t.app) },
  { key: 'employee', label: 'Employee', options: uniq(pending.value, t => t.name) },
  { key: 'date', label: 'Request date', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  return newestFirst(pending.value.filter(t =>
    (!f.category || t.app === f.category) &&
    (!f.employee || t.name === f.employee) &&
    inDateRange(t.date, f.dateFrom, f.dateTo) &&
    `${t.name} ${t.empId} ${t.app} ${t.date} ${t.no} ${t.reason || ''}`.toLowerCase().includes(q.value.toLowerCase())), t => t.date, t => t.no)
})
const { confirm } = useConfirm()

// Select all = every still-pending record in the current filtered view.
const pendingIds = computed(() => rows.value.filter(t => isPendingStatus(t.status)).map(t => t.id))
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
      ? `${one.name} · ${one.app} (${one.no}) will be ${s.toLowerCase()}.`
      : `All ${n} selected requests will be ${s.toLowerCase()}.`,
    confirmText: approve ? 'Yes, approve' : 'Yes, disapprove',
    tone: approve ? 'primary' : 'danger',
    icon: approve ? 'check' : 'shield'
  })
  if (!ok) return
  busy.value = true
  const picked = items.value.filter(t => ids.includes(t.id))
  const res = await Promise.allSettled(picked.map(t =>
    api(`/auth/requests/${t.apiType}/${t.apiId}/${approve ? 'approve' : 'disapprove'}`, { method: 'POST' })))
  const failed = res.filter(x => x.status === 'rejected')
  const done = n - failed.length
  selected.value = selected.value.filter(id => !ids.includes(id))
  busy.value = false
  flash(failed.length
    ? (n === 1 ? apiError(failed[0].reason) : `${done} ${s.toLowerCase()}, ${failed.length} failed`)
    : `${s} ${n} record${n === 1 ? '' : 's'}`)
  await load()
  reloadAccess()
}

// OT approved hours (hours + minutes).
const otEdit = ref(null)
const otH = ref(0)
const otM = ref(0)
const editOt = (t) => {
  const [h, m] = String(t.approvedOtHours && t.approvedOtHours !== '0:00' ? t.approvedOtHours : t.appliedHours || '0:00').split(':').map(Number)
  otH.value = h || 0
  otM.value = m || 0
  otEdit.value = t.id
}
const saveOt = async (t) => {
  busy.value = true
  try {
    const r = await api(`/auth/approvals/overtime/${t.apiId}/approved-hours`, { method: 'POST', body: { hours: otH.value || 0, minutes: otM.value || 0 } })
    flash(r.message || 'Approved OT hours updated')
    otEdit.value = null
    await load()
  } catch (e) {
    flash(apiError(e, 'Unable to update the approved OT hours.'))
  } finally {
    busy.value = false
  }
}
const { page, size, total, pages, pageRows } = usePagination(rows, 6)
</script>

<style scoped>
.page-head .tabs { margin-bottom: 0; }
.tabs .count { margin-left: .45rem; font-size: .7rem; font-weight: 700; padding: .05rem .45rem; border-radius: 999px; background: var(--ardent-red); color: #fff; }
.select-row { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: 0 .4rem .5rem 1.3rem; }
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
.list { display: flex; flex-direction: column; gap: .4rem; }
.task { display: flex; align-items: center; gap: .9rem; padding: .7rem 1.25rem; }
.info > b { font-weight: 700; }
.info small { line-height: 1.45; }
.task.done { opacity: .7; }
.task input { accent-color: var(--ardent-red); width: 16px; height: 16px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .88rem; min-width: 0; }
.btns { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.av { width: 40px; height: 40px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; flex-shrink: 0; }
@media (max-width: 700px) { .task { flex-wrap: wrap; } .btns { width: 100%; } }
.ot { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem; margin-top: .35rem; font-size: .8rem; }
.ot .input { width: 64px; padding: .35rem .5rem; }
</style>
