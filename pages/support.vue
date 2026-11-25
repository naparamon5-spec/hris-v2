<template>
  <div>
    <div class="page-head">
      <div>
        <span class="eyebrow">Employee self-service HR · Support &amp; Help</span>
        <h1>ANI HRIS — Support</h1>
        <p class="lede">
          Need help with ANI HRIS? This page explains how to get support and answers the most common questions.
          ANI HRIS is for employees of Ardent Networks, Inc. and its member companies; you must have a valid
          company account to sign in.
        </p>
      </div>
    </div>

    <div class="layout">
      <div class="col">
        <section class="card">
          <h2>Contact Support</h2>
          <dl class="contact">
            <div><dt><AppIcon name="bell" :size="16" /> Email</dt><dd><a :href="`mailto:${email}`">{{ email }}</a></dd></div>
            <div><dt><AppIcon name="external" :size="16" /> Website</dt><dd><a :href="site" target="_blank" rel="noopener">{{ site }}</a></dd></div>
            <div><dt><AppIcon name="clock" :size="16" /> Hours</dt><dd>Monday to Friday, 8:00 AM – 5:00 PM (PHT)</dd></div>
          </dl>
          <p class="note">
            For account or employment-record concerns (e.g., leave balances, payslips, government IDs), please also
            contact your HR department.
          </p>
        </section>

        <section class="card">
          <h2>Requirements</h2>
          <ul class="ticks">
            <li>A valid company-issued employee account.</li>
            <li>iOS 15 or later.</li>
            <li>An internet connection.</li>
          </ul>
        </section>

        <section class="card">
          <h2>Reporting a Problem</h2>
          <p>
            If you encounter a bug or issue, email
            <a :href="`mailto:${email}?subject=ANI%20HRIS%20Issue%20Report`">{{ email }}</a>
            with your Employee ID, company, device model, iOS version, and a short description (screenshots help).
            We’ll get back to you during support hours.
          </p>
          <p class="see">See also our <NuxtLink :to="privacyLink">Privacy Policy</NuxtLink>.</p>
        </section>
      </div>

      <section class="card faq">
        <h2>Frequently Asked Questions</h2>
        <details v-for="(f, i) in faq" :key="f.q" :open="i === 0">
          <summary>{{ f.q }}</summary>
          <p>{{ f.a }}</p>
        </details>
      </section>
    </div>
  </div>
</template>

<script setup>
// Public page: anyone can open it, signed in or not (same as the mobile app's support URL).
// Always a full page of its own (no sidebar).
definePageMeta({ layout: 'doc' })
const privacyLink = '/privacy-policy'

const email = 'support@ardentnetworks.com.ph'
const site = 'https://ardentnetworks.com.ph'
const faq = [
  { q: 'How do I sign in?', a: 'On the first screen, select your company, then enter your Employee ID and password. If your company isn’t shown, tap “Switch company.”' },
  { q: 'I forgot my password.', a: 'On the login screen, tap “Forgot your password?”, enter your Employee ID or email, and we’ll send reset instructions to your registered email. Your company is pre-selected and cannot be changed on that screen.' },
  { q: 'How do I enable biometric or Face ID login?', a: 'After signing in once, open Profile → Settings and enable Biometric Login. You can also enable two-factor authentication (2FA) there for added security.' },
  { q: 'I’m not receiving notifications.', a: 'Make sure you allowed notifications when prompted. You can re-enable them in your device Settings → Notifications → ANI HRIS. Notifications cover approvals and request updates.' },
  { q: 'Why is my company’s data or logo different?', a: 'ANI HRIS serves multiple companies. After you select your company and sign in, the app shows that company’s branding and your own records.' },
  { q: 'My payslip / leave balance looks wrong.', a: 'Payroll and leave records come from your employer’s HR system. If something looks incorrect, contact your HR department using the details above.' }
]
</script>

<style scoped>
.eyebrow { display: block; font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ardent-red); font-weight: 700; margin-bottom: .35rem; }
.lede { max-width: 62rem; line-height: 1.6; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 1rem; align-items: start; }
@media (max-width: 1000px) { .layout { grid-template-columns: minmax(0, 1fr); } }
.col { display: flex; flex-direction: column; gap: 1rem; }
h2 { font-size: 1rem; margin-bottom: .75rem; }
.card p { margin: 0; font-size: .88rem; line-height: 1.65; }
.contact { margin: 0; display: flex; flex-direction: column; gap: .55rem; }
.contact > div { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: .75rem; align-items: baseline; font-size: .88rem; }
.contact dt { display: flex; align-items: center; gap: .45rem; color: var(--muted); font-weight: 600; font-size: .8rem; }
.contact dt :deep(svg) { color: var(--ardent-red); flex: none; }
.contact dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
@media (max-width: 480px) { .contact > div { grid-template-columns: minmax(0, 1fr); gap: .1rem; } }
.note { margin-top: .9rem !important; padding: .7rem .85rem; border-radius: 12px; background: #fff7ec; color: #8a4a07; font-size: .82rem !important; }
.ticks { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: .45rem; font-size: .88rem; }
.ticks li { position: relative; padding-left: 1.5rem; }
.ticks li::before { content: ''; position: absolute; left: .2rem; top: .45em; width: .55rem; height: .3rem; border-left: 2px solid #18794e; border-bottom: 2px solid #18794e; transform: rotate(-45deg); }
.see { margin-top: .75rem !important; color: var(--muted); }
.faq { padding-bottom: .5rem; }
details { border-top: 1px solid var(--border); padding: .8rem 0; }
summary { cursor: pointer; font-weight: 600; font-size: .9rem; }
summary::marker { color: var(--ardent-red); }
details p { margin: .5rem 0 0 !important; color: var(--muted); }
</style>
