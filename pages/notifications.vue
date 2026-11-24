<template>
  <div>
    <div class="page-head">
      <div><h1>Notifications</h1><p>{{ unread }} unread</p></div>
      <button class="btn btn-ghost" @click="items.forEach(n => (n.unread = false))">Mark all read</button>
    </div>
    <div class="tab-row">
    <div class="tabs">
      <button :class="{ on: tab === 'All' }" @click="tab = 'All'">All</button>
      <button :class="{ on: tab === 'Unread' }" @click="tab = 'Unread'">Unread</button>
    </div>
    <FilterMenu v-model="extra" :fields="filterFields" />
    </div>
    <div class="card" style="padding:.25rem 1.25rem">
      <div v-for="n in pageRows" :key="n.id" class="n" :class="{ unread: n.unread }" @click="n.unread = false">
        <span class="icon-tile"><AppIcon name="bell" /></span>
        <div><b>{{ n.title }}</b><small>{{ n.body }}</small></div>
        <small class="m when">{{ n.when }}</small>
      </div>
      <p v-if="!rows.length" class="empty">You're all caught up</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
const { notifications } = useMockData()
const items = notifications.value
const tab = ref('All')
// Filters menu: notification type (server: kind / request_type on each item).
const extra = ref({ kind: '' })
const filterFields = [{ key: 'kind', label: 'Type', options: uniq(items, n => n.kind) }]
const rows = computed(() => items.filter(n =>
  (tab.value === 'All' || n.unread) && (!extra.value.kind || n.kind === extra.value.kind)))
const unread = computed(() => items.filter(n => n.unread).length)
const { page, size, total, pages, pageRows } = usePagination(rows, 6)
</script>

<style scoped>
.tab-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }

.n { display: flex; gap: 1rem; align-items: flex-start; padding: 1rem 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.n:last-child { border-bottom: 0; }
.n div { flex: 1; display: flex; flex-direction: column; font-size: .88rem; }
.n.unread b::after { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--ardent-alert); margin-left: .5rem; vertical-align: middle; }
.n:not(.unread) .icon-tile { background: #f0f0f2; color: var(--muted); }
.when { white-space: nowrap; font-size: .75rem; }
</style>
