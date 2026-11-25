<template>
  <div>
    <div class="page-head"><div><h1>Requests</h1><p>File, track and review your HR requests.</p></div></div>

    <section v-for="g in groups" :key="g.title" class="group">
      <h3 class="section-title">{{ g.title }}</h3>
      <div class="cards">
        <NuxtLink v-for="i in g.items" :key="i.to" :to="i.to" class="tile">
          <div class="top">
            <span class="icon-tile"><AppIcon :name="i.icon" /></span>
            <span v-if="i.count" class="pill">{{ i.count }} pending</span>
          </div>
          <b>{{ i.title }}</b>
          <small>{{ i.desc }}</small>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
const { requests } = useMockData()
const pending = (k) => requests.value[k].filter(r => r.status === 'For Approval').length
const fileable = Object.keys(requestTypes)
const groups = computed(() => [
  {
    title: 'File a request',
    items: fileable.map(k => ({ to: `/requests/${k}`, title: requestTypes[k].title, desc: requestTypes[k].desc, icon: requestTypes[k].icon, count: pending(k) }))
  },
  {
    title: 'Records',
    items: [
      { to: '/leave-hours', title: 'Leave Hours', desc: 'VL/SL balances and approved leave.', icon: 'hourglass', count: 0 },
      { to: '/timesheet', title: 'Timesheet', desc: 'Daily time in/out per cut-off.', icon: 'table', count: 0 },
      { to: '/payroll', title: 'Payslip', desc: 'View and download payslips.', icon: 'wallet', count: 0 }
    ]
  }
  // Approved Records / Approved Requests are approver-only: they are tabs on Approvals.
])
</script>

<style scoped>
.group .section-title { margin-top: 0; }
.group + .group { margin-top: 1.75rem; }
.cards { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: .9rem; --cols: 5; }
/* Same column grid for every section, so every card is the width of a 'File a request' card. */
@media (max-width: 1200px) { .cards { --cols: 3; } }
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
.tile:hover </style>
