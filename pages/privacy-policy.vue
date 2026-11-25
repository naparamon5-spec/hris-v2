<template>
  <div>
    <div class="page-head">
      <div>
        <h1>ANI HRIS — Privacy Policy</h1>
        <p>Effective date: September 21, 2026</p>
      </div>
    </div>

    <article class="card doc">
      <p class="intro">
        This Privacy Policy explains how Ardent Networks, Inc. and its affiliated companies (the “Company,” “we,” “us”)
        handle information in the ANI HRIS mobile application (the “App”). ANI HRIS is an internal employee self-service
        application. It is intended solely for employees of the Company and its member companies, and a valid company
        account is required to use it.
      </p>

      <nav class="toc" aria-label="Contents">
        <a v-for="(s, i) in toc" :key="s" :href="`#pp-${i + 1}`">{{ i + 1 }}. {{ s }}</a>
      </nav>

      <section id="pp-1">
        <h2>1. Information We Collect</h2>
        <p>We collect only the information needed to provide employee self-service features. All data is linked to your employee account.</p>
        <h3>Account and identifiers</h3>
        <ul>
          <li>Employee ID (used to sign in).</li>
          <li>Name and job/position details shown in your profile and dashboard.</li>
          <li>Email address (used for password-reset instructions).</li>
          <li>Device identifier and push-notification token (to deliver notifications to your device).</li>
        </ul>
        <h3>Employment and payroll information</h3>
        <ul>
          <li>Payslip and related compensation information that you view in the App.</li>
          <li>Attendance, timesheet, leave, overtime, and request records.</li>
        </ul>
        <h3>Government identifiers</h3>
        <ul>
          <li>Government numbers held by your employer and displayed to you in the App, such as SSS, TIN, PhilHealth, and Pag-IBIG numbers.</li>
        </ul>
        <h3>Location</h3>
        <ul>
          <li>Precise location (latitude/longitude) captured only at the moment you clock in or out for attendance. The App does not track your location in the background.</li>
        </ul>
      </section>

      <section id="pp-2">
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To authenticate you and secure your account.</li>
          <li>To provide HR self-service features: attendance, leave and other requests, approvals, payslips, timesheets, directory, and profile.</li>
          <li>To record attendance location when you clock in or out.</li>
          <li>To send you notifications about approvals and request updates.</li>
        </ul>
        <p>We use your information only to operate the App’s features. We do not use it for advertising.</p>
      </section>

      <section id="pp-3">
        <h2>3. Tracking and Advertising</h2>
        <p>We do not track you across other companies’ apps or websites, and we do not sell or share your information with data brokers or advertisers. The App contains no third-party advertising.</p>
      </section>

      <section id="pp-4">
        <h2>4. How Information Is Shared</h2>
        <ul>
          <li>Within the Company and your employer for legitimate human-resources and payroll purposes.</li>
          <li>With service providers that operate the App on our behalf — for example, Google Firebase Cloud Messaging, which processes your device push token to deliver notifications.</li>
          <li>When required by law or to protect the rights, safety, and security of the Company and its employees.</li>
        </ul>
      </section>

      <section id="pp-5">
        <h2>5. Data Security</h2>
        <ul>
          <li>Sign-in is protected and supports biometric login (Face ID / Touch ID) and optional two-factor authentication (2FA).</li>
          <li>Data is transmitted over encrypted (HTTPS) connections.</li>
          <li>Access is scoped to your own company and account.</li>
        </ul>
      </section>

      <section id="pp-6">
        <h2>6. Data Retention</h2>
        <p>Employment and HR records are retained by your employer in accordance with company policy and applicable law. Device push tokens are removed when you sign out or when they become invalid.</p>
      </section>

      <section id="pp-7">
        <h2>7. Your Rights</h2>
        <p>You may review much of your information directly in the App. To correct or update employment records, or to make a data-privacy request, please contact your HR department or use the support details below.</p>
      </section>

      <section id="pp-8">
        <h2>8. Children’s Privacy</h2>
        <p>The App is intended for Company employees and is not directed to children under the age required to be an employee. We do not knowingly collect information from children.</p>
      </section>

      <section id="pp-9">
        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the effective date above.</p>
      </section>

      <section id="pp-10">
        <h2>10. Contact Us</h2>
        <dl class="contact">
          <div><dt>Company</dt><dd>Ardent Networks, Inc.</dd></div>
          <div><dt>Email</dt><dd><a href="mailto:support@ardentnetworks.com.ph">support@ardentnetworks.com.ph</a></dd></div>
          <div><dt>Website</dt><dd><a href="https://ardentnetworks.com.ph" target="_blank" rel="noopener">https://ardentnetworks.com.ph</a></dd></div>
        </dl>
        <p class="see">Need help? Visit <NuxtLink :to="supportLink">Support</NuxtLink>.</p>
      </section>
    </article>
  </div>
</template>

<script setup>
// Public page: anyone can open it, signed in or not (same as the mobile app's privacy URL).
// Always a full page of its own (no sidebar).
definePageMeta({ layout: 'doc' })
const supportLink = '/support'
const toc = ['Information We Collect', 'How We Use Your Information', 'Tracking and Advertising', 'How Information Is Shared', 'Data Security', 'Data Retention', 'Your Rights', 'Children’s Privacy', 'Changes to This Policy', 'Contact Us']
</script>

<style scoped>
.doc { max-width: 900px; padding: 1.75rem 2rem 2rem; }
@media (max-width: 640px) { .doc { padding: 1.25rem 1.1rem 1.5rem; } }
.intro { font-size: .92rem; }
p, li { line-height: 1.7; font-size: .88rem; }
p { margin: .5rem 0 0; }
.intro { margin: 0; }
.toc { display: flex; flex-wrap: wrap; gap: .35rem; margin: 1.25rem 0 .5rem; padding: .9rem 1rem; background: #f8f9fa; border-radius: 12px; }
.toc a { font-size: .76rem; font-weight: 600; padding: .25rem .6rem; border-radius: 999px; background: #fff; border: 1px solid var(--border); color: var(--text); }
.toc a:hover { border-color: var(--ardent-red); color: var(--ardent-red); }
section { padding-top: 1.4rem; scroll-margin-top: 5rem; }
h2 { font-size: 1.02rem; }
h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 1rem 0 .2rem; }
ul { margin: .4rem 0 0; padding-left: 1.2rem; }
li::marker { color: var(--ardent-red); }
.contact { margin: .6rem 0 0; display: flex; flex-direction: column; gap: .4rem; font-size: .88rem; }
.contact > div { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: .75rem; }
.contact dt { color: var(--muted); font-weight: 600; }
.contact dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.see { color: var(--muted); margin-top: 1rem; }
</style>
