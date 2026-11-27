<template>
  <div>
    <div class="page-head">
      <div><h1>Payslips</h1><p>Your payslips per cut-off.</p></div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="bulk = true"><AppIcon name="download" /> Download Payslips</button>
        <PayrollTabs />
      </div>
    </div>

    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search payslips" placeholder="Search period no. or month (e.g. 22, Oct)">
      <AppSelect v-model="year" :options="years" aria-label="Year" class="dd" />
      <AppSelect v-model="month" :options="monthOptions" aria-label="Month" class="dd dd-month" />
      <AppSelect v-model="half" :options="halves" aria-label="Cut-off" class="dd" />
    </div>

    <h3 class="section-title">Payslip history <span class="count">{{ rows.length }}</span></h3>
    <div class="card" style="padding:.25rem 1.25rem">
      <p v-if="pending" class="empty">Loading…</p>
      <p v-else-if="error" class="empty">{{ apiError(error, 'Unable to load payslips.') }} <a href="#" @click.prevent="refresh()">Try again</a></p>
      <p v-else-if="!rows.length" class="empty">No payslips match these filters. <a href="#" @click.prevent="reset">Clear filters</a></p>
      <NuxtLink v-for="p in pageRows" :key="p.id" :to="`/payroll/${p.id}`" class="row">
        <span class="icon-tile"><AppIcon name="wallet" /></span>
        <div><b>Period {{ p.period }} · {{ p.label }}</b><small class="m">Pay date {{ p.payDate }}</small></div>
        <AppIcon name="chevron" class="m" />
      </NuxtLink>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />

    <!-- On <body>, so the dim background also covers the sticky header. -->
    <Teleport to="body">
    <div v-if="bulk" class="overlay">
      <div class="card modal">
        <DialogClose @click="bulk = false" />
        <h2>Download Payslips</h2>
        <input v-model="bq" class="input" type="search" aria-label="Search payslips to download" placeholder="Search period no. or month (e.g. 12, Oct)" style="width:100%;margin-bottom:.6rem">
        <!-- Quick filters: narrow the list by year, month and cutoff, then Select all. -->
        <div class="bfilters">
          <div class="bf-head">
            <span class="bf-label">Filter</span>
            <button v-if="bfActive" type="button" class="bf-clear" @click="clearBulkFilters">
              <span aria-hidden="true">×</span> Clear filters
            </button>
          </div>
          <AppSelect v-model="bf.year" :options="[{ value: '', label: 'All years' }, ...bulkYears]" aria-label="Filter by year" full />
          <AppSelect v-model="bf.month" :options="[{ value: '', label: 'All months' }, ...bulkMonths]" aria-label="Filter by month" full />
          <AppSelect v-model="bf.half" :options="[{ value: '', label: 'Both cutoffs' }, { value: '1', label: '1st cutoff (1–15)' }, { value: '2', label: '2nd cutoff (16–end)' }]" aria-label="Filter by cutoff" full />
        </div>
        <!-- Select all = every payslip shown by the current search. -->
        <label class="pick all" :class="{ off: !bulkRows.length }">
          <input ref="allBox" type="checkbox" :checked="allPicked" :disabled="!bulkRows.length" @change="toggleAllPicked">
          <b>{{ allPicked ? 'Deselect all' : `Select all (${bulkRows.length})` }}</b>
          <small v-if="picked.length" class="m sel">{{ picked.length }} selected</small>
        </label>
        <!-- Only the payslip list scrolls; Select all, the password and the buttons stay put. -->
        <div class="pick-list">
          <label v-for="p in bulkRows" :key="p.id" class="pick"><input v-model="picked" type="checkbox" :value="p.id"> Period {{ p.period }} · {{ p.label }} <small class="m">{{ p.year }}</small></label>
        </div>
        <!-- Payslips contain salary details: confirm the password first (POST /auth/verify-password). -->
        <div class="field" style="margin-top:.75rem">
          <label for="bulk-pw">Your password</label>
          <input id="bulk-pw" v-model="bulkPw" class="input" type="password" autocomplete="current-password" placeholder="Enter your password" style="width:100%">
          <small v-if="bulkErr" class="err" role="alert">{{ bulkErr }}</small>
        </div>
        <div class="foot">
          <button class="btn btn-ghost" @click="bulk = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!picked.length || !bulkPw || downloading" @click="download">{{ downloading ? 'Preparing…' : `Download (${picked.length})` }}</button>
        </div>
      </div>
    </div>
    </Teleport>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
