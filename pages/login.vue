<template>
  <AuthCard>
    <form v-if="step === 'login'" @submit.prevent="signIn">
      <AuthSteps :current="2" />
      <h2>Welcome back!</h2>
      <p class="sub">Sign in to continue to HRIS.</p>

      <!-- Company was picked on step 1 (/company-select). -->
      <div class="co-pick">
        <span class="co-logo"><ArdentLogo :company="company" /></span>
        <div class="co-txt"><small>Signing in to</small><b>{{ company?.name }}</b></div>
        <NuxtLink to="/company-select" class="co-change">Change</NuxtLink>
      </div>

      <div class="field"><label for="emp">Employee ID</label>
        <input id="emp" v-model="empId" class="input" placeholder="Enter Employee ID" autocomplete="username" required></div>
      <div class="field"><label for="pw">Password</label>
        <div class="pw">
          <input id="pw" v-model="password" class="input" :type="show ? 'text' : 'password'" placeholder="Enter password" autocomplete="current-password" required>
          <button type="button" class="eye" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
        </div></div>

      <div class="row">
        <label class="check"><input v-model="remember" type="checkbox"> Remember me</label>
        <NuxtLink to="/forgot-password">Forgot your password?</NuxtLink>
      </div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <button class="btn btn-primary full" type="submit" :disabled="busy" :aria-busy="busy">{{ busy ? 'Signing in…' : 'Log in' }}</button>

      <div class="or"><span>or</span></div>
      <!-- No Authentik sign-in on hris_server yet (BACKEND.md §0 #1). -->
      <button type="button" class="btn btn-ghost full" @click="err = 'Sign in with Authentik is not available yet. Please use your Employee ID and password.'"><AppIcon name="shield" /> Sign in with Authentik</button>

      <NuxtLink to="/examination" class="exam"><AppIcon name="doc" :size="15" /> For examination?</NuxtLink>
    </form>

    <form v-else @submit.prevent="finish">
      <span class="eyebrow">Two-factor authentication</span>
      <h2>Verify it's you</h2>
      <p class="sub">Enter the 6-digit code from your authenticator app.</p>
      <div class="field"><label for="otp">Enter 6-Digit Code</label>
        <input id="otp" :value="otp" class="input otp" type="text" inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code" placeholder="000000" title="6 digits" required :disabled="busy" @input="onOtp"></div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <button class="btn btn-primary full" type="submit" :disabled="busy || otp.length !== 6" :aria-busy="busy">{{ busy ? 'Verifying…' : 'Verify & continue' }}</button>
      <a href="#" class="alt" @click.prevent="step = 'login'; err = ''; otp = ''">‹ Back to sign in</a>
    </form>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
// Step 2 of sign-in: POST /public/login (BACKEND.md §3.1). No company chosen yet → step 1 first.
const { company, load } = useCompany()
onMounted(async () => { if (!(await load())) navigateTo('/company-select', { replace: true }) })
const empId = ref('')
const password = ref('')
const remember = ref(false)
const show = ref(false)
const step = ref('login')
const busy = ref(false)
const err = ref('')
const api = useApi()
const session = useSession()

// The OTP step posts the same body again with `otp` (the password stays in memory).
const login = async (otpCode) => {
  if (!company.value) { navigateTo('/company-select'); return }
  busy.value = true
  err.value = ''
  try {
    const r = await api('/public/login', {
      method: 'POST',
      body: {
        user_id: empId.value.trim(), password: password.value, tenant: company.value.id,
        checked: remember.value, ...(otpCode ? { otp: otpCode } : {})
      }
    })
    if (r.twoFactorRequired) { step.value = 'otp'; return }
    session.signIn(r)
    password.value = ''
    await session.load().catch(() => {})
    navigateTo('/')
  } catch (e) {
    if (e?.data?.twoFactorRequired) step.value = 'otp'
    err.value = apiError(e, 'Unable to sign in.')
  } finally {
    busy.value = false
  }
}
const signIn = () => login()
const finish = async () => {
  if (busy.value || otp.value.length !== 6) return
  lastTried = otp.value
  await login(otp.value)
  // Still on the code step = wrong/expired code: clear it and put the cursor back.
  if (step.value === 'otp') {
    otp.value = ''
    lastTried = ''
    await nextTick()
    document.getElementById('otp')?.focus()
  }
}
// Code field takes digits only: letters and symbols are dropped as you type or paste.
const otp = ref('')
// Auto-submit once 6 digits are in. Each code is only tried once, so a wrong code
// doesn't loop — the field clears and the next 6 digits submit again.
let lastTried = ''
const onOtp = (e) => {
  otp.value = e.target.value.replace(/\D/g, '').slice(0, 6)
  e.target.value = otp.value
  if (otp.value.length === 6 && !busy.value && otp.value !== lastTried) finish()
}
</script>

<style scoped>
.co-pick { display: flex; align-items: center; gap: .75rem; padding: .55rem .6rem .55rem .55rem; margin: 0 0 1rem; border: 1px solid var(--border); border-radius: 14px; background: #fbfbfc; }
.co-logo { width: 84px; height: 30px; flex: none; display: flex; justify-content: center; }
.co-logo :deep(.chip) { height: 30px; }
.co-logo :deep(.chip img) { max-width: 80px; }
.co-logo :deep(.mono) { width: 30px; height: 30px; font-size: .8rem; border-radius: 9px; }
.co-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
.co-txt small { font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.co-txt b { font-size: .9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.co-change { font-size: .8rem; font-weight: 700; padding: .35rem .7rem; border-radius: 999px; border: 1px solid var(--border); background: #fff; flex: none; }
.co-change:hover { border-color: var(--ardent-red); }
@media (max-width: 400px) { .co-logo { display: none; } .co-pick { padding-left: .85rem; } }
.eyebrow { display: block; font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ardent-red); font-weight: 700; margin-bottom: .4rem; }
.row { display: flex; justify-content: space-between; align-items: center; gap: .5rem; font-size: .8rem; margin-bottom: 1.25rem; }
.check { display: flex; gap: .4rem; align-items: center; color: var(--muted); }
.check input { accent-color: var(--ardent-red); }
.pw { position: relative; display: flex; }
.pw .input { flex: 1; padding-right: 4rem; }
.eye { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); background: none; border: 0; font: 600 .75rem Montserrat, sans-serif; color: var(--muted); cursor: pointer; padding: .3rem .5rem; }
.or { display: flex; align-items: center; gap: .75rem; margin: 1rem 0; color: var(--muted); font-size: .75rem; text-transform: uppercase; letter-spacing: .1em; }
.or::before, .or::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.exam { display: flex; justify-content: center; align-items: center; gap: .35rem; margin-top: 1.25rem; font-size: .82rem; font-weight: 600; }
.otp { letter-spacing: .6em; text-align: center; font-size: 1.3rem; font-weight: 700; }
</style>
