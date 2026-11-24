<template>
  <div>
    <NuxtLink to="/requests" class="back">‹ Requests</NuxtLink>
    <div class="page-head"><div><h1>Leave Hours</h1><p>Your remaining leave hours and approved leave.</p></div></div>

    <h3 class="section-title">Remaining leave hours</h3>
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

    <div class="card list">
      <div class="lh">
        <h3>Approved leave &amp; undertime</h3>
        <div class="chips">
          <button v-for="f in filters" :key="f" type="button" class="chip" :class="{ on: filter === f }" @click="filter = f">{{ f }}</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table stack">
          <thead><tr><th>No.</th><th>Date</th><th>Leave type</th><th>Hours</th><th>Approved by</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="r in pageRows" :key="r.no">
              <td data-label="No."><b>{{ r.no }}</b></td>
              <td data-label="Date">{{ r.txn_date }}</td>
              <td data-label="Leave type">{{ r.leave_type }}</td>
              <td data-label="Hours">{{ r.applied_hours }}</td>
              <td data-label="Approved by">{{ r.approved_by || '—' }}</td>
              <td data-label="Status"><span class="badge badge-ok">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
        <p v-if="!rows.length" class="empty">No approved leave yet</p>
      </div>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" />
  </div>
</template>

<script setup>
// Replace with: api('/auth/leaves/hours') and api('/auth/requests/loa') (status Approved/Posted)
const { leaveHours: h } = useMockData()

// Same cards and order as hris_mobile leave_hours_screen.dart. Approved Leave / UT always
// show; the others only when the leave type is assigned (server sends null otherwise).
const cards = computed(() => [
  { label: 'Approved Leave', value: h.approved_leave, used: h.approved_leave_used, icon: 'calendar', main: true },
  { label: 'Approved UT (AM/PM)', value: h.approved_ut, used: h.approved_ut_used, icon: 'clock', main: true },
  h.vl_paid != null && { label: 'VL Paid', value: h.vl_paid, icon: 'calendar' },
  h.sl_paid != null && { label: 'SL Paid', value: h.sl_paid, icon: 'shield' },
  h.additional_vl != null && { label: 'Additional VL', value: h.additional_vl, icon: 'plus' },
  h.accumulated_leave != null && { label: 'Accumulated Leave', value: h.accumulated_leave, icon: 'hourglass' }
].filter(Boolean))

const filters = ['All', 'Leave', 'Undertime']
const filter = ref('All')
const isUt = (r) => r.leave_type === 'Approved UT (AM/PM)'
const rows = computed(() => h.history.filter(r =>
  filter.value === 'All' || (filter.value === 'Undertime') === isUt(r)))
const { page, size, total, pages, pageRows } = usePagination(rows, 5)
</script>

<style scoped>
.section-title { margin-top: 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .9rem; }
.hrs { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.1rem; }
.hrs > div { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
.hrs small { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.hrs b { font-size: 1.55rem; font-weight: 800; color: var(--ardent-navy); line-height: 1.15; }
.hrs em { font-style: normal; font-size: .8rem; font-weight: 600; color: var(--muted); }
.hrs .used { text-transform: none; letter-spacing: 0; font-weight: 500; }
.hrs.main { border-color: rgba(198,50,76,.25); }
.note { display: flex; align-items: center; gap: .4rem; font-size: .8rem; margin: .75rem 0 1.25rem; }
.list { padding: .5rem; }
.lh { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .6rem; padding: .6rem .8rem .7rem; }
.lh h3 { font-size: 1rem; }
.empty { text-align: center; color: var(--muted); padding: 2rem 0; }
</style>
