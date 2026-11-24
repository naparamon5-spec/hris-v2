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
        <div class="legend"><span><i class="leave" /> Leave</span><span><i class="call" /> Call Approval</span></div>
      </div>
      <div class="card day-card">
        <h3 class="day-title">{{ dayName }}</h3>
        <div v-if="people.length">
          <div v-for="p in pageRows" :key="p.name + p.type" class="person">
            <span class="av">{{ p.name.split(' ').map(s => s[0]).join('') }}</span>
            <div><b>{{ p.name }}</b><small class="m">{{ p.type }}</small></div>
            <span class="badge" :class="p.kind === 'leave' ? 'badge-red' : 'badge-ok'">{{ p.kind === 'leave' ? 'Leave' : 'Call Approval' }}</span>
          </div>
        </div>
        <p v-else class="empty">🎉 Full attendance</p>
        <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
      </div>
    </div>
  </div>
</template>

<script setup>
// Mock data only exists for November 2026; other months show full attendance.
const { whosOut } = useMockData()
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const now = new Date()
const year = ref(2026)
const month = ref(10)
const sel = ref(now.getFullYear() === 2026 && now.getMonth() === 10 ? now.getDate() : 1)
const offset = computed(() => new Date(year.value, month.value, 1).getDay())
const days = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const monthLabel = computed(() => new Date(year.value, month.value, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
const dayPeople = (d) => (year.value === 2026 && month.value === 10 ? whosOut[d] : undefined) || []
const people = computed(() => dayPeople(sel.value))
const { page, size, total, pages, pageRows } = usePagination(people, 5)
watch(sel, () => { page.value = 1 })
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
.layout { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1rem; align-items: start; }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
.nav { display: flex; align-items: center; gap: .5rem; }
.nav b { min-width: 9.5rem; text-align: center; }
.nb { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: #fff; color: var(--text); display: grid; place-items: center; cursor: pointer; transition: all .15s; }
.nb:hover { border-color: var(--ardent-red); color: var(--ardent-red); }
.flip { transform: rotate(180deg); }
.cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: .3rem; }
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
.legend { display: flex; gap: 1.25rem; margin-top: 1rem; font-size: .8rem; color: var(--muted); }
.legend span { display: flex; align-items: center; gap: .4rem; }
.day-card { display: flex; flex-direction: column; align-self: stretch; }
.day-title { font-size: 1rem; margin-bottom: .75rem; }
.person { display: flex; align-items: center; gap: .8rem; padding: .75rem 0; border-bottom: 1px solid var(--border); }
.person:last-child { border-bottom: 0; }
.person div { flex: 1; display: flex; flex-direction: column; }
.av { width: 38px; height: 38px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: .78rem; }
</style>
