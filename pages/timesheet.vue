<template>
  <div>
    <NuxtLink to="/requests" class="back">‹ Back</NuxtLink>
    <div class="page-head">
      <div><h1>Timesheet</h1><p>Select a cut-off period to view your daily time records.</p></div>
      <AppSelect v-model="year" :options="years" aria-label="Year" class="year" />
    </div>

    <!-- One row of periods (newest on the left). Slide it with the arrows, the mouse
         wheel, by dragging, or by swiping on touch screens. -->
    <div class="strip">
      <button type="button" class="nav" aria-label="Slide left (newer periods)" :disabled="atStart" @click="slide(-1)">
        <AppIcon name="chevron" :size="16" class="flip" />
      </button>
      <div
        ref="track" class="track" :class="{ dragging }"
        @scroll.passive="updateEdges" @wheel="onWheel"
        @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @pointerleave="onUp"
        @click.capture="blockClickAfterDrag"
      >
        <button
          v-for="p in periods" :key="p.code" type="button" class="card period" :class="{ on: sel === p.code }"
          :aria-pressed="sel === p.code" @click="sel = p.code" @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)"
        >
          <b>Period {{ Number(p.code) }}<span v-if="p === periods[0] && isCurrentYear" class="now">Current</span></b>
          <small class="m">{{ p.range }}</small>
        </button>
      </div>
      <button type="button" class="nav" aria-label="Slide right (older periods)" :disabled="atEnd" @click="slide(1)">
        <AppIcon name="chevron" :size="16" />
      </button>
    </div>

    <div class="card sheet">
      <div class="th">
        <div><b>Timesheet {{ year }}-{{ sel }}</b><small class="m">{{ current?.range }}</small></div>
        <div class="sum">
          <span><small>Basic</small><b>{{ fmt(sheet.totals.basic) }}</b></span>
          <span><small>OT</small><b>{{ fmt(sheet.totals.ot) }}</b></span>
          <span><small>Leave</small><b>{{ fmt(sheet.totals.leave) }}</b></span>
          <span class="tot"><small>Total</small><b>{{ fmt(sheet.totals.total) }} hrs</b></span>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table stack">
          <thead>
            <tr><th>Date</th><th>Day type</th><th>Time in</th><th>Time out</th><th>Basic</th><th>OT</th><th>Leave</th><th>Total</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in pageRows" :key="d.date" :class="{ off: !d.time_in }">
              <td data-label="Date"><b>{{ dayLabel(d.date) }}</b> <small class="m">{{ dowLabel(d.date) }}</small></td>
              <td data-label="Day type"><span class="badge" :class="typeBadge(d)">{{ d.day_type }}</span></td>
              <td data-label="Time in">{{ d.time_in || '—' }}</td>
              <td data-label="Time out">{{ d.time_out || '—' }}</td>
              <td data-label="Basic">{{ fmt(d.basic_hrs) }}</td>
              <td data-label="OT">{{ fmt(d.ot_hrs) }}</td>
              <td data-label="Leave">{{ fmt(d.leave_hrs) }}</td>
              <td data-label="Total"><b>{{ fmt(d.total_hrs) }}</b></td>
              <td data-label="Remarks"><span v-if="d.remarks" class="badge" :class="d.remarks === 'Late' ? 'badge-warn' : 'badge-gray'">{{ d.remarks }}</span><span v-else class="m">—</span></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!sheet.data.length" class="empty">No time records for this period yet</p>
      </div>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
const { timesheetPeriods, timesheetFor } = useMockData()

const thisYear = new Date().getFullYear()
const years = [thisYear, thisYear - 1]
const year = ref(thisYear)
const isCurrentYear = computed(() => year.value === thisYear)

// Replace with: api('/auth/pay-periods?type=timesheet') filtered by year
const periods = computed(() => timesheetPeriods(year.value))
const sel = ref(periods.value[0]?.code)
watch(periods, (p) => { sel.value = p[0]?.code })
const idx = computed(() => periods.value.findIndex(p => p.code === sel.value))
const current = computed(() => periods.value[idx.value])

// Replace with: api(`/auth/timesheets/${year}-${code}`)
const sheet = computed(() => timesheetFor(year.value, sel.value))
const rows = computed(() => sheet.value.data)
const { page, size, total, pages, pageRows } = usePagination(rows, 7)
watch(sel, () => { page.value = 1 })

