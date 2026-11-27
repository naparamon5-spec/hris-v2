<template>
  <div>
    <div class="page-head">
      <div><h1>Notifications</h1><p>{{ unread }} unread</p></div>
      <button class="btn btn-ghost" :disabled="!unread" @click="markAllRead">Mark all read</button>
    </div>
    <div class="tab-row">
    <div class="tabs">
      <button :class="{ on: tab === 'All' }" @click="tab = 'All'">All</button>
      <button :class="{ on: tab === 'Unread' }" @click="tab = 'Unread'">Unread</button>
    </div>
    </div>
    <div ref="listCard" class="card" style="padding:.25rem 1.25rem">
      <div v-for="n in pageRows" :key="n.id" class="n" :class="{ unread: n.unread }" @click="open(n)">
        <span class="icon-tile"><AppIcon name="bell" /></span>
        <div><b>{{ n.title }}</b><small>{{ n.body }}</small></div>
        <small class="m when">{{ n.when }}</small>
      </div>
      <p v-if="!loaded" class="empty">Loading…</p>
      <p v-else-if="error && !items.length" class="empty">{{ error }} <a href="#" @click.prevent="refresh">Try again</a></p>
      <p v-else-if="!rows.length" class="empty">You're all caught up</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
// GET /auth/notifications, POST /:id/read and /read-all (BACKEND.md §13).
const { items, unread, loaded, error, refresh, markRead, markAllRead } = useNotifications()
onMounted(refresh)
const tab = ref('All')
// created_at isn't sent yet (G21): without it newest first falls back to id order.
const rows = computed(() => newestFirst(items.value.filter(n =>
  tab.value === 'All' || n.unread), n => n.at, n => n.id))
// Click: mark read, then open the exact request it is about —
// approvals: that item in the inbox; decisions: that request's details on its list.
const open = async (n) => {
  await markRead(n)
  const id = n.requestId
  if (n.kind === 'pending_approval' || n.kind === 'pending_witness' || n.kind === 'for_approval') {
    return navigateTo(n.requestType && id ? { path: '/approvals', query: { item: `${n.requestType}:${id}` } } : '/approvals')
  }
  // Digest notifications: requestId is the period key "YYYY-PP".
  if (n.kind === 'payslip') return navigateTo(id ? `/payroll/${id}` : '/payroll')
  if (n.kind === 'timesheet') return navigateTo(id ? { path: '/timesheet', query: { period: id } } : '/timesheet')
  if (n.kind === 'payday') return navigateTo('/payroll')
  if (n.kind === 'whos_out') return navigateTo('/whos-out')
  const route = siteRouteFor(n.requestType)
  if (route) navigateTo(id ? { path: `/requests/${route}`, query: { view: id } } : `/requests/${route}`)
}
const { page, size, total, pages, pageRows } = usePagination(rows, 7)

// Up to 7 per page, fewer on a short window, so the list and pager fit without page scroll.
const MAX_ROWS = 7
const listCard = ref(null)
const fitRows = () => {
  const el = listCard.value
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const row = Math.max(56, ...[...el.querySelectorAll('.n')].map(r => r.offsetHeight))
  const below = 56 /* pager */ + 32 /* page bottom padding */ + 8 /* card padding */
  size.value = Math.max(3, Math.min(MAX_ROWS, Math.floor((window.innerHeight - top - below) / row)))
}
const refit = () => nextTick(fitRows)
onMounted(() => { refit(); window.addEventListener('resize', refit) })
onBeforeUnmount(() => window.removeEventListener('resize', refit))
watch([rows, page, tab], refit)
</script>

<style scoped>
.tab-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }

.n { display: flex; gap: 1rem; align-items: flex-start; padding: .75rem 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.n:last-child { border-bottom: 0; }
.n div { flex: 1; display: flex; flex-direction: column; font-size: .88rem; }
.n.unread b::after { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--ardent-alert); margin-left: .5rem; vertical-align: middle; }
.n:not(.unread) .icon-tile { background: #f0f0f2; color: var(--muted); }
.when { white-space: nowrap; font-size: .75rem; }
</style>
