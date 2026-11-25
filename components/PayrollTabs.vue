<template>
  <!-- Payslips and Timesheet share the same pay cut-offs, so they sit together under Payroll. -->
  <nav class="tabs ptabs" aria-label="Payroll">
    <NuxtLink to="/payroll" :class="{ on: !isTimesheet }" :aria-current="!isTimesheet ? 'page' : undefined">Payslips</NuxtLink>
    <NuxtLink to="/timesheet" :class="{ on: isTimesheet }" :aria-current="isTimesheet ? 'page' : undefined">Timesheet</NuxtLink>
  </nav>
</template>

<script setup>
const route = useRoute()
const isTimesheet = computed(() => route.path.startsWith('/timesheet'))
</script>

<style scoped>
.ptabs { margin-bottom: 0; }
.ptabs a { padding: .5rem 1.1rem; border-radius: 999px; font: 600 .85rem 'Montserrat', sans-serif; color: var(--muted); white-space: nowrap; transition: all .15s; }
.ptabs a:hover:not(.on) { color: var(--text); }
.ptabs a.on { color: #fff; background: var(--ardent-navy); }
</style>
