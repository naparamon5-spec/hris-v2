<template>
  <div>
    <div class="page-head"><div><h1>Support</h1><p>Need help with HRIS? Reach the right team below.</p></div></div>

    <div class="grid grid-3">
      <div v-for="c in contacts" :key="c.title" class="card contact">
        <span class="icon-tile"><AppIcon :name="c.icon" /></span>
        <b>{{ c.title }}</b>
        <small class="m">{{ c.desc }}</small>
        <span class="val">{{ c.value }}</span>
      </div>
    </div>

    <h3 class="section-title">Send a ticket</h3>
    <form class="card ticket" @submit.prevent="send">
      <div class="two">
        <div class="field"><label for="sp-cat">Category</label>
          <AppSelect id="sp-cat" v-model="cat" :options="['Account & login', 'Leave & requests', 'Timesheet', 'Payroll & payslip', 'Other']" full /></div>
        <div class="field"><label for="sp-subject">Subject</label><input id="sp-subject" v-model="subject" class="input" placeholder="Short summary" required></div>
      </div>
      <div class="field"><label for="sp-details">Details</label><textarea id="sp-details" v-model="body" class="input" placeholder="Describe the issue…" required /></div>
      <div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">Submit ticket</button></div>
    </form>

    <h3 class="section-title">FAQ</h3>
    <div class="card faq">
      <details v-for="f in faq" :key="f.q"><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
const contacts = [
  { title: 'HR Helpdesk', desc: 'Leave, records and employment concerns', value: 'Local 502', icon: 'people' },
  { title: 'Payroll', desc: 'Payslip and salary questions', value: 'Local 410', icon: 'wallet' },
  { title: 'IT Support', desc: 'Login, 2FA and system issues', value: 'Local 214', icon: 'shield' }
]
const faq = [
  { q: 'I forgot my password. What do I do?', a: 'Use "Forgot your password?" on the login page, or contact IT Support to reset it.' },
  { q: 'How do I cancel a filed request?', a: 'Open the request list, find the record that is still For Approval, and click Cancel.' },
  { q: 'When are payslips released?', a: 'Payslips are released on the 15th and the last day of each month.' },
  { q: 'I lost access to my authenticator app.', a: 'Contact IT Support so they can reset your two-factor authentication.' }
]
const cat = ref('Account & login')
const subject = ref('')
const body = ref('')
const toast = ref('')
const send = () => {
  subject.value = ''; body.value = ''
  toast.value = 'Ticket submitted (mock)'
  setTimeout(() => (toast.value = ''), 2200)
}
</script>

<style scoped>
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.contact { display: flex; flex-direction: column; gap: .3rem; }
.contact .icon-tile { margin-bottom: .4rem; }
.contact small { font-size: .8rem; }
.val { margin-top: .4rem; font-weight: 700; color: var(--ardent-red); font-size: .9rem; }
.ticket { max-width: 820px; }
.two { display: grid; grid-template-columns: 1fr 2fr; gap: .75rem; }
@media (max-width: 640px) { .two { grid-template-columns: 1fr; } }
.faq { max-width: 820px; padding: .4rem 1.35rem; }
details { border-bottom: 1px solid var(--border); padding: .9rem 0; }
details:last-child { border-bottom: 0; }
summary { cursor: pointer; font-weight: 600; font-size: .9rem; }
summary::marker { color: var(--ardent-red); }
details p { margin: .6rem 0 0; color: var(--muted); font-size: .88rem; }
</style>
