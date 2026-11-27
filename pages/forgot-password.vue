<template>
  <AuthCard>
    <form v-if="!sent" @submit.prevent="send">
      <h2>Forgot password</h2>
      <p class="sub">We'll email you a link to reset your password.</p>
      <div class="field"><label>Company</label>
        <p class="co">{{ company?.name || 'No company selected' }} · <NuxtLink to="/company-select">Change</NuxtLink></p></div>
      <div class="field"><label for="e">Employee ID or email</label>
        <input id="e" v-model="identifier" class="input" placeholder="AN-0142 or name@ardentnetworks.com.ph" autocomplete="username" required></div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <button class="btn btn-primary full" type="submit" :disabled="busy || !company" :aria-busy="busy">{{ busy ? 'Sending…' : 'Send reset link' }}</button>
      <NuxtLink to="/login" class="alt">‹ Back to sign in</NuxtLink>
    </form>
    <div v-else>
      <h2>Check your email</h2>
      <p class="sub">{{ message }}</p>
      <NuxtLink to="/login" class="btn btn-primary full">Back to sign in</NuxtLink>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
// POST /public/forgot-password { identifier, tenant } (BACKEND.md §3.3).
const { company, load } = useCompany()
onMounted(load)
const api = useApi()
const identifier = ref('')
const sent = ref(false)
const busy = ref(false)
const err = ref('')
const message = ref('')
const send = async () => {
  busy.value = true
  err.value = ''
  try {
    const r = await api('/public/forgot-password', { method: 'POST', body: { identifier: identifier.value.trim(), tenant: company.value.id } })
    message.value = r.message || 'If an account matches, reset instructions have been emailed.'
    sent.value = true
  } catch (e) {
    err.value = apiError(e, 'Unable to send the reset link.')
  } finally {
    busy.value = false
  }
}
</script>
