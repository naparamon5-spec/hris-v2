<template>
  <div>
    <div class="card head">
      <span class="avatar">{{ user.initials }}</span>
      <div class="who">
        <h1>{{ user.name }}</h1>
        <p class="m">{{ user.role }} · {{ user.department }} · {{ user.id }}</p>
        <p class="bio">{{ bio }} <button class="link" @click="editing = true">Edit Bio</button></p>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in tabs" :key="t" :class="{ on: tab === t }" @click="tab = t">{{ t }}</button>
    </div>

    <div v-if="tab === 'Personal'" class="grid grid-2">
      <div class="card">
        <h3 class="h">Employment</h3>
        <div v-for="[k, v] in employment" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v }}</b></div>
      </div>
      <div class="card">
        <h3 class="h">Contact</h3>
        <div v-for="[k, v] in contact" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v }}</b></div>
      </div>
    </div>

    <div v-else-if="tab === 'Certificates'" class="grid grid-2">
      <div v-for="c in certificates" :key="c.name" class="card cert">
        <span class="icon-tile"><AppIcon name="award" /></span>
        <div class="ci">
          <b>{{ c.name }}</b>
          <small class="m">Level {{ c.level }} · {{ c.earned }} / {{ c.total }} earned</small>
          <div class="track"><div class="fill" :style="{ width: (c.earned / c.total * 100) + '%' }" /></div>
        </div>
        <span class="badge badge-ok">{{ c.status }}</span>
      </div>
      <button class="card upload" @click="flash('File Selected (mock)')"><AppIcon name="plus" /> Upload certificate</button>
    </div>

    <div v-else class="card" style="padding:.25rem 1.25rem">
      <div class="set">
        <span class="icon-tile"><AppIcon name="shield" /></span>
        <div><b>Two-Factor Auth (2FA)</b><small class="m">{{ twofa ? '2FA Enabled' : 'Add an extra layer of security' }}</small></div>
        <label class="switch"><input :checked="twofa" type="checkbox" @click.prevent="toggle2fa"><i /></label>
      </div>
      <div class="set">
        <span class="icon-tile"><AppIcon name="user" /></span>
        <div><b>Biometric Sign-in</b><small class="m">Available on the mobile app</small></div>
        <span class="badge badge-gray">Not Enabled</span>
      </div>
      <div class="set">
        <span class="icon-tile"><AppIcon name="shield" /></span>
        <div><b>Change Password</b><small class="m">Update your account password</small></div>
        <NuxtLink to="/change-password" class="btn btn-ghost btn-sm">Change</NuxtLink>
      </div>
      <NuxtLink to="/privacy-policy" class="set">
        <span class="icon-tile"><AppIcon name="doc" /></span>
        <div><b>Privacy Policy</b></div><AppIcon name="chevron" class="m" />
      </NuxtLink>
      <NuxtLink to="/support" class="set">
        <span class="icon-tile"><AppIcon name="bell" /></span>
        <div><b>Support</b></div><AppIcon name="chevron" class="m" />
      </NuxtLink>
      <button type="button" class="set logout" @click="logOut">
        <span class="icon-tile"><AppIcon name="logout" /></span><div><b>Log out</b></div>
      </button>
    </div>

    <div v-if="editing" class="overlay" @click.self="editing = false">
      <div class="card modal">
        <h2>Edit Bio</h2>
        <textarea v-model="draft" class="input" style="width:100%" placeholder="Write a short bio about yourself…" />
        <div class="foot">
          <button class="btn btn-ghost" @click="editing = false">Cancel</button>
          <button class="btn btn-primary" @click="bio = draft; editing = false; flash('Bio Updated')">Save</button>
        </div>
      </div>
    </div>
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
const { user, certificates } = useMockData()
const tabs = ['Personal', 'Certificates', 'Settings']
const tab = ref('Personal')
const bio = ref(user.bio)
const draft = ref(user.bio)
const editing = ref(false)
const twofa = ref(false)
const { confirm } = useConfirm()
const toggle2fa = async () => {
  const turningOn = !twofa.value
  const ok = await confirm(turningOn
    ? { title: 'Enable two-factor authentication?', message: 'You will need a 6-digit code from your authenticator app each time you sign in.', confirmText: 'Enable 2FA', icon: 'shield' }
    : { title: 'Disable two-factor authentication?', message: 'Your account will be protected by your password only.', confirmText: 'Disable 2FA', tone: 'danger', icon: 'shield' })
  if (!ok) return
  twofa.value = turningOn
  flash(turningOn ? '2FA Enabled' : '2FA Disabled')
}
const logOut = async () => {
  if (await confirm({ title: 'Log out?', message: 'You will need to sign in again to use HRIS.', confirmText: 'Log out', tone: 'danger', icon: 'logout' })) navigateTo('/login')
}
const toast = ref('')
const flash = (m) => { toast.value = m; setTimeout(() => (toast.value = ''), 2000) }
const employment = [['Company', user.company], ['Employee ID', user.id], ['Position', user.role], ['Department', user.department], ['Manager', user.manager], ['Date hired', user.hired]]
const contact = [['Email', user.email], ['Mobile', user.phone]]
</script>

<style scoped>
.head { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
.avatar { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, var(--ardent-red), var(--ardent-coral)); color: #fff; display: grid; place-items: center; font-size: 1.8rem; font-weight: 800; }
.who { flex: 1; min-width: 220px; }
.who h1 { font-size: 1.5rem; }
.who p { margin: .2rem 0; }
.bio { font-size: .9rem; }
.link { background: none; border: 0; color: var(--ardent-red); font: 600 .85rem Montserrat, sans-serif; cursor: pointer; }
.h { font-size: 1rem; margin-bottom: .75rem; }
.kv { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem 0; border-bottom: 1px solid var(--border); font-size: .88rem; }
.kv:last-child { border-bottom: 0; }
.kv b { text-align: right; word-break: break-all; }
.cert { display: flex; align-items: center; gap: 1rem; }
.ci { flex: 1; display: flex; flex-direction: column; gap: .3rem; }
.track { height: 6px; background: #f0f0f2; border-radius: 99px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--ardent-red), var(--ardent-coral)); }
.upload { border: 2px dashed var(--ardent-gray); box-shadow: none; display: flex; align-items: center; justify-content: center; gap: .5rem; font: 600 .9rem Montserrat, sans-serif; color: var(--muted); cursor: pointer; min-height: 90px; }
.set { width: 100%; background: none; border-left: 0; border-right: 0; border-top: 0; font: inherit; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border); color: inherit; }
.set:last-child { border-bottom: 0; }
.set div { flex: 1; display: flex; flex-direction: column; }
.logout b { color: var(--ardent-red); }
.switch input { display: none; }
.switch i { display: block; width: 42px; height: 24px; border-radius: 99px; background: var(--ardent-gray); position: relative; cursor: pointer; transition: background .2s; }
.switch i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s; }
.switch input:checked + i { background: var(--ardent-red); }
.switch input:checked + i::after { left: 21px; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 460px; }
.modal h2 { font-size: 1.2rem; margin-bottom: 1rem; }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
</style>
