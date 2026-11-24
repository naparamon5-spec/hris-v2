<template>
  <div v-if="meta">
    <NuxtLink to="/requests" class="back">‹ Requests</NuxtLink>
    <div class="page-head">
      <div><h1>{{ meta.title }}</h1><p>{{ meta.desc }}</p></div>
      <button v-if="!isApproved" class="btn btn-primary" @click="openForm()"><AppIcon name="plus" /> Create</button>
    </div>

    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search requests" placeholder="Search by No., Type, Approver…">
      <FilterMenu v-model="extra" :fields="filterFields" />
    </div>

    <div class="card table-wrap" style="padding:.5rem">
      <table class="table stack">
        <thead><tr><th>No.</th><th v-if="isApproved">Category</th><th>Type</th><th>Date</th><th>Hours</th><th>Approver</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.no">
            <td data-label="No."><b>{{ r.no }}</b><br><small class="m">Filed {{ r.dateFiled }}</small></td>
            <td v-if="isApproved" data-label="Category">{{ r.category }}</td>
            <td data-label="Type">{{ r.type }}</td>
            <td data-label="Date"><span>{{ r.date }}<br><small class="m">{{ r.from }} – {{ r.to }}</small></span></td>
            <td data-label="Hours">{{ r.hours }}</td>
            <td data-label="Approver">{{ r.approver }}</td>
            <td data-label="Status"><span class="badge" :class="'badge-' + badge(r.status)">{{ r.status }}</span></td>
            <td class="acts">
              <template v-if="!isApproved">
                <button v-if="r.status === 'For Approval'" class="btn btn-ghost btn-sm" @click="openForm(r)">Edit</button>
                <button v-if="r.status === 'For Approval'" class="btn btn-danger btn-sm" @click="setStatus(r, 'Cancelled')">Cancel</button>
                <button v-if="r.status === 'Approved'" class="btn btn-ghost btn-sm" @click="setStatus(r, 'Cancelled')">Reverse</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!rows.length" class="empty">No requests found</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />

    <RequestFormModal v-if="formOpen" :title="(editing ? 'Edit ' : 'New ') + meta.title" :subtypes="meta.subtypes" :record="editing" :kind="type" @close="closeForm" @save="save" />
    <Toast :msg="toast" />
  </div>
</template>

<script setup>

const route = useRoute()
const type = computed(() => route.params.type)
// Same split as hris_mobile: "records" = LOA / Call Approval / Manual Arrival-Departure /
// Overtime; "requests" = Other Requests (COE, EPP items, ...).
const approvedLists = {
  approved: { title: 'Approved Records', desc: 'Decided leave, call approval, manual arrival/departure and overtime.', keys: ['leave-of-absence', 'call-approval', 'manual-arrival-departure', 'overtime'] },
  'approved-requests': { title: 'Approved Requests', desc: 'Decided other requests (COE, EPP items and more).', keys: ['other-requests'] }
}
const isApproved = computed(() => type.value in approvedLists)
const meta = computed(() => isApproved.value
  ? { ...approvedLists[type.value], subtypes: [] }
  : requestTypes[type.value])

// Unknown request type (e.g. /requests/foo): show the 404 page instead of a blank screen.
if (!meta.value) {
  throw createError({ statusCode: 404, statusMessage: 'Request type not found', fatal: true })
}

const { requests, badge } = useMockData()
const q = ref('')
const filters = ['All', 'For Approval', 'Approved', 'Posted', 'Disapproved', 'Cancelled']
// Approved Records / Approved Requests = decided history (hris_server
// GET /auth/approvals?scope=history returns approved, disapproved and cancelled).
const decided = ['Approved', 'Posted', 'Disapproved', 'Cancelled']
const statusFilters = computed(() => (isApproved.value ? ['All', ...decided] : filters))
// Switching list (e.g. Approved Records -> Approved Requests) starts unfiltered.
const blankExtra = () => ({ status: '', category: '', type: '', approver: '', dateFrom: '', dateTo: '', filedFrom: '', filedTo: '' })
const extra = ref(blankExtra())
watch(type, () => { q.value = ''; extra.value = blankExtra() })
const toast = ref('')
let toastTimer
const flash = (m) => {
  clearTimeout(toastTimer)
  toast.value = m
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}
onBeforeUnmount(() => clearTimeout(toastTimer))

