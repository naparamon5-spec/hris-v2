<template>
  <div>
    <div class="page-head"><div><h1>Directory</h1><p>{{ filtered.length }} team members</p></div></div>
    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search people or roles" placeholder="Search people or roles">
      <FilterMenu v-model="extra" :fields="filterFields" />
    </div>
    <div ref="gridEl" class="grid people">
      <div v-for="e in pageRows" :key="e.id || e.name" class="card person">
        <span class="av">{{ initialsOf(e.name) }}</span>
        <b>{{ e.name }}</b>
        <small class="m">{{ [e.role, e.department].filter(Boolean).join(' · ') }}</small>
        <!-- Email and local number are not returned by /auth/directory yet (BACKEND.md §0 #12, G13). -->
        <div v-if="e.email || e.local" class="contact"><span v-if="e.email">✉ {{ e.email }}</span><span v-if="e.local">☎ Local {{ e.local }}</span></div>
      </div>
    </div>
    <p v-if="pending" class="empty">Loading…</p>
    <p v-else-if="error" class="empty">{{ apiError(error, 'Unable to load the directory.') }} <a href="#" @click.prevent="refresh()">Try again</a></p>
    <p v-else-if="!filtered.length" class="empty">No matches</p>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
import { apiError } from '~/composables/useApi'
// GET /auth/directory (BACKEND.md §12) — loaded once, searched and filtered here.
const api = useApi()
const { data: directory, pending, error, refresh } = await useAsyncData('directory',
  () => api('/auth/directory').then(r => r.data || []), { default: () => [], server: false })
const initialsOf = (n) => String(n || '').replace(',', ' ').split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join('').toUpperCase()
const route = useRoute()
const q = ref(String(route.query.q || ''))
// Header search links here with ?q=<name>.
watch(() => route.query.q, v => { if (v) q.value = String(v) })
// Filters menu: department and position (server: GET /auth/directory?department=).
const extra = ref({ department: '', role: '' })
const filterFields = computed(() => [
  { key: 'department', label: 'Department', options: uniq(directory.value, e => e.department) },
  { key: 'role', label: 'Position', options: uniq(directory.value, e => e.role) }
])
const filtered = computed(() => directory.value.filter(e =>
  (!extra.value.department || e.department === extra.value.department) &&
  (!extra.value.role || e.role === extra.value.role) &&
  `${e.name} ${e.role} ${e.department}`.toLowerCase().includes(q.value.toLowerCase())))
const { page, size, total, pages, pageRows } = usePagination(filtered, 12)

// Fill the screen: one page = as many columns as fit × as many rows as fit
// above the pager, so the grid never ends in a lone card with empty space.
const gridEl = ref(null)
const fit = () => {
  const el = gridEl.value
  if (!el) return
  const style = getComputedStyle(el)
  const cols = Math.max(1, style.gridTemplateColumns.split(' ').filter(Boolean).length)
  const gap = parseFloat(style.rowGap) || 16
  const cards = [...el.children]
  const cardH = Math.max(180, ...cards.map(c => c.offsetHeight))
  const pager = 72 // pager row + page padding below the grid
  const room = window.innerHeight - (el.getBoundingClientRect().top + window.scrollY) - pager
  const rows = Math.max(window.innerWidth <= 640 ? 3 : 1, Math.floor((room + gap) / (cardH + gap)))
  const next = cols * rows
  if (next === size.value) return
  const first = (page.value - 1) * size.value // keep the same people in view
  size.value = next
  page.value = Math.floor(first / next) + 1
}
let ro
onMounted(() => {
  ro = new ResizeObserver(() => fit())
  ro.observe(document.documentElement)
  if (gridEl.value) ro.observe(gridEl.value)
  nextTick(fit)
})
onBeforeUnmount(() => ro?.disconnect())
watch(pageRows, () => nextTick(fit))
</script>

<style scoped>
.people { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.person { display: flex; flex-direction: column; align-items: center; text-align: center; gap: .25rem; }
.av { width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, var(--ardent-red), var(--ardent-coral)); color: #fff; display: grid; place-items: center; font-weight: 800; margin-bottom: .5rem; }
.person small { font-size: .8rem; }
.contact { display: flex; flex-direction: column; gap: .15rem; margin-top: .6rem; font-size: .75rem; color: var(--muted); word-break: break-all; }
</style>