import { apiError } from '~/composables/useApi'
// GET /auth/payslips (last 24 only — older years show empty, BACKEND.md G22). Bulk download:
// password check, then GET /auth/payslips/:id per pick, printed as one PDF in the browser.
const api = useApi()
const me = useMe()
const { data: payslips, pending, error, refresh } = await useAsyncData('payslips',
  () => api('/auth/payslips').then(r => (r.data || []).map(toPayslip)), { default: () => [], server: false })
const bulk = ref(false)
// Header search "Download Payslips" links here with ?download=1: open the picker, then drop the query.
const route = useRoute()
const openBulkFromQuery = () => {
  if (!route.query.download) return
  bulk.value = true
  navigateTo({ query: { ...route.query, download: undefined } }, { replace: true })
}
onMounted(openBulkFromQuery)
watch(() => route.query.download, openBulkFromQuery)
const bq = ref('')
const picked = ref([])
const toast = ref('')
const flash = (m) => { toast.value = m; setTimeout(() => (toast.value = ''), 2600) }

// Filters
const q = ref('')
const year = ref(String(new Date().getFullYear()))
const half = ref('all')
const halves = [{ value: 'all', label: 'All cut-offs' }, { value: '1', label: '1st half (1–15)' }, { value: '2', label: '2nd half (16–end)' }]
const month = ref('All')
const years = computed(() => {
  const ys = [...new Set(payslips.value.map(p => p.payDate.slice(-4)).filter(Boolean))].sort().reverse()
  return ys.length ? ys : [year.value]
})
watch(years, (ys) => { if (!ys.includes(year.value)) year.value = ys[0] })
// All 12 months, each with how many payslips it has in the chosen year.
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthOptions = computed(() => [
  { value: 'All', label: 'All months' },
  ...monthNames.map(n => {
    const c = payslips.value.filter(p => p.payDate.endsWith(year.value) && p.monthShort === n.slice(0, 3)).length
    return { value: n.slice(0, 3), label: c ? `${n} (${c})` : n }
  })
])
const rows = computed(() => newestFirst(payslips.value.filter(p =>
  p.payDate.endsWith(year.value) &&
  (month.value === 'All' || p.monthShort === month.value) &&
  (half.value === 'all' || p.half === half.value) &&
  `${p.period} ${p.label} ${p.payDate}`.toLowerCase().includes(q.value.toLowerCase())), p => p.payDate, p => p.period))
const reset = () => { q.value = ''; half.value = 'all'; month.value = 'All' }

// Download filters (year / pay month / cutoff) on top of the text search.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// Month of the pay period itself ("Nov 16 – 30" -> Nov), not of its pay date.
const monthOf = (p) => String(p.label || '').slice(0, 3)
const bf = reactive({ year: '', month: '', half: '' })
const bfActive = computed(() => !!(bf.year || bf.month || bf.half))
const clearBulkFilters = () => Object.assign(bf, { year: '', month: '', half: '' })
const bulkYears = computed(() => uniq(payslips.value, p => p.year).sort((a, b) => b - a))
const bulkMonths = computed(() => MONTHS.filter(m => payslips.value.some(p => monthOf(p) === m && (!bf.year || p.year === bf.year))))
const bulkRows = computed(() => newestFirst(payslips.value.filter(p =>
  (!bf.year || p.year === bf.year) &&
  (!bf.month || monthOf(p) === bf.month) &&
  (!bf.half || p.half === bf.half) &&
  `${p.period} ${p.label} ${p.year}`.toLowerCase().includes(bq.value.toLowerCase())), p => p.payDate, p => p.period))