// ---- Period strip sliding ----
const track = ref(null)
const atStart = ref(true)
const atEnd = ref(true)
const updateEdges = () => {
  const t = track.value
  if (!t) return
  atStart.value = t.scrollLeft <= 2
  atEnd.value = t.scrollLeft + t.clientWidth >= t.scrollWidth - 2
}
// Arrows slide the strip one screenful in the direction they point (selection stays).
const slide = (dir) => {
  const t = track.value
  if (t) t.scrollBy({ left: dir * t.clientWidth * 0.85, behavior: 'smooth' })
}
// Mouse wheel: scrolling up/down slides the strip sideways.
const onWheel = (e) => {
  const t = track.value
  if (!t || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return // trackpad sideways swipe: native
  const can = e.deltaY > 0 ? !atEnd.value : !atStart.value
  if (!can) return // at the edge: let the page behave normally
  e.preventDefault()
  t.scrollLeft += e.deltaY
}
// Drag with the mouse to slide (touch screens swipe natively).
let startX = 0, startLeft = 0, moved = 0, down = false
const dragging = ref(false)
const onDown = (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return
  down = true; moved = 0; startX = e.clientX; startLeft = track.value.scrollLeft
}
const onMove = (e) => {
  if (!down) return
  const dx = e.clientX - startX
  moved = Math.max(moved, Math.abs(dx))
  if (moved > 5) { dragging.value = true; track.value.scrollLeft = startLeft - dx }
}
const onUp = () => { down = false; setTimeout(() => { dragging.value = false }, 0) }
// A drag must not also select the card it ended on.
const blockClickAfterDrag = (e) => { if (moved > 5) { e.stopPropagation(); e.preventDefault(); moved = 0 } }
// Keyboard: ← / → on a focused card selects the card on that side.
const move = async (dir) => {
  const next = periods.value[idx.value + dir]
  if (!next) return
  sel.value = next.code
  await nextTick()
  track.value?.querySelector('.period.on')?.focus()
}
// Keep the selected card visible and the arrow states right.
watch(sel, async () => {
  await nextTick()
  track.value?.querySelector('.period.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
})
watch(periods, async () => { await nextTick(); track.value && (track.value.scrollLeft = 0); updateEdges() })
onMounted(() => { updateEdges(); window.addEventListener('resize', updateEdges) })
onBeforeUnmount(() => window.removeEventListener('resize', updateEdges))

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const dayLabel = (s) => { const d = parse(s); return `${MON[d.getMonth()]} ${d.getDate()}` }
const dowLabel = (s) => DOW[parse(s).getDay()]
const fmt = (n) => (n ? (Number.isInteger(n) ? String(n) : n.toFixed(1)) : '—')
const typeBadge = (d) =>
  d.leave_type ? 'badge-navy' : /Holiday/.test(d.day_type) ? 'badge-red' : d.day_type === 'Regular' ? 'badge-ok' : 'badge-gray'
</script>

<style scoped>
.year { width: auto; }
.strip { display: flex; align-items: center; gap: .5rem; }
.track { flex: 1; display: flex; gap: .6rem; overflow-x: auto; scroll-snap-type: x proximity; padding: 4px 2px; scrollbar-width: none; }
.track::-webkit-scrollbar { display: none; }
.track { cursor: grab; user-select: none; }
.track.dragging { cursor: grabbing; scroll-snap-type: none; }
.track.dragging .period { pointer-events: none; }
.period { flex: 0 0 150px; scroll-snap-align: start; display: flex; flex-direction: column; gap: .1rem; text-align: left; cursor: pointer; padding: .7rem .95rem; font-family: inherit; color: inherit; }
.period b { display: flex; align-items: center; gap: .4rem; font-size: .88rem; }
.period small { font-size: .76rem; }
.period.on { border-color: var(--ardent-red); box-shadow: 0 0 0 2px rgba(198,50,76,.2); }
.now { font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--ardent-red); background: #fde8ea; padding: .1rem .4rem; border-radius: 999px; }
.nav { flex: none; width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border); background: #fff; display: grid; place-items: center; cursor: pointer; color: var(--text); }
.nav:hover:not(:disabled) { border-color: var(--ardent-red); color: var(--ardent-red); }
.nav:disabled { opacity: .4; cursor: default; }
.flip { transform: rotate(180deg); }
.sheet { padding: .5rem; margin-top: 1rem; }
.th { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; padding: .7rem .8rem .8rem; }
.th > div:first-child { display: flex; flex-direction: column; }
.th b { font-size: .92rem; }
.sum { display: flex; gap: .5rem; flex-wrap: wrap; }
.sum span { display: flex; flex-direction: column; align-items: flex-end; padding: .35rem .75rem; border-radius: 10px; background: var(--bg, #f6f7f9); min-width: 64px; }
.sum small { font-size: .66rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.sum b { font-size: .9rem; }
.sum .tot { background: var(--ardent-navy); color: #fff; }
.sum .tot small { color: rgba(255,255,255,.7); }
.off td { color: var(--muted); background: #fafafa; }
.empty { text-align: center; color: var(--muted); padding: 2rem 0; }
@media (max-width: 640px) {
  .period { flex-basis: 132px; }
  .sum { width: 100%; }
  .sum span { flex: 1; align-items: flex-start; }
}
</style>
