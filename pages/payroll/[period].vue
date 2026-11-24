<template>
  <div v-if="slip">
    <NuxtLink to="/payroll" class="back">‹ Back</NuxtLink>
    <div class="page-head">
      <div><h1>Payslip</h1><p>Period {{ slip.period }} · {{ slip.label }} · Pay date • {{ slip.payDate }}</p></div>
      <div v-if="unlocked" style="display:flex;gap:.5rem">
        <button class="btn btn-ghost" @click="flash('PNG')"><AppIcon name="download" /> Image (PNG)</button>
        <button class="btn btn-primary" @click="flash('PDF')"><AppIcon name="download" /> PDF</button>
      </div>
    </div>

    <!-- Payslip details stay out of the page until the password is confirmed. -->
    <div v-if="!unlocked" class="card locked">
      <span class="icon-tile"><AppIcon name="shield" /></span>
      <div><b>Payslip is protected</b><small class="m">Confirm your password to view this payslip.</small></div>
      <button class="btn btn-primary btn-sm" @click="askPw = true">Unlock</button>
    </div>

    <div v-else class="card slip">
      <div class="top">
        <ArdentLogo />
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

    <div v-if="askPw" class="pw-overlay" @click.self="cancelPw">
      <form class="pw-card" role="dialog" aria-modal="true" aria-labelledby="pw-title" @submit.prevent="checkPw" @keydown.esc="cancelPw">
        <span class="pw-icon"><AppIcon name="shield" :size="22" /></span>
        <h2 id="pw-title">Confirm your password</h2>
        <p class="m">Payslips contain salary details. Enter your password to view Period {{ slip.period }}.</p>
        <div class="field">
          <label for="pw-input" class="sr-only">Password</label>
          <div class="pw-wrap">
            <input
              id="pw-input" ref="pwBox" v-model="pw" class="input" :type="showPw ? 'text' : 'password'"
              autocomplete="current-password" placeholder="Enter your password"
              :aria-invalid="!!pwError" aria-describedby="pw-error"
            >
            <button type="button" class="eye" :aria-label="showPw ? 'Hide password' : 'Show password'" @click="showPw = !showPw">{{ showPw ? 'Hide' : 'Show' }}</button>
          </div>
          <small id="pw-error" class="err" role="alert">{{ pwError }}</small>
        </div>
        <div class="pw-actions">
          <button type="button" class="btn btn-ghost" @click="cancelPw">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="checking">{{ checking ? 'Checking…' : 'View payslip' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const { payslips, user, peso } = useMockData()
const route = useRoute()
const slip = computed(() => payslips.find(p => p.period === Number(route.params.period)))
const toast = ref('')
const flash = (k) => { toast.value = `Downloading payslip as ${k}… (mock)`; setTimeout(() => (toast.value = ''), 2200) }

// Password check before showing the payslip. Asked every time a payslip is opened.
// Mock: any password of 6+ characters is accepted; replace checkPw with the real API call.
const unlocked = ref(false)
const askPw = ref(false)
const pw = ref('')
const showPw = ref(false)
const pwError = ref('')
const checking = ref(false)
const pwBox = ref(null)
watch(askPw, (open) => { if (open) { pw.value = ''; pwError.value = ''; nextTick(() => pwBox.value?.focus()) } })
onMounted(() => { askPw.value = true })
const checkPw = async () => {
  pwError.value = ''
  if (!pw.value) { pwError.value = 'Enter your password.'; return }
  checking.value = true
  await new Promise(r => setTimeout(r, 500))
  checking.value = false
  if (pw.value.length < 6) { pwError.value = 'Incorrect password. Please try again.'; pw.value = ''; pwBox.value?.focus(); return }
  pw.value = ''
  askPw.value = false
  unlocked.value = true
}
const cancelPw = () => { askPw.value = false; if (!unlocked.value) navigateTo('/payroll') }
</script>

<style scoped>
.locked { display: flex; align-items: center; gap: 1rem; max-width: 820px; }
.locked div { flex: 1; display: flex; flex-direction: column; }
.pw-overlay { position: fixed; inset: 0; margin: 0; z-index: 100; background: rgba(19,51,65,.55); backdrop-filter: blur(6px); display: grid; place-items: center; padding: 1rem; }
.pw-card { width: 100%; max-width: 400px; background: #fff; border-radius: 20px; padding: 1.75rem 1.5rem 1.4rem; text-align: center; box-shadow: var(--shadow-lg); }
.pw-card h2 { font-size: 1.15rem; }
.pw-card > p { margin: .5rem 0 1.25rem; font-size: .88rem; line-height: 1.5; }
.pw-card .field { text-align: left; margin-bottom: .5rem; }
.pw-icon { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 1rem; background: #fdecef; color: var(--ardent-red); }
.pw-wrap { position: relative; display: flex; }
.pw-wrap .input { flex: 1; padding-right: 4rem; }
.input[aria-invalid="true"] { border-color: var(--ardent-alert); }
.eye { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); background: none; border: 0; font: 600 .75rem Montserrat, sans-serif; color: var(--muted); cursor: pointer; padding: .3rem .5rem; }
.err { color: var(--ardent-alert); font-size: .78rem; min-height: 1.1em; }
.pw-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: 1rem; }
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
