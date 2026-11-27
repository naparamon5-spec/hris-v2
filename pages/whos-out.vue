<template>
  <div>
    <div class="page-head"><div><h1>Who's Out</h1><p>Team leaves and call approvals this month.</p></div></div>
    <div class="layout">
      <div class="card">
        <div class="cal-head">
          <div class="nav">
            <button class="nb" aria-label="Previous month" @click="shift(-1)"><AppIcon name="chevron" :size="16" class="flip" /></button>
            <b>{{ monthLabel }}</b>
            <button class="nb" aria-label="Next month" @click="shift(1)"><AppIcon name="chevron" :size="16" /></button>
          </div>
          <button class="btn btn-ghost btn-sm" @click="goToday">Today</button>
        </div>
        <div class="cal">
          <span v-for="w in weekdays" :key="w" class="wd">{{ w }}</span>
          <span v-for="n in offset" :key="'e' + n" />
          <button v-for="d in days" :key="d" class="day" :class="{ sel: sel === d, today: isToday(d) }" @click="sel = d">
            {{ d }}
            <span class="dots"><i v-for="(p, i) in dayPeople(d).slice(0, 3)" :key="i" :class="p.kind" /></span>
          </button>
        </div>
        <div class="legend"><span><i class="leave" /> Leave of Absence (LOA)</span><span><i class="call" /> Call Approval (CA)</span></div>
      </div>
      <div class="card day-card">
        <div class="day-head">
          <h3 class="day-title">{{ q.trim() ? `Search in ${monthLabel}` : dayName }}</h3>
          <div class="counts">
            <span class="cnt loa"><b>{{ dayCount.leave }}</b> LOA</span>
            <span class="cnt ca"><b>{{ dayCount.call }}</b> CA</span>
          </div>
        </div>
        <!-- Search: names or leave types across the whole month shown on the calendar. -->
        <input v-model="q" class="input day-search" type="search" aria-label="Search who's out this month" :placeholder="`Search name, LOA or CA in ${monthLabel}`">
        <p v-if="loading" class="empty">Loading…</p>
        <p v-else-if="loadError" class="empty">{{ loadError }}</p>
        <div v-else-if="people.length">
          <div v-for="(p, i) in pageRows" :key="p.day + p.name + p.type + i" class="person" :class="{ jump: q.trim() }" @click="q.trim() && pickDay(p.day)">
            <span class="av">{{ initialsOf(p.name) }}</span>
            <div><b>{{ p.name }}</b><small v-if="q.trim()" class="m">{{ shortDay(p.day) }}</small></div>
            <span class="badge" :class="p.kind === 'leave' ? 'badge-red' : 'badge-ok'">{{ p.kind === 'leave' ? 'LOA' : 'CA' }}</span>
          </div>
        </div>
        <p v-else-if="q.trim()" class="empty">No one matches "{{ q.trim() }}" in {{ monthLabel }}</p>
        <p v-else class="empty">🎉 Full attendance</p>
        <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
      </div>
    </div>
  </div>
</template>

<script setup>
// GET /hris/whosout?month=&year= (BACKEND.md §11), refetched on every month change.
const api = useApi()
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const sel = ref(now.getDate())
const initialsOf = (n) => String(n || '').replace(',', ' ').split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join('').toUpperCase()

