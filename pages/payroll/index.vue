<template>
  <div>
    <div class="page-head">
      <div><h1>Payroll</h1><p>Your payslips per cut-off.</p></div>
      <button class="btn btn-ghost" @click="bulk = true"><AppIcon name="download" /> Download Payslips</button>
    </div>

    <h3 class="section-title" style="margin-top:0">Payslip history</h3>
    <div class="card" style="padding:.25rem 1.25rem">
      <NuxtLink v-for="p in payslips" :key="p.period" :to="`/payroll/${p.period}`" class="row">
        <span class="icon-tile"><AppIcon name="wallet" /></span>
        <div><b>Period {{ p.period }} · {{ p.label }}</b><small class="m">Pay date {{ p.payDate }}</small></div>
        <AppIcon name="chevron" class="m" />
      </NuxtLink>
    </div>

    <div v-if="bulk" class="overlay" @click.self="bulk = false">
      <div class="card modal">
        <h2>Download Payslips</h2>
        <input v-model="bq" class="input" placeholder="Search period no. or month (e.g. 12, Oct)" style="width:100%;margin-bottom:.75rem">
        <label v-for="p in bulkRows" :key="p.period" class="pick"><input v-model="picked" type="checkbox" :value="p.period"> Period {{ p.period }} · {{ p.label }}</label>
        <div class="foot">
          <button class="btn btn-ghost" @click="bulk = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!picked.length" @click="download">Download ({{ picked.length }})</button>
        </div>
      </div>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup lang="ts">
const { payslips } = useMockData()
const bulk = ref(false)
const bq = ref('')
const picked = ref<number[]>([])
const toast = ref('')
const bulkRows = computed(() => payslips.filter(p => `${p.period} ${p.label}`.toLowerCase().includes(bq.value.toLowerCase())))
const download = () => {
  bulk.value = false
  toast.value = `Preparing ${picked.value.length} payslip(s)… (mock)`
  picked.value = []
  setTimeout(() => (toast.value = ''), 2200)
}
</script>

<style scoped>
.row { display: flex; align-items: center; gap: 1rem; padding: .9rem 0; border-bottom: 1px solid var(--border); color: inherit; }
.row:last-child { border-bottom: 0; }
.row div { display: flex; flex-direction: column; flex: 1; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 440px; max-height: 90vh; overflow: auto; }
.modal h2 { font-size: 1.2rem; margin-bottom: 1rem; }
.pick { display: flex; gap: .6rem; align-items: center; padding: .55rem 0; font-size: .9rem; border-bottom: 1px solid var(--border); }
.pick input { accent-color: var(--ardent-red); }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
</style>
