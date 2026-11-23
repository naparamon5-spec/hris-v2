<template>
  <div v-if="slip">
    <NuxtLink to="/payroll" class="back">‹ Payroll</NuxtLink>
    <div class="page-head">
      <div><h1>Payslip</h1><p>Period {{ slip.period }} · {{ slip.label }} · Pay date • {{ slip.payDate }}</p></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-ghost" @click="flash('PNG')"><AppIcon name="download" /> Image (PNG)</button>
        <button class="btn btn-primary" @click="flash('PDF')"><AppIcon name="download" /> PDF</button>
      </div>
    </div>

    <div class="card slip">
      <div class="top">
        <ArdentLogo :sub="user.company" />
        <span class="tag">PAYSLIP</span>
      </div>
      <div class="emp">
        <div><small class="m">Employee</small><b>{{ user.name }}</b></div>
        <div><small class="m">Employee ID</small><b>{{ user.id }}</b></div>
        <div><small class="m">Department</small><b>{{ user.department }}</b></div>
      </div>
      <div class="grid grid-2">
        <div>
          <h3 class="section-title">Earnings</h3>
          <div v-for="e in slip.earnings" :key="e.label" class="line"><span>{{ e.label }}</span><b>{{ peso(e.amount) }}</b></div>
          <div class="line tot"><span>Gross Pay</span><b>{{ peso(slip.gross) }}</b></div>
        </div>
        <div>
          <h3 class="section-title">Deductions</h3>
          <div v-for="d in slip.deductionItems" :key="d.label" class="line"><span>{{ d.label }}</span><b>{{ peso(d.amount) }}</b></div>
          <div class="line tot"><span>Total Deductions</span><b>{{ peso(slip.deductions) }}</b></div>
        </div>
      </div>
      <div class="netpay"><span>Net Pay</span><strong>{{ peso(slip.net) }}</strong></div>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
const { payslips, user, peso } = useMockData()
const route = useRoute()
const slip = computed(() => payslips.find(p => p.period === Number(route.params.period)))
const toast = ref('')
const flash = (k) => { toast.value = `Downloading payslip as ${k}… (mock)`; setTimeout(() => (toast.value = ''), 2200) }
</script>

<style scoped>
.slip { max-width: 820px; padding: 1.75rem; }
.top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.25rem; border-bottom: 2px solid var(--ardent-red); }
.tag { font-weight: 800; letter-spacing: .3em; color: var(--ardent-red); }
.emp { display: flex; flex-wrap: wrap; gap: 1rem 2.5rem; padding: 1.25rem 0 0; }
.emp div { display: flex; flex-direction: column; font-size: .9rem; }
.line { display: flex; justify-content: space-between; padding: .5rem 0; border-bottom: 1px dashed var(--border); font-size: .9rem; }
.line b { font-weight: 600; }
.tot { border-bottom: 0; border-top: 1px solid var(--text); margin-top: .25rem; }
.tot b { font-weight: 800; }
.netpay { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding: 1rem 1.25rem; background: #fde8eb; border-radius: 10px; }
.netpay span { font-weight: 700; color: var(--ardent-red); text-transform: uppercase; letter-spacing: .08em; font-size: .85rem; }
.netpay strong { font-size: 1.6rem; font-weight: 800; }
</style>