// Each person's date range, expanded into the days of the shown month.
const byDay = ref({})
const loading = ref(false)
const loadError = ref('')
const toWhosOut = (r, y, m) => {
  const out = {}
  for (const p of r.data || []) {
    const from = new Date(p.date_from)
    const to = new Date(p.date_to || p.date_from)
    for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m) continue
      ;(out[d.getUTCDate()] ||= []).push({ name: p.name, type: p.type === 'ca' ? 'CA' : 'LOA', kind: p.type === 'ca' ? 'call' : 'leave' })
    }
  }
  return out
}
watch([year, month], async ([y, m]) => {
  loading.value = true
  loadError.value = ''
  try {
    byDay.value = toWhosOut(await api(`/hris/whosout?month=${m + 1}&year=${y}`), y, m + 1)
  } catch (e) {
    byDay.value = {}
    loadError.value = apiError(e, "Unable to load Who's Out.")
  } finally {
    loading.value = false
  }
}, { immediate: true })
const offset = computed(() => new Date(year.value, month.value, 1).getDay())
const days = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const monthLabel = computed(() => new Date(year.value, month.value, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
const dayPeople = (d) => byDay.value[d] || []
const q = ref('')
// No search: the selected day. With a search: every match in the month, by date.
const people = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return dayPeople(sel.value).map(p => ({ ...p, day: sel.value }))
  return Object.keys(byDay.value).map(Number).sort((a, b) => a - b).flatMap(d =>
    byDay.value[d].filter(p => `${p.name} ${p.type}`.toLowerCase().includes(needle)).map(p => ({ ...p, day: d })))
})
const shortDay = (d) => new Date(year.value, month.value, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
// Clicking a search result selects that day on the calendar.
const pickDay = (d) => { sel.value = d; q.value = '' }
// LOA / CA counts for the selected day.
const tally = (list) => ({ leave: list.filter(p => p.kind === 'leave').length, call: list.filter(p => p.kind === 'call').length })
const dayCount = computed(() => tally(people.value))

const { page, size, total, pages, pageRows } = usePagination(people, 6)
watch([sel, q], () => { page.value = 1 })
const dayName = computed(() => new Date(year.value, month.value, sel.value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
const isToday = (d) => year.value === now.getFullYear() && month.value === now.getMonth() && d === now.getDate()
const shift = (n) => {
  const dt = new Date(year.value, month.value + n, 1)
  year.value = dt.getFullYear(); month.value = dt.getMonth()
  sel.value = Math.min(sel.value, days.value)
}
const goToday = () => { year.value = now.getFullYear(); month.value = now.getMonth(); sel.value = now.getDate() }
</script>

<style scoped>
/* Calendar on the left, day card on the right — both cards the same height. */
.layout { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1rem; align-items: stretch; }
.layout > .card { display: flex; flex-direction: column; min-height: 0; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
.nav { display: flex; align-items: center; gap: .5rem; }
.nav b { min-width: 9.5rem; text-align: center; }
.nb { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: #fff; color: var(--text); display: grid; place-items: center; cursor: pointer; transition: all .15s; }
.nb:hover { border-color: var(--ardent-red); color: var(--ardent-red); }
.flip { transform: rotate(180deg); }
.cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: .3rem; }
@media (max-width: 420px) {
  .cal-head { gap: .5rem; }
  .nav b { min-width: 0; font-size: .9rem; }
  .cal { gap: .2rem; }
  .wd { font-size: .62rem; }
  .day { font-size: .8rem; border-radius: 8px; }
}
.wd { text-align: center; font-size: .72rem; font-weight: 700; color: var(--muted); padding-bottom: .3rem; }
/* Height follows the screen (not the width) so a 6-week month still fits without page scroll. */
.day { height: clamp(40px, calc((100vh - 400px) / 6), 96px); border: 1px solid transparent; background: #fafafa; border-radius: 10px; font: 600 .88rem Montserrat, sans-serif; color: var(--text); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.day:hover { border-color: var(--ardent-gray); }
.day.today { color: var(--ardent-red); }
.day.sel { background: var(--ardent-red); color: #fff; }
.dots { display: flex; gap: 3px; height: 6px; }
.dots i, .legend i { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.leave { background: var(--ardent-coral); }
.call { background: #2e9d6a; }
.day.sel .dots i { background: #fff; }
.legend { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem 1rem; margin-top: auto; padding-top: 1rem; font-size: .8rem; color: var(--muted); }
.legend span { display: flex; align-items: center; gap: .4rem; }
.day-head { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; margin-bottom: .75rem; }
.day-head .day-title { margin-bottom: 0; }
.counts { display: flex; gap: .4rem; flex: none; }
.cnt { font-size: .72rem; font-weight: 700; padding: .25rem .6rem; border-radius: 999px; white-space: nowrap; }
.cnt b { font-size: .85rem; }
.cnt.loa { color: var(--ardent-red); background: var(--brand-soft); }
.cnt.ca { color: #1f7a52; background: #e3f5ec; }
.day-card { display: flex; flex-direction: column; align-self: stretch; }
.day-title { font-size: 1rem; margin-bottom: .75rem; }
.person { display: flex; align-items: center; gap: .8rem; padding: .75rem 0; border-bottom: 1px solid var(--border); }
.person:last-child { border-bottom: 0; }
.person div { flex: 1; display: flex; flex-direction: column; }
.av { width: 38px; height: 38px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; }
.day-search { width: 100%; margin-bottom: .5rem; }
.person.jump { cursor: pointer; border-radius: 10px; }
.person.jump:hover { background: #fafafa; }
</style>
