<template>
  <AuthCard>
    <form v-if="!sent" @submit.prevent="sent = true">
      <h2>Forgot password</h2>
      <p class="sub">We'll email you a link to reset your password.</p>
      <div class="field"><label for="e">Email address</label>
        <input id="e" class="input" type="email" placeholder="name@ardentnetworks.com.ph" required></div>
      <button class="btn btn-primary full" type="submit">Send reset link</button>
      <NuxtLink to="/login" class="alt">‹ Back to sign in</NuxtLink>
    </form>
    <div v-else>
      <h2>Check your email</h2>
      <p class="sub">If the address is registered, a reset link is on its way. (Mock — no email is sent.)</p>
      <NuxtLink to="/reset-password" class="btn btn-primary full">Continue to reset</NuxtLink>
      <NuxtLink to="/login" class="alt">‹ Back to sign in</NuxtLink>
    </div>
  </AuthCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const sent = ref(false)
</script>
