<template>
  <AuthCard>
    <form v-if="!done" @submit.prevent="save">
      <h2>Reset password</h2>
      <p class="sub">Use at least 8 characters with a mix of letters and numbers.</p>
      <p v-if="!token" class="err">This reset link is incomplete. Open the link from your email again, or request a new one.</p>
      <div class="field"><label for="rp-new">New password</label><input id="rp-new" v-model="a" class="input" type="password" minlength="8" autocomplete="new-password" required></div>
      <div class="field"><label for="rp-confirm">Confirm new password</label><input id="rp-confirm" v-model="b" class="input" type="password" autocomplete="new-password" required></div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <button class="btn btn-primary full" type="submit" :disabled="busy || !token" :aria-busy="busy">{{ busy ? 'Updating…' : 'Update password' }}</button>
      <NuxtLink to="/forgot-password" class="alt">‹ Request a new link</NuxtLink>
    </form>
    <div v-else>
      <h2>Password updated</h2>
      <p class="sub">You can now sign in with your new password.</p>
      <NuxtLink to="/login" class="btn btn-primary full">Sign in</NuxtLink>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
// The email link is <site>/reset-password?token=…&tenant=… (BACKEND.md §3.3).
const route = useRoute()
const token = computed(() => String(route.query.token || ''))
const tenant = computed(() => String(route.query.tenant || ''))
const api = useApi()
const a = ref(''); const b = ref(''); const err = ref(''); const busy = ref(false); const done = ref(false)
const save = async () => {
  if (a.value !== b.value) { err.value = 'Passwords do not match.'; return }
  busy.value = true
  err.value = ''
  try {
    await api('/public/reset-password', { method: 'POST', body: { token: token.value, tenant: tenant.value, new_password: a.value, confirm_password: b.value } })
    done.value = true
  } catch (e) {
    err.value = apiError(e, 'Unable to reset the password.')
  } finally {
    busy.value = false
  }
}
</script>
