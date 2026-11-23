<template>
  <div>
    <div class="page-head"><div><h1>Privacy Policy</h1><p>Placeholder text — replace with the official policy from HR/Legal.</p></div></div>
    <article class="card doc">
      <section v-for="s in sections" :key="s.h">
        <h3>{{ s.h }}</h3>
        <p>{{ s.p }}</p>
      </section>
      <p class="m upd">Last updated: {{ updated }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
const updated = 'November 2026'
const sections = [
  { h: 'Information we collect', p: 'HRIS stores the employment, attendance, leave, payroll and contact information needed to run HR processes for your company.' },
  { h: 'How we use it', p: 'Your data is used to process requests, compute payroll, keep time records and meet legal and regulatory requirements.' },
  { h: 'Who can see it', p: 'Only you, your approvers and authorized HR, payroll and IT personnel can access your records, based on their role.' },
  { h: 'How we protect it', p: 'Access requires sign-in with two-factor authentication, and data is sent over encrypted connections.' },
  { h: 'Your rights', p: 'Under the Data Privacy Act of 2012 (RA 10173) you may ask to access or correct your personal data. Contact HR through the Support page.' }
]
</script>

<style scoped>
.doc { max-width: 820px; padding: 1.75rem 2rem; }
section + section { margin-top: 1.4rem; }
h3 { font-size: 1rem; margin-bottom: .4rem; }
p { margin: 0; line-height: 1.7; font-size: .9rem; }
.upd { margin-top: 1.75rem; font-size: .8rem; }
</style>
