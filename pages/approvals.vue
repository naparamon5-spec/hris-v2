<template>
  <div>
    <div class="page-head"><div><h1>Approvals</h1><p>Review requests filed by your team.</p></div></div>

    <div class="toolbar">
      <input v-model="q" class="input" placeholder="Search by name, ID, type, date…">
      <div class="chips">
        <button v-for="c in cats" :key="c" class="chip" :class="{ on: cat === c }" @click="cat = c">{{ c }}</button>
      </div>
    </div>

    <div v-if="selected.length" class="bulk card">
      <b>{{ selected.length }} selected</b>
      <div><button class="btn btn-danger btn-sm" @click="act(selected, 'Disapproved')">Disapprove</button>
        <button class="btn btn-primary btn-sm" @click="act(selected, 'Approved')">Approve</button></div>
    </div>

    <div class="list">
      <div v-for="t in rows" :key="t.id" class="card task" :class="{ done: t.status !== 'For Approval' }">
        <input v-if="t.status === 'For Approval'" v-model="selected" type="checkbox" :value="t.id">
        <span v-else style="width:16px" />
        <span class="av">{{ t.name.split(' ').map(s => s[0]).join('') }}</span>
        <div class="info">
          <b>{{ t.name }} <small class="m">{{ t.empId }}</small></b>
          <small>{{ t.app }} • {{ t.no }}</small>
          <small class="m">{{ t.date }} · {{ t.detail }}<template v-if="t.hours"> · {{ t.hours }} hrs</template></small>
        </div>
        <div v-if="t.status === 'For Approval'" class="btns">
          <button v-if="t.app === 'Overtime'" class="btn btn-ghost btn-sm" @click="editOt(t)">Edit hours</button>
          <button class="btn btn-danger btn-sm" @click="act([t.id], 'Disapproved')">Disapprove</button>
          <button class="btn btn-primary btn-sm" @click="act([t.id], 'Approved')">Approve</button>
        </div>
        <span v-else class="badge" :class="'badge-' + badge(t.status)">{{ t.status }}</span>
      </div>
      <p v-if="!rows.length" class="empty">Nothing here</p>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup lang="ts">
import type { Status } from '~/composables/useMockData'
const { approvals, badge } = useMockData()
const items = useState('mock-approvals', () => approvals.map(a => ({ ...a })))
const q = ref('')
const cats = ['All', 'Leave of Absence', 'Overtime', 'Call Approval', 'Manual Arrival/Departure', 'Other Requests']
const cat = ref('All')
const selected = ref<number[]>([])
const toast = ref('')
const rows = computed(() => items.value.filter(t =>
  (cat.value === 'All' || t.app === cat.value) &&
  `${t.name} ${t.empId} ${t.app} ${t.date} ${t.no}`.toLowerCase().includes(q.value.toLowerCase())))
const act = (ids: number[], s: Status) => {
  items.value.forEach(t => { if (ids.includes(t.id)) t.status = s })
  toast.value = `${s} ${ids.length} record${ids.length === 1 ? '' : 's'}`
  selected.value = []
  setTimeout(() => (toast.value = ''), 2200)
}
const editOt = (t: { hours: number }) => {
  const v = prompt('Approved OT hours', String(t.hours))
  if (v && !isNaN(+v)) { t.hours = +v; toast.value = 'Saved'; setTimeout(() => (toast.value = ''), 1800) }
}
</script>

<style scoped>
.bulk { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: .8rem 1.25rem; border-left: 4px solid var(--ardent-red); }
.bulk .btn + .btn { margin-left: .4rem; }
.list { display: flex; flex-direction: column; gap: .6rem; }
.task { display: flex; align-items: center; gap: .9rem; padding: 1rem 1.25rem; }
.task.done { opacity: .7; }
.task input { accent-color: var(--ardent-red); width: 16px; height: 16px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .88rem; min-width: 0; }
.btns { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.av { width: 40px; height: 40px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; flex-shrink: 0; }
@media (max-width: 700px) { .task { flex-wrap: wrap; } .btns { width: 100%; } }
</style>
