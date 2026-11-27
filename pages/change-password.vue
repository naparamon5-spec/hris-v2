<template>
  <AuthCard>
    <form v-if="!done" @submit.prevent="save">
      <h2>Change Password</h2>
      <p class="sub">Use at least 8 characters with a mix of letters and numbers. Your other sessions will be signed out.</p>
      <div class="field"><label for="cp-cur">Current password</label><input id="cp-cur" v-model="cur" class="input" type="password" autocomplete="current-password" required></div>
      <div class="field"><label for="cp-new">New password</label><input id="cp-new" v-model="a" class="input" type="password" minlength="8" autocomplete="new-password" required></div>
      <div class="field"><label for="cp-confirm">Confirm new password</label><input id="cp-confirm" v-model="b" class="input" type="password" autocomplete="new-password" required></div>
      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <button class="btn btn-primary full" type="submit" :disabled="busy" :aria-busy="busy">{{ busy ? 'Updating…' : 'Update password' }}</button>
      <NuxtLink to="/profile" class="alt">‹ Back</NuxtLink>
    </form>
    <div v-else>
      <h2>Password updated</h2>
      <p class="sub">Your password was changed.</p>
      <NuxtLink to="/profile" class="btn btn-primary full">Back to profile</NuxtLink>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
// POST /auth/profile/change-password (BACKEND.md §3.3).
const api = useApi()
const cur = ref(''); const a = ref(''); const b = ref(''); const err = ref(''); const busy = ref(false); const done = ref(false)
const save = async () => {
  if (a.value !== b.value) { err.value = 'Passwords do not match.'; return }
  busy.value = true
  err.value = ''
  try {
    await api('/auth/profile/change-password', { method: 'POST', body: { current_password: cur.value, new_password: a.value, confirm_password: b.value } })
    done.value = true
  } catch (e) {
    err.value = apiError(e, 'Unable to change the password.')
  } finally {
    busy.value = false
  }
}
</script>
