<template>
  <div>
    <NuxtLink to="/requests" class="back">‹ Requests</NuxtLink>
    <div class="page-head">
      <div><h1>Timesheet</h1><p>Select a cut-off period to view daily entries.</p></div>
      <select v-model="year" class="input" style="width:auto"><option>2026</option><option>2025</option></select>
    </div>

    <div class="periods">
      <button v-for="p in periods" :key="p.no" class="card period" :class="{ on: sel === p.no }" @click="sel = p.no">
        <b>Period {{ p.no }}</b><small class="m">{{ p.label }}</small>
      </button>
    </div>

    <div class="card table-wrap" style="padding:.5rem;margin-top:1rem">
      <div class="th"><b>TimesheetID TS-{{ year }}-{{ String(sel).padStart(2, '0') }}</b><span class="m">Total: {{ total }} hrs</span></div>
      <table class="table">
        <thead><tr><th>Date</th><th>Time in</th><th>Time out</th><th>Late (min)</th><th>OT (hrs)</th><th>Total</th><th>Remarks</th></tr></thead>
        <tbody>
          <tr v-for="d in timesheet" :key="d.date" :class="{ rest: d.remarks === 'Rest day' }">
            <td><b>{{ d.date }}</b> <small class="m">{{ d.dow }}</small></td>
            <td>{{ d.in }}</td><td>{{ d.out }}</td>
            <td :style="d.late ? 'color:var(--ardent-red);font-weight:600' : ''">{{ d.late || '—' }}</td>
            <td>{{ d.ot || '—' }}</td>
            <td>{{ d.totalHrs ? d.totalHrs + ' hrs' : '—' }}</td>
            <td><span v-if="d.remarks" class="badge" :class="d.remarks === 'Late' ? 'badge-warn' : 'badge-gray'">{{ d.remarks }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const { timesheet } = useMockData()
const year = ref('2026')
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const periods = Array.from({ length: 24 }, (_, i) => ({
  no: i + 1, label: `${months[Math.floor(i / 2)]} ${i % 2 ? '16 – end' : '1 – 15'}`
})).slice(14).reverse()
const sel = ref(22)
const total = computed(() => timesheet.reduce((a, d) => a + d.totalHrs + d.ot, 0))
</script>

<style scoped>
.periods { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .6rem; }
.period { display: flex; flex-direction: column; text-align: left; cursor: pointer; padding: .8rem 1rem; font-family: inherit; color: inherit; }
.period.on { border-color: var(--ardent-red); box-shadow: 0 0 0 2px rgba(198,50,76,.2); }
.period small { font-size: .78rem; }
.th { display: flex; justify-content: space-between; padding: .75rem .8rem; font-size: .9rem; }
.rest td { color: var(--muted); background: #fafafa; }
</style>
