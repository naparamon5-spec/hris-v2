<template>
  <div>
    <div class="page-head"><div><h1>Directory</h1><p>{{ filtered.length }} team members</p></div></div>
    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search people or roles" placeholder="Search people or roles">
      <FilterMenu v-model="extra" :fields="filterFields" />
    </div>
    <div class="grid people">
      <div v-for="e in pageRows" :key="e.name" class="card person">
        <span class="av">{{ e.name.split(' ').map(s => s[0]).join('') }}</span>
        <b>{{ e.name }}</b>
        <small class="m">{{ e.role }} · {{ e.department }}</small>
        <div class="contact"><span>✉ {{ e.email }}</span><span>☎ Local {{ e.local }}</span></div>
      </div>
    </div>
    <p v-if="!filtered.length" class="empty">No matches</p>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
const { directory } = useMockData()
const route = useRoute()
const q = ref(String(route.query.q || ''))
// Header search links here with ?q=<name>.
watch(() => route.query.q, v => { if (v) q.value = String(v) })
// Filters menu: department and position (server: GET /auth/directory?department=).
const extra = ref({ department: '', role: '' })
const filterFields = [
  { key: 'department', label: 'Department', options: uniq(directory, e => e.department) },
  { key: 'role', label: 'Position', options: uniq(directory, e => e.role) }
]
const filtered = computed(() => directory.filter(e =>
  (!extra.value.department || e.department === extra.value.department) &&
  (!extra.value.role || e.role === extra.value.role) &&
  `${e.name} ${e.role} ${e.department}`.toLowerCase().includes(q.value.toLowerCase())))
const { page, size, total, pages, pageRows } = usePagination(filtered, 8)
</script>

<style scoped>
.people { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.person { display: flex; flex-direction: column; align-items: center; text-align: center; gap: .25rem; }
.av { width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, var(--ardent-red), var(--ardent-coral)); color: #fff; display: grid; place-items: center; font-weight: 800; margin-bottom: .5rem; }
.person small { font-size: .8rem; }
.contact { display: flex; flex-direction: column; gap: .15rem; margin-top: .6rem; font-size: .75rem; color: var(--muted); word-break: break-all; }
</style>
