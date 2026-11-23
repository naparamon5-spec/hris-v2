<template>
  <div v-if="meta">
    <NuxtLink to="/requests" class="back">‹ Requests</NuxtLink>
    <div class="page-head">
      <div><h1>{{ meta.title }}</h1><p>{{ meta.desc }}</p></div>
      <button v-if="!isApproved" class="btn btn-primary" @click="openForm()"><AppIcon name="plus" /> Create</button>
    </div>

    <div class="toolbar">
      <input v-model="q" class="input" placeholder="Search by No., Type, Approver…">
      <div v-if="!isApproved" class="chips">
        <button v-for="s in filters" :key="s" class="chip" :class="{ on: status === s }" @click="status = s">{{ s }}</button>
      </div>
    </div>

    <div class="card table-wrap" style="padding:.5rem">
      <table class="table stack">
        <thead><tr><th>No.</th><th v-if="isApproved">Category</th><th>Type</th><th>Date</th><th>Hours</th><th>Approver</th><th>Status</th><th /></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.no">
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

    <RequestFormModal v-if="formOpen" :title="(editing ? 'Edit ' : 'New ') + meta.title" :subtypes="meta.subtypes" :record="editing" :kind="type" @close="formOpen = false" @save="save" />
    <Toast :msg="toast" />
  </div>
</template>

<script setup>

const route = useRoute()
const type = computed(() => route.params.type)
const isApproved = computed(() => type.value === 'approved')
const meta = computed(() => isApproved.value
  ? { title: 'Approved Records', desc: 'All your approved requests across categories.', subtypes: [] }
  : requestTypes[type.value])

const { requests, badge } = useMockData()
const q = ref('')
const filters = ['All', 'For Approval', 'Approved', 'Disapproved', 'Cancelled']
const status = ref('All')
const toast = ref('')
const flash = (m) => { toast.value = m; setTimeout(() => (toast.value = ''), 2200) }

const source = computed(() => {
  if (isApproved.value) {
    return Object.keys(requests.value).flatMap(k =>
      requests.value[k].filter(r => r.status === 'Approved').map(r => ({ ...r, category: requestTypes[k].title })))
  }
  return requests.value[type.value] ?? []
})
const rows = computed(() => source.value.filter(r =>
  (status.value === 'All' || r.status === status.value) &&
  `${r.no} ${r.type} ${r.approver}`.toLowerCase().includes(q.value.toLowerCase())))

const formOpen = ref(false)
const editing = ref(null)
const openForm = (r = null) => { editing.value = r; formOpen.value = true }
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
    const prefix = list[0]?.no.split('-')[0] ?? 'REQ'
    list.unshift({
      no: `${prefix}-2026-${String(141 + Math.floor(Math.random() * 800)).padStart(4, '0')}`,
      dateFiled: 'Nov 23, 2026', approver: 'Ramon Napa', status: 'For Approval', ...data
    })
    flash('Record Created · Sent for Approval')
  }
  formOpen.value = false
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
</script>

<style scoped>
.acts { white-space: nowrap; text-align: right; }
.acts .btn + .btn { margin-left: .35rem; }
</style>
