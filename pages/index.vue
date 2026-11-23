<template>
  <div>
    <section class="hero">
      <div class="hero-text">
        <span class="eyebrow">{{ today }}</span>
        <h1>{{ greeting }}, {{ user.name.split(' ')[0] }} 👋</h1>
        <p>{{ user.role }} · {{ user.company }}</p>
        <div class="hero-actions">
          <NuxtLink to="/requests/leave-of-absence?new=1" class="btn btn-light"><AppIcon name="plus" /> File leave</NuxtLink>
          <NuxtLink to="/timesheet" class="btn btn-outline-light"><AppIcon name="table" /> My timesheet</NuxtLink>
        </div>
      </div>
      <NuxtLink to="/approvals" class="hero-card">
        <span class="hc-label">Approvals required</span>
        <strong>{{ approvals.length }}</strong>
        <span class="hc-sub">Requests from your team waiting on you</span>
        <span class="hc-go">Review now <AppIcon name="chevron" :size="14" /></span>
      </NuxtLink>
    </section>

    <h3 class="section-title">Leave credits</h3>
    <div class="grid credits">
      <NuxtLink v-for="(c, i) in credits" :key="c.label" to="/leave-hours" class="plain">
        <StatCard :label="c.label" :value="String(c.value)" :unit="c.unit" :icon="icons[i]" :progress="(c.value / 15) * 100" />
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
        <h3 class="section-title">Recent activity</h3>
        <div class="card feed">
          <div v-for="a in recentActivity" :key="a.meta" class="act">
            <span class="dot" :class="'d-' + badge(a.status)" />
            <div><b>{{ a.title }}</b><small class="m">{{ a.meta }}</small></div>
            <small class="m when">{{ a.when }}</small>
          </div>
          <NuxtLink to="/notifications" class="all">View all activity <AppIcon name="chevron" :size="14" /></NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { user, leaveCredits, approvals, recentActivity, badge } = useMockData()
// Home shows only Vacation and Sick Leave; the full list is on Leave Hours.
const credits = leaveCredits.slice(0, 2)
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
.hero::before { content: ''; position: absolute; width: 420px; height: 420px; right: -120px; top: -200px; border-radius: 50%; background: radial-gradient(circle, rgba(255,89,105,.45), transparent 65%); }
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
.feed { padding: .4rem 1.25rem .9rem; }
.act { display: flex; align-items: center; gap: .85rem; padding: .85rem 0; border-bottom: 1px dashed var(--border); }
.act div { flex: 1; display: flex; flex-direction: column; min-width: 0; font-size: .88rem; }
.act small { font-size: .76rem; }
.when { white-space: nowrap; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 4px #f4f5f7; }
.d-ok { background: #2e9d6a; } .d-warn { background: #f0a030; } .d-red { background: var(--ardent-red); } .d-navy, .d-gray { background: var(--muted); }
.all { display: inline-flex; align-items: center; gap: .2rem; margin-top: .8rem; font-size: .8rem; font-weight: 700; }
@media (max-width: 600px) { .hero { padding: 1.4rem 1.2rem; } .hero-card { min-width: 0; width: 100%; } }
</style>
