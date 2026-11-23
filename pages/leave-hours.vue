<template>
  <div>
    <NuxtLink to="/requests" class="back">‹ Requests</NuxtLink>
    <div class="page-head"><div><h1>Leave Hours</h1><p>Your leave balances in hours.</p></div></div>
    <div class="grid grid-4">
      <StatCard v-for="s in leaveHours.summary" :key="s.label" :label="s.label" :value="String(s.value)" trend="hours" />
    </div>
    <div class="grid grid-2" style="margin-top:1.5rem">
      <div v-for="t in tables" :key="t.title" class="card">
        <h3 style="font-size:1rem;margin-bottom:.75rem">{{ t.title }}</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Date</th><th>Type</th><th>Hours</th></tr></thead>
          <tbody><tr v-for="r in t.rows" :key="r.date"><td>{{ r.date }}</td><td>{{ r.type }}</td><td>{{ r.hours }}</td></tr></tbody>
        </table></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { leaveHours } = useMockData()
const tables = [
  { title: 'Approved Leave', rows: leaveHours.approvedLeave },
  { title: 'Approved UT (AM/PM)', rows: leaveHours.approvedUt }
]
</script>
