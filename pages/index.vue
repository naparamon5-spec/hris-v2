<template>
  <div>
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">{{ today }}</span>
        <h1>{{ greeting }}, {{ firstName }} 👋</h1>
        <p>{{ [me.role, me.company].filter(Boolean).join(' · ') }}</p>
        <div class="hero-actions">
          <NuxtLink to="/requests/leave-of-absence?new=1" class="btn btn-light"><AppIcon name="plus" /> File leave</NuxtLink>
          <NuxtLink to="/timesheet" class="btn btn-outline-light"><AppIcon name="table" /> My timesheet</NuxtLink>
        </div>
      </div>
      <NuxtLink v-if="canApprove" to="/approvals" class="hero-card">
        <span class="hc-label">Approvals required</span>
        <strong>{{ pendingCount }}</strong>
        <span class="hc-sub">Requests from your team waiting on you</span>
        <span class="hc-go">Review now <AppIcon name="chevron" :size="14" /></span>
      </NuxtLink>
    </section>

    <h3 class="section-title">Leave credits</h3>
    <div class="grid credits">
      <NuxtLink v-for="(c, i) in credits" :key="c.label" to="/leave-hours" class="plain">
        <StatCard :label="c.label" :value="c.value" :unit="c.unit" :icon="icons[i]" />
      </NuxtLink>
    </div>

    <div class="two">
      <div>
        <h3 class="section-title">Quick actions</h3>
        <div class="actions">
          <NuxtLink v-for="(t, key) in quick" :key="key" :to="`/requests/${key}?new=1`" class="action">
            <span class="icon-tile"><AppIcon :name="t.icon" /></span>
            <div><b>{{ t.title }}</b><small>{{ t.desc }}</small></div>
            <AppIcon name="plus" class="add" />
          </NuxtLink>
        </div>
      </div>
      <div>
        <div class="sec-row">
          <h3 class="section-title">Recent activity</h3>
          <NuxtLink to="/requests" class="view-all">View all <AppIcon name="chevron" :size="13" /></NuxtLink>
        </div>
        <!-- Same as the mobile Home: my 3 latest filings across all request types. -->
        <div class="recent">
          <NuxtLink v-for="r in recent" :key="r.app + r.no" :to="r.to" class="rc">
            <span class="abbr">{{ r.app }}</span>
            <div class="rc-body">
              <div class="rc-top"><b>{{ r.no }}</b><span class="badge" :class="'badge-' + badge(r.status)">{{ r.status }}</span></div>
              <small><span class="m">{{ r.detail }}</span><template v-if="r.date"><span class="sep"> • </span><span class="faint">{{ r.date }}</span></template></small>
            </div>
          </NuxtLink>
          <div v-if="!recent.length" class="rc empty-rc">
            <span class="abbr gray"><AppIcon name="requests" :size="18" /></span>
            <b class="m">No recent filings yet</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { badge } from '~/utils/format'
// Live: /auth/me + /auth/profile (session), /auth/leaves/hours, /auth/approvals/access,
// and GET /auth/requests/:type per type for Recent activity (BACKEND.md §6).
const api = useApi()
const me = useMe()
const { user } = useSession()
const firstName = computed(() => {
  const n = me.value.name || ''
  // "Dela Cruz, Juan" -> Juan; "Juan Dela Cruz" -> Juan
  return (n.includes(',') ? n.split(',')[1] : n).trim().split(/\s+/)[0] || ''
})

// Recent activity — same as hris_mobile (dashboard_screen.dart _loadRecent): my own filings from
// every request list, newest first, top 3. LOA sorts by date filed, CA/MAD/OT by request date;
// Other Requests only for Versatech.
const RECENT = [
  { key: 'leave-of-absence', app: 'LOA', sortBy: 'dateFiled', detail: r => r.type || 'Leave of Absence' },
  { key: 'call-approval', app: 'CA', sortBy: 'date', detail: () => 'Call Approval' },
  { key: 'manual-arrival-departure', app: 'MAD', sortBy: 'date', detail: () => 'Manual Arrival/Departure' },
  { key: 'overtime', app: 'OT', sortBy: 'date', detail: r => (r.hours ? `${r.hours} hrs` : 'Overtime') },
  { key: 'other-requests', app: 'REQ', sortBy: 'dateFiled', detail: r => r.reason || 'Other Request', versatech: true }
]
const { data: lists } = await useAsyncData('home-recent', async () => {
  const types = RECENT.filter(t => !t.versatech || hasOtherRequests(user.value))
  const res = await Promise.all(types.map(t =>
    api(`/auth/requests/${requestTypes[t.key].apiType}`).then(r => [t.key, (r.data || []).map(toRequestRow)]).catch(() => [t.key, []])))
  return Object.fromEntries(res)
}, { default: () => ({}), server: false })
const recent = computed(() => {
  const rows = RECENT.flatMap(t =>
    (lists.value[t.key] || []).map(r => ({
      app: t.app, no: r.no, status: r.status, detail: t.detail(r),
      date: r.date || r.dateFiled, sort: r[t.sortBy] || r.dateFiled,
      // Opens that type's list on the record's page with its details dialog open (?view=<id>).
      to: { path: `/requests/${t.key}`, query: r.id != null ? { view: r.id } : { q: r.no } }
    })))
  return newestFirst(rows, r => r.sort, r => r.no).slice(0, 3)
})
const { canApprove, pendingCount } = useApprovals()

