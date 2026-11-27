<template>
  <AuthCard>
    <form v-if="!sent" @submit.prevent="sent = true">
      <h2>For examination</h2>
      <p class="sub">Applicants: enter the email address you used for your application to receive your exam link.</p>
      <div class="field"><label for="e">Email address</label>
        <input id="e" class="input" type="email" placeholder="Enter Email address" required></div>
      <button class="btn btn-primary full" type="submit">Submit</button>
      <NuxtLink to="/login" class="alt">‹ Back to sign in</NuxtLink>
    </form>
    <div v-else>
      <h2>Coming soon</h2>
      <p class="sub">Online examinations are not available yet. Please contact HR for your exam link.</p>
      <NuxtLink to="/login" class="btn btn-ghost full">Back to sign in</NuxtLink>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
// No hris_server endpoint for applicant exam links yet (BACKEND.md §0 #16, G17) — nothing is sent.
const sent = ref(false)
</script>
