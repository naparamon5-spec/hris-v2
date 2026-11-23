<template>
  <AuthCard>
    <form v-if="step === 'login'" @submit.prevent="signIn">
      <span class="eyebrow">Human Resource Information System</span>
      <h2>Welcome back!</h2>
      <p class="sub">Sign in to continue to HRIS.</p>

      <div class="field"><label for="emp">Employee ID</label>
        <input id="emp" v-model="empId" class="input" placeholder="Enter Employee ID" autocomplete="username" required></div>
      <div class="field"><label for="pw">Password</label>
        <div class="pw">
          <input id="pw" class="input" :type="show ? 'text' : 'password'" placeholder="Enter password" autocomplete="current-password" required>
          <button type="button" class="eye" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
        </div></div>
      <div class="field"><label for="co">Company</label>
        <select id="co" v-model="company" class="input">
          <option v-for="c in companies" :key="c">{{ c }}</option>
        </select></div>

      <div class="row">
        <label class="check"><input type="checkbox"> Remember me</label>
        <NuxtLink to="/forgot-password">Forgot your password?</NuxtLink>
      </div>
      <button class="btn btn-primary full" type="submit">Log in</button>

      <div class="or"><span>or</span></div>
      <button type="button" class="btn btn-ghost full" @click="step = 'otp'"><AppIcon name="shield" /> Sign in with Authentik</button>

      <NuxtLink to="/examination" class="exam"><AppIcon name="doc" :size="15" /> For examination?</NuxtLink>
    </form>

    <form v-else @submit.prevent="navigateTo('/')">
      <span class="eyebrow">Two-factor authentication</span>
      <h2>Verify it's you</h2>
      <p class="sub">Enter the 6-digit code from your authenticator app. (Any code works in this mock.)</p>
      <div class="field"><label for="otp">Enter 6-Digit Code</label>
        <input id="otp" class="input otp" inputmode="numeric" maxlength="6" placeholder="000000" required></div>
      <button class="btn btn-primary full" type="submit">Verify &amp; continue</button>
      <a href="#" class="alt" @click.prevent="step = 'login'">‹ Back to sign in</a>
    </form>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const { companies } = useMockData()
const company = useState('company', () => companies[0])
const empId = ref('')
const show = ref(false)
const step = ref('login')
const signIn = () => { step.value = 'otp' }
</script>

<style scoped>
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