// Home shows only VL Paid and SL Paid; the full list is on Leave Hours.
// Same VL Paid / SL Paid hours as the Leave Hours page (GET /auth/leaves/hours, shared cache).
const { data: hours } = await useAsyncData('leave-hours', () => api('/auth/leaves/hours'), { default: () => ({}), server: false })
const credits = computed(() => [
  { label: 'VL Paid', key: 'vl_paid' },
  { label: 'SL Paid', key: 'sl_paid' }
].map(c => {
  const v = hours.value?.[c.key]
  return { label: c.label, value: v || '— —', unit: v ? 'hrs' : '' }
}))
const icons = ['calendar', 'shield']
const h = new Date().getHours()
const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const quick = {
  'leave-of-absence': requestTypes['leave-of-absence'],
  overtime: requestTypes.overtime,
  'call-approval': requestTypes['call-approval'],
  'manual-arrival-departure': requestTypes['manual-arrival-departure']
}
</script>

<style scoped>
.plain { color: inherit; display: block; }
.credits { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.hero {
  position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: stretch; justify-content: space-between;
  background: var(--grad-navy); color: #fff; border-radius: 22px; padding: 1.9rem 2rem; box-shadow: var(--shadow-lg);
}
.hero::before { content: ''; position: absolute; width: 420px; height: 420px; right: -120px; top: -200px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--brand2-rgb),.45), transparent 65%); }
.hero::after { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px); background-size: 18px 18px; mask-image: linear-gradient(90deg, transparent 40%, #000); pointer-events: none; }
.hero-text { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; }
.eyebrow { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ardent-coral); font-weight: 700; }
.hero h1 { font-size: clamp(1.5rem, 3vw, 2rem); margin: .35rem 0 .2rem; }
.hero p { margin: 0; color: rgba(255,255,255,.7); font-size: .9rem; }
.hero-actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1.2rem; }
.btn-light { background: #fff; color: var(--ardent-navy); }
.btn-light:hover { box-shadow: 0 8px 20px -6px rgba(0,0,0,.4); }
.btn-outline-light { color: #fff; border-color: rgba(255,255,255,.3); }
.btn-outline-light:hover { background: rgba(255,255,255,.08); }
.hero-card {
  position: relative; z-index: 1; min-width: 240px; display: flex; flex-direction: column; gap: .2rem; color: #fff;
  padding: 1.2rem 1.3rem; border-radius: 16px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
  backdrop-filter: blur(8px); transition: background .15s;
}
.hero-card:hover { background: rgba(255,255,255,.13); }
.hc-label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.7); font-weight: 700; }
.hero-card strong { font-size: 2.6rem; font-weight: 800; line-height: 1.1; background: linear-gradient(135deg, #fff, #ffb3bb); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hc-sub { font-size: .8rem; color: rgba(255,255,255,.65); }
.hc-go { margin-top: .6rem; display: inline-flex; align-items: center; gap: .2rem; font-size: .8rem; font-weight: 700; color: var(--ardent-coral); }

.two { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 1.25rem; }
@media (max-width: 960px) { .two { grid-template-columns: 1fr; } }
.actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: .8rem; }
.action {
  display: flex; align-items: center; gap: .85rem; color: inherit; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; box-shadow: var(--shadow);
  transition: transform .15s, box-shadow .15s;
}
.action:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.action div { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.action b { font-size: .9rem; }
.action small { font-size: .76rem; color: var(--muted); line-height: 1.4; }
.add { color: var(--muted); flex-shrink: 0; transition: color .15s, transform .15s; }
.action:hover .add { color: var(--ardent-red); transform: rotate(90deg); }
/* Recent activity — one card per filing, like the mobile app */
.sec-row { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
.view-all { display: inline-flex; align-items: center; gap: .15rem; font-size: .8rem; font-weight: 700; }
.recent { display: flex; flex-direction: column; gap: .65rem; }
.rc {
  display: flex; align-items: center; gap: .85rem; padding: .85rem 1rem; color: inherit;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow);
  transition: transform .15s, box-shadow .15s;
}
a.rc:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.abbr { width: 46px; height: 42px; flex-shrink: 0; display: grid; place-items: center; border-radius: 10px; background: #fbe8eb; color: var(--ardent-red); font-size: .74rem; font-weight: 900; letter-spacing: .02em; }
.abbr.gray { background: #f1f2f4; color: var(--muted); }
.rc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .2rem; }
.rc-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
.rc-top b { font-size: .92rem; font-weight: 800; }
.rc-top .badge { flex-shrink: 0; }
.rc-body small { font-size: .78rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sep, .faint { color: #9aa7b3; font-weight: 500; }
@media (max-width: 600px) { .hero { padding: 1.4rem 1.2rem; } .hero-card { min-width: 0; width: 100%; } }
</style>