const source = computed(() => {
  if (isApproved.value) {
    return meta.value.keys.flatMap(k =>
      requests.value[k].filter(r => decided.includes(r.status)).map(r => ({ ...r, category: requestTypes[k].title })))
  }
  return requests.value[type.value] ?? []
})
// Filters menu: status, category (approved lists), type, approver, request date and filed date.
const filterFields = computed(() => [
  { key: 'status', label: 'Status', options: statusFilters.value.slice(1) },
  ...(isApproved.value ? [{ key: 'category', label: 'Category', options: uniq(source.value, r => r.category) }] : []),
  { key: 'type', label: 'Type', options: uniq(source.value, r => r.type) },
  { key: 'approver', label: 'Approver', options: uniq(source.value, r => r.approver) },
  { key: 'date', label: 'Request date', type: 'date-range' },
  { key: 'filed', label: 'Date filed', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  return source.value.filter(r =>
    (!f.status || r.status === f.status) &&
    (!f.category || r.category === f.category) &&
    (!f.type || r.type === f.type) &&
    (!f.approver || r.approver === f.approver) &&
    inDateRange(r.date, f.dateFrom, f.dateTo) &&
    inDateRange(r.dateFiled, f.filedFrom, f.filedTo) &&
    `${r.no} ${r.type} ${r.approver}`.toLowerCase().includes(q.value.toLowerCase()))
})

const formOpen = ref(false)
const editing = ref(null)
const openForm = (r = null) => { editing.value = r; formOpen.value = true }
const closeForm = () => { formOpen.value = false; editing.value = null }
const { confirm } = useConfirm()
const setStatus = async (r, s) => {
  const reverse = r.status === 'Approved'
  const ok = await confirm({
    title: reverse ? 'Reverse this approved record?' : 'Cancel this request?',
    message: `${r.no} · ${r.type} on ${r.date} will be ${reverse ? 'reversed and marked cancelled' : 'cancelled'}. This can't be undone.`,
    confirmText: reverse ? 'Yes, reverse' : 'Yes, cancel it',
    cancelText: 'Keep it',
    tone: 'danger',
    icon: reverse ? 'clock' : 'doc'
  })
  if (!ok) return
  r.status = s
  flash(reverse ? 'Record Reversed' : 'Record Cancelled')
}

const save = (data) => {
  const list = requests.value[type.value]
  if (editing.value) { Object.assign(editing.value, data); flash('Record Updated') }
  else {
    // Next number after the highest existing one, so numbers never repeat.
    const prefix = list[0]?.no.split('-')[0] ?? 'REQ'
    const next = Math.max(0, ...list.map(r => Number(r.no.split('-').pop()) || 0)) + 1
    list.unshift({
      no: `${prefix}-2026-${String(next).padStart(4, '0')}`,
      dateFiled: 'Nov 23, 2026', approver: 'Ramon Napa', status: 'For Approval', ...data
    })
    flash('Record Created · Sent for Approval')
  }
  closeForm()
}

// "File leave" / quick actions link here with ?new=1: open the form, then drop the
// query so a reload or Back doesn't reopen it. Watching (not just onMounted) also
// covers arriving while this page is already open.
const router = useRouter()
const openFromQuery = () => {
  if (!route.query.new || isApproved.value) return
  openForm()
  router.replace({ query: { ...route.query, new: undefined } })
}
onMounted(openFromQuery)
watch(() => route.query.new, openFromQuery)
const { page, size, total, pages, pageRows } = usePagination(rows, 7)
</script>

<style scoped>
.acts { white-space: nowrap; text-align: right; }
.acts .btn + .btn { margin-left: .35rem; }
</style>
