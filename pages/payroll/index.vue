<template>
  <div>
    <div class="page-head">
      <div><h1>Payroll</h1><p>Your payslips per cut-off.</p></div>
      <button class="btn btn-ghost" @click="bulk = true"><AppIcon name="download" /> Download Payslips</button>
    </div>

    <div class="toolbar">
      <input v-model="q" class="input" placeholder="Search period no. or month (e.g. 22, Oct)">
      <select v-model="year" class="input sel" aria-label="Year"><option v-for="y in years" :key="y">{{ y }}</option></select>
      <select v-model="half" class="input sel" aria-label="Cut-off">
        <option value="all">All cut-offs</option><option value="1">1st half (1–15)</option><option value="2">2nd half (16–end)</option>
      </select>
    </div>
    <div class="chips months">
      <button class="chip" :class="{ on: month === 'All' }" @click="month = 'All'">All months</button>
      <button v-for="m in months" :key="m" class="chip" :class="{ on: month === m }" @click="month = m">{{ m }}</button>
    </div>

    <h3 class="section-title">Payslip history <span class="count">{{ rows.length }}</span></h3>
    <div class="card" style="padding:.25rem 1.25rem">
      <p v-if="!rows.length" class="empty">No payslips match these filters. <a href="#" @click.prevent="reset">Clear filters</a></p>
      <NuxtLink v-for="p in rows" :key="p.period" :to="`/payroll/${p.period}`" class="row">
        <span class="icon-tile"><AppIcon name="wallet" /></span>
        <div><b>Period {{ p.period }} · {{ p.label }}</b><small class="m">Pay date {{ p.payDate }}</small></div>
        <AppIcon name="chevron" class="m" />
      </NuxtLink>
    </div>

    <div v-if="bulk" class="overlay" @click.self="bulk = false">
      <div class="card modal">
        <h2>Download Payslips</h2>
        <input v-model="bq" class="input" placeholder="Search period no. or month (e.g. 12, Oct)" style="width:100%;margin-bottom:.75rem">
        <label v-for="p in bulkRows" :key="p.period" class="pick"><input v-model="picked" type="checkbox" :value="p.period"> Period {{ p.period }} · {{ p.label }}</label>
        <div class="foot">
          <button class="btn btn-ghost" @click="bulk = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!picked.length" @click="download">Download ({{ picked.length }})</button>
        </div>
      </div>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
const { payslips } = useMockData()
const bulk = ref(false)
const bq = ref('')
const picked = ref([])
const toast = ref('')

// Filters
const q = ref('')
const year = ref('2026')
const half = ref('all')
const month = ref('All')
const years = [...new Set(payslips.map(p => p.payDate.slice(-4)))]
const months = [...new Set(payslips.map(p => p.payDate.slice(0, 3)))].reverse()
const rows = computed(() => payslips.filter(p =>
  p.payDate.endsWith(year.value) &&
  (month.value === 'All' || p.payDate.startsWith(month.value)) &&
  (half.value === 'all' || (half.value === '1') === p.label.includes(' 1 –')) &&
  `${p.period} ${p.label} ${p.payDate}`.toLowerCase().includes(q.value.toLowerCase())))
const reset = () => { q.value = ''; half.value = 'all'; month.value = 'All' }

const bulkRows = computed(() => payslips.filter(p => `${p.period} ${p.label}`.toLowerCase().includes(bq.value.toLowerCase())))
const download = () => {
  bulk.value = false
  toast.value = `Preparing ${picked.value.length} payslip(s)… (mock)`
  picked.value = []
  setTimeout(() => (toast.value = ''), 2200)
}
</script>

<style scoped>
.sel { flex: 0 0 auto; width: auto; min-width: 0; padding-left: 1rem; background-image: none; }
.months { margin-bottom: .25rem; }
.count { display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 .4rem; margin-left: .35rem; border-radius: 99px; background: #e7eef2; color: var(--ardent-navy); font-size: .68rem; letter-spacing: 0; }
@media (max-width: 640px) { .sel { flex: 1; } }
.row { display: flex; align-items: center; gap: 1rem; padding: .9rem 0; border-bottom: 1px solid var(--border); color: inherit; }
.row:last-child { border-bottom: 0; }
.row div { display: flex; flex-direction: column; flex: 1; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 440px; max-height: 90vh; overflow: auto; }
.modal h2 { font-size: 1.2rem; margin-bottom: 1rem; }
.pick { display: flex; gap: .6rem; align-items: center; padding: .55rem 0; font-size: .9rem; border-bottom: 1px solid var(--border); }
.pick input { accent-color: var(--ardent-red); }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
</style>
