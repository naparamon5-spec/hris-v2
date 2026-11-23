<template>
  <AuthCard>
    <form @submit.prevent="done">
      <h2>Reset password</h2>
      <p class="sub">Use at least 8 characters with a mix of letters and numbers.</p>

      <div class="field"><label for="rp-new">New password</label><input id="rp-new" v-model="a" class="input" type="password" minlength="8" required></div>
      <div class="field"><label for="rp-confirm">Confirm new password</label><input id="rp-confirm" v-model="b" class="input" type="password" required></div>
      <p v-if="err" style="color:var(--ardent-alert);font-size:.85rem;margin-top:0">{{ err }}</p>
      <button class="btn btn-primary full" type="submit">Update password</button>
      <NuxtLink to="/login" class="alt">‹ Back</NuxtLink>
    </form>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const a = ref(''); const b = ref(''); const err = ref('')
const done = () => { if (a.value !== b.value) { err.value = 'Passwords do not match.'; return } navigateTo('/login') }
</script>
