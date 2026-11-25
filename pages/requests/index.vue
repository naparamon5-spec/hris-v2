<template>
  <div>
    <div class="page-head"><div><h1>Requests</h1><p>File a request and track where your requests stand.</p></div></div>

    <!-- Totals across all request types -->
    <div class="stats">
      <div v-for="s in stats" :key="s.label" class="card stat" :class="s.tone">
        <span class="dot" />
        <div><small>{{ s.label }}</small><b>{{ s.value }}</b></div>
      </div>
    </div>

    <h3 class="section-title">File a request</h3>
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

    <div class="bottom">
      <div class="card recent">
        <div class="rh">
          <h3>Recent requests</h3>
          <small class="m">Latest filed across all types</small>
        </div>
        <div class="table-wrap">
          <table class="table stack">
            <thead><tr><th>No.</th><th>Request</th><th>Date</th><th>Filed</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead>
            <tbody>
              <tr v-for="r in recent" :key="r.no" class="clickable" @click="navigateTo(`/requests/${r.key}`)">
                <td data-label="No."><b>{{ r.no }}</b></td>
                <td data-label="Request">{{ r.title }}<br><small class="m">{{ r.type }}</small></td>
                <td data-label="Date">{{ r.date }}</td>
                <td data-label="Filed">{{ r.dateFiled }}</td>
                <td data-label="Status"><span class="badge" :class="'badge-' + badge(r.status)">{{ r.status }}</span></td>
                <td class="open"><NuxtLink :to="`/requests/${r.key}`" :aria-label="`Open ${r.title}`" @click.stop><AppIcon name="chevron" :size="16" /></NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <NuxtLink to="/leave-hours" class="card balance">
        <div class="rh">
          <h3>Leave balance</h3>
          <small class="m">Check before filing a leave</small>
        </div>
        <div class="bal">
          <div><small>Approved Leave</small><b>{{ h.approved_leave }}<em> hrs</em></b></div>
          <div><small>Approved UT (AM/PM)</small><b>{{ h.approved_ut }}<em> hrs</em></b></div>
        </div>
        <span class="go">View Leave Hours <AppIcon name="chevron" :size="13" /></span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// Replace with: one GET /auth/requests/:type per type (or /auth/requests/summary, §15)
// and GET /auth/leaves/hours for the balance card.
const { requests, leaveHours: h, badge } = useMockData()
const keys = Object.keys(requestTypes)
const all = computed(() => keys.flatMap(k => requests.value[k].map(r => ({ ...r, key: k, title: requestTypes[k].title }))))
const count = (pred) => all.value.filter(pred).length

const stats = computed(() => [
  { label: 'Pending', value: count(r => r.status === 'For Approval'), tone: 'warn' },
  { label: 'Approved', value: count(r => r.status === 'Approved'), tone: 'ok' },
  { label: 'Posted', value: count(r => r.status === 'Posted'), tone: 'blue' },
  { label: 'Disapproved / Cancelled', value: count(r => r.status === 'Disapproved' || r.status === 'Cancelled'), tone: 'red' }
])

const fileable = computed(() => keys.map(k => ({
  to: `/requests/${k}`, title: requestTypes[k].title, desc: requestTypes[k].desc, icon: requestTypes[k].icon,
  count: requests.value[k].filter(r => r.status === 'For Approval').length
})))

const time = (s) => new Date(s).getTime() || 0
const recent = computed(() => [...all.value].sort((a, b) => time(b.dateFiled) - time(a.dateFiled)).slice(0, 4))
</script>

<style scoped>
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .9rem; }
.stat { display: flex; align-items: center; gap: .85rem; padding: .9rem 1.1rem; }
.stat > div { display: flex; flex-direction: column; }
.stat small { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.stat b { font-size: 1.5rem; font-weight: 800; line-height: 1.15; color: var(--ardent-navy); }
.dot { width: 10px; height: 10px; border-radius: 50%; flex: none; background: currentColor; box-shadow: 0 0 0 5px color-mix(in srgb, currentColor 15%, transparent); }
.stat.warn .dot { color: #d98a1c; }
.stat.ok .dot { color: #18794e; }
.stat.blue .dot { color: #1d5fc7; }
.stat.red .dot { color: var(--ardent-red); }

.section-title { margin: 1.4rem 0 .8rem; }
.cards { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: .9rem; --cols: 5; }
@media (max-width: 1200px) { .cards { --cols: 3; } }
@media (max-width: 860px) { .cards { --cols: 2; } .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
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

.bottom { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: .9rem; margin-top: 1.4rem; align-items: start; }
@media (max-width: 1000px) { .bottom { grid-template-columns: 1fr; } }
.recent { padding: .5rem; }
.rh { display: flex; flex-direction: column; padding: .6rem .8rem .7rem; }
.rh h3 { font-size: 1rem; }
.rh small { font-size: .78rem; }
.recent .table td { padding-top: .6rem; padding-bottom: .6rem; }
.clickable { cursor: pointer; }
.open { text-align: right; width: 1%; }
.open a { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--muted); }
.clickable:hover .open a { color: var(--ardent-red); background: #fff4f5; }
.balance { display: flex; flex-direction: column; padding: .5rem .5rem 1rem; color: inherit; transition: box-shadow .15s, transform .15s; }
.balance:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(19,51,65,.1); }
.bal { display: grid; gap: .6rem; padding: 0 .8rem; }
.bal > div { display: flex; flex-direction: column; padding: .75rem .9rem; border-radius: 12px; background: #f8f9fa; }
.bal small { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.bal b { font-size: 1.35rem; font-weight: 800; color: var(--ardent-navy); }
.bal em { font-style: normal; font-size: .78rem; font-weight: 600; color: var(--muted); }
.balance .go { padding: 0 .8rem; margin-top: .9rem; }
@media (max-width: 640px) { .open { display: none !important; } }
</style>
