<template>
  <div>
    <div class="page-head"><div><h1>Requests</h1><p>File a request and track where your requests stand.</p></div></div>

    <div class="cards">
      <NuxtLink v-for="i in fileable" :key="i.to" :to="i.to" class="tile">
        <div class="top">
          <span class="icon-tile"><AppIcon :name="i.icon" /></span>
          <span v-if="i.count" class="pill">{{ i.count }} pending</span>
        </div>
        <b>{{ i.title }}</b>
        <small>{{ i.desc }}</small>
        <span class="go">View &amp; file <AppIcon name="chevron" :size="13" /></span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// Replace with: one GET /auth/requests/:type per type for the pending counts.
const { requests } = useMockData()
const keys = Object.keys(requestTypes)
const fileable = computed(() => keys.map(k => ({
  to: `/requests/${k}`, title: requestTypes[k].title, desc: requestTypes[k].desc, icon: requestTypes[k].icon,
  count: requests.value[k].filter(r => r.status === 'For Approval').length
})))
</script>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: .9rem; --cols: 3; }
@media (max-width: 860px) { .cards { --cols: 2; } }
@media (max-width: 480px) { .cards { --cols: 1; } }
.tile {
  position: relative; display: flex; flex-direction: column; gap: .3rem;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.1rem 1.15rem 1rem; color: inherit; overflow: hidden;
  transition: transform .15s, box-shadow .15s, border-color .15s;
}
.tile::before { content: ''; position: absolute; inset: 0 0 auto; height: 3px; background: linear-gradient(90deg, var(--ardent-red), var(--ardent-coral)); opacity: 0; transition: opacity .15s; }
.tile:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(19,51,65,.1); border-color: transparent; }
.tile:hover::before { opacity: 1; }
.top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .55rem; }
.tile b { font-size: .98rem; }
.tile small { color: var(--muted); font-size: .8rem; line-height: 1.45; flex: 1; }
.pill { font-size: .7rem; font-weight: 700; color: #a3590b; background: #fff1e0; padding: .25rem .6rem; border-radius: 999px; white-space: nowrap; }
.go { display: inline-flex; align-items: center; gap: .3rem; margin-top: .45rem; font-size: .78rem; font-weight: 700; color: var(--ardent-red); }
</style>
