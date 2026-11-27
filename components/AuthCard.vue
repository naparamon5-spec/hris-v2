<template>
  <section class="hero" :class="{ slim }">
    <HrisLogo light :size="44" />
    <div class="copy">
      <span class="eyebrow">#OneArdent</span>
      <h1>People first.<br><span>Powering innovation.</span></h1>
      <p>Leave, requests, timesheets, payslips and approvals — all in one place, for every Ardent company.</p>

      <div class="float">
        <div class="mini m1"><span class="ok">✓</span><div><b>Leave approved</b><small>Vacation Leave · 2 days</small></div></div>
        <div class="mini m2"><span class="pay">₱</span><div><b>Payslip released</b><small>Period 22 · Nov 1–15</small></div></div>
      </div>
    </div>
    <ul><li v-for="v in values" :key="v">{{ v }}</li></ul>
  </section>
  <section class="panel">
    <div class="form"><slot /></div>
    <small class="legal">
      © {{ year }} Ardent Networks, Inc. ·
      <NuxtLink to="/support">Support</NuxtLink> ·
      <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
    </small>
  </section>
</template>

<script setup>
// slim: on phones show only the logo in the banner (keeps short pages scroll-free).
defineProps({ slim: Boolean })
const values = ['Partnership', 'Service', 'Learning', 'Trust', 'Scale']
const year = new Date().getFullYear()
</script>

<style scoped>
.hero {
  position: relative; overflow: hidden; background: var(--grad-navy);
  color: #fff; padding: 2.75rem 3rem; display: flex; flex-direction: column; justify-content: space-between; gap: 2rem;
}
.hero::before { content: ''; position: absolute; width: 560px; height: 560px; right: -200px; top: -180px; border-radius: 50%; background: radial-gradient(circle, rgba(var(--brand2-rgb),.42), transparent 65%); }
.hero::after { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px); background-size: 22px 22px; mask-image: radial-gradient(circle at 70% 40%, #000, transparent 70%); pointer-events: none; }
.hero > * { position: relative; z-index: 1; }
.eyebrow { font-size: .72rem; letter-spacing: .16em; font-weight: 700; color: var(--ardent-coral); }
.hero h1 { font-size: clamp(2rem, 4vw, 3.3rem); line-height: 1.08; font-weight: 800; margin-top: .5rem; letter-spacing: -.03em; }
.hero h1 span { background: linear-gradient(135deg, var(--ardent-coral), var(--brand-soft-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p { color: rgba(255,255,255,.72); max-width: 30rem; margin-top: 1rem; }
.float { display: flex; flex-direction: column; gap: .75rem; margin-top: 2rem; max-width: 300px; }
.mini { display: flex; gap: .75rem; align-items: center; padding: .8rem 1rem; border-radius: 14px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(10px); animation: bob 5s ease-in-out infinite; }
.m2 { margin-left: 2.5rem; animation-delay: -2.5s; }
.mini div { display: flex; flex-direction: column; font-size: .82rem; }
.mini small { color: rgba(255,255,255,.6); font-size: .72rem; }
.mini > span { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; font-weight: 800; }
.ok { background: #2e9d6a; } .pay { background: var(--grad-brand); }
@keyframes bob { 50% { transform: translateY(-6px); } }
.hero ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: .5rem; }
.hero li { font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; border: 1px solid rgba(255,255,255,.2); padding: .35rem .8rem; border-radius: 999px; background: rgba(255,255,255,.04); }
.panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1.25rem; background: #fff; gap: 2rem; }
.form { width: 100%; max-width: 400px; }
.form :deep(h2) { font-size: 1.75rem; letter-spacing: -.03em; }
.form :deep(.sub) { color: var(--muted); margin: .3rem 0 1.6rem; font-size: .9rem; }
.form :deep(.full) { width: 100%; padding: .85rem; }
.form :deep(.alt) { display: block; text-align: center; margin-top: 1.25rem; font-size: .85rem; font-weight: 600; }
.legal { color: var(--muted); font-size: .72rem; text-align: center; }
.legal a { color: var(--muted); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
.legal a:hover { color: var(--ardent-red); }
@media (max-width: 860px) {
  .hero.slim { padding: 1rem 1.25rem; }
  .hero.slim .copy { display: none; }
  .hero { padding: 1.75rem 1.25rem; gap: 1rem; }
  .float, .hero ul, .hero p { display: none; }
  .hero h1 { font-size: 1.6rem; }
}
@media (prefers-reduced-motion: reduce) { .mini { animation: none; } }
</style>