const shownIds = computed(() => bulkRows.value.map(p => p.id))
const allPicked = computed(() => shownIds.value.length > 0 && shownIds.value.every(id => picked.value.includes(id)))
const somePicked = computed(() => shownIds.value.some(id => picked.value.includes(id)))
const toggleAllPicked = () => {
  picked.value = allPicked.value
    ? picked.value.filter(id => !shownIds.value.includes(id))
    : [...new Set([...picked.value, ...shownIds.value])]
}
// Checkbox shows "–" when only some of the shown payslips are picked.
const allBox = ref(null)
watchEffect(() => { if (allBox.value) allBox.value.indeterminate = somePicked.value && !allPicked.value })

const bulkPw = ref('')
const bulkErr = ref('')
const downloading = ref(false)
watch(bulk, (o) => { if (!o) { bulkPw.value = ''; bulkErr.value = ''; clearBulkFilters() } })
const download = async () => {
  bulkErr.value = ''
  downloading.value = true
  try {
    const bad = await verifyPassword(api, bulkPw.value)
    if (bad) { bulkErr.value = bad; bulkPw.value = ''; return }
    const slips = await Promise.all(picked.value.map(id => api(`/auth/payslips/${id}`).then(toPayslip)))
    const ok = printPayslips(newestFirst(slips, s => s.payDate, s => s.period), me.value, companyLogo(useCompany().company.value))
    if (!ok) { bulkErr.value = 'Allow pop-ups for this site to download the PDF.'; return }
    flash(`${slips.length} payslip${slips.length === 1 ? '' : 's'} ready — choose "Save as PDF"`)
    picked.value = []
    bulk.value = false
  } catch (e) {
    bulkErr.value = apiError(e, 'Unable to prepare the payslips.')
  } finally {
    downloading.value = false
  }
}
const { page, size, total, pages, pageRows } = usePagination(rows, 6)
</script>

<style scoped>
.dd { flex: 0 0 auto; }
.dd-month { min-width: 11rem; }
.count { display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 .4rem; margin-left: .35rem; border-radius: 99px; background: #e7eef2; color: var(--ardent-navy); font-size: .68rem; letter-spacing: 0; }
@media (max-width: 640px) { .dd { flex: 1 1 calc(50% - .4rem); } .dd-month { min-width: 0; } }
.row { display: flex; align-items: center; gap: 1rem; padding: .85rem 0; border-bottom: 1px solid var(--border); color: inherit; }
.row:last-child { border-bottom: 0; }
.row div { display: flex; flex-direction: column; flex: 1; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; grid-template-columns: minmax(0, 1fr); overflow-y: auto; overscroll-behavior: contain; place-items: center; z-index: 50; padding: 1rem; }
.modal { position: relative; width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; }
.modal h2 { padding-right: 2.25rem; font-size: 1.2rem; margin-bottom: 1rem; }
.pick { display: flex; gap: .6rem; align-items: center; padding: .55rem 0; font-size: .9rem; border-bottom: 1px solid var(--border); }
.pick input { accent-color: var(--ardent-red); }
.pick.all { cursor: pointer; }
.pick-list { max-height: min(300px, 40vh); overflow-y: auto; overscroll-behavior: contain; }
.pick-list .pick:last-child { border-bottom: 0; }
.pick.all.off { opacity: .5; cursor: default; }
.pick .sel { margin-left: auto; }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
/* Year + Month side by side, Cutoff on its own row, so every label fits in full. */
.bfilters { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-bottom: .5rem; }
.bfilters > :last-child { grid-column: 1 / -1; }
.bf-head { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; min-height: 26px; }
.bf-clear { display: inline-flex; align-items: center; gap: .3rem; border: 1px solid var(--brand-line, #f3c4cc); background: var(--brand-soft, #fff5f6); color: var(--ardent-red); font: 600 .74rem 'Montserrat', sans-serif; padding: .2rem .65rem; border-radius: 999px; cursor: pointer; transition: background .15s; }
.bf-clear span { font-size: 1rem; line-height: 1; }
.bf-clear:hover { background: var(--brand-soft-2, #fde8eb); }
.bf-label { font-size: .72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }

</style>
