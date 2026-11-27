<template>
  <div>
    <div class="page-head"><div><h1>Leave Hours</h1><p>Your remaining leave hours.</p></div></div>

    <h3 class="section-title">Remaining leave hours</h3>
    <p v-if="pending" class="state">Loading…</p>
    <p v-else-if="error" class="state bad">{{ apiError(error, 'Unable to load leave hours.') }}</p>
    <div class="cards">
      <div v-for="c in cards" :key="c.label" class="card hrs" :class="{ main: c.main }">
        <span class="icon-tile"><AppIcon :name="c.icon" /></span>
        <div>
          <small>{{ c.label }}</small>
          <b>{{ c.value || '— —' }}<em v-if="c.value"> hrs</em></b>
          <small v-if="c.used" class="m used">{{ c.used }} hrs used</small>
        </div>
      </div>
    </div>
    <p class="note m"><AppIcon name="clock" :size="14" /> Balances appear once your requests are approved.</p>
  </div>
</template>

<script setup>
import { apiError } from '~/composables/useApi'
// GET /auth/leaves/hours (BACKEND.md §10). "hh:mm" strings; null = leave type not assigned.
const api = useApi()
const { data, pending, error } = await useAsyncData('leave-hours', () => api('/auth/leaves/hours'), { default: () => ({}), server: false })

// Same cards and order as hris_mobile leave_hours_screen.dart. Approved Leave / UT always
// show; the others only when the leave type is assigned (server sends null otherwise).
const cards = computed(() => { const h = data.value || {}; return [
  { label: 'Approved Leave', value: h.approved_leave, used: h.approved_leave_used, icon: 'calendar', main: true },
  { label: 'Approved UT (AM/PM)', value: h.approved_ut, used: h.approved_ut_used, icon: 'clock', main: true },
  h.vl_paid != null && { label: 'VL Paid', value: h.vl_paid, icon: 'calendar' },
  h.sl_paid != null && { label: 'SL Paid', value: h.sl_paid, icon: 'shield' },
  h.additional_vl != null && { label: 'Additional VL', value: h.additional_vl, icon: 'plus' },
  h.accumulated_leave != null && { label: 'Accumulated Leave', value: h.accumulated_leave, icon: 'hourglass' }
].filter(Boolean) })
</script>

<style scoped>
.section-title { margin-top: 0; }
.cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .9rem; }
@media (max-width: 1100px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .cards { grid-template-columns: 1fr; } }
.hrs { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.1rem; }
.hrs > div { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
.hrs small { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.hrs b { font-size: 1.55rem; font-weight: 800; color: var(--ardent-navy); line-height: 1.15; }
.hrs em { font-style: normal; font-size: .8rem; font-weight: 600; color: var(--muted); }
.hrs .used { text-transform: none; letter-spacing: 0; font-weight: 500; }
.hrs.main { border-color: rgba(var(--brand-rgb),.25); }
.note { display: flex; align-items: center; gap: .4rem; font-size: .8rem; margin-top: .75rem; margin-bottom: 1.25rem; }
</style>
