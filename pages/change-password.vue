<template>
  <AuthCard>
    <form @submit.prevent="done">
      <h2>Change Password</h2>
      <p class="sub">Use at least 8 characters with a mix of letters and numbers.</p>
      <div class="field"><label>Current password</label><input class="input" type="password" required></div>
      <div class="field"><label>New password</label><input v-model="a" class="input" type="password" minlength="8" required></div>
      <div class="field"><label>Confirm new password</label><input v-model="b" class="input" type="password" required></div>
      <p v-if="err" style="color:var(--ardent-alert);font-size:.85rem;margin-top:0">{{ err }}</p>
      <button class="btn btn-primary full" type="submit">Update password</button>
      <NuxtLink to="/profile" class="alt">‹ Back</NuxtLink>
    </form>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const a = ref(''); const b = ref(''); const err = ref('')
const done = () => { if (a.value !== b.value) { err.value = 'Passwords do not match.'; return } navigateTo('/profile') }
</script>
