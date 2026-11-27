<template>
  <div>
    <div class="card head">
      <div class="photo">
        <button type="button" class="avatar" aria-label="Change profile photo" @click="pickPhoto">
          <img v-if="photo" :src="photo" alt="">
          <template v-else>{{ me.initials }}</template>
          <span class="cam" aria-hidden="true"><AppIcon name="camera" :size="16" /></span>
        </button>
        <input ref="fileBox" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" @change="onFile">
        <button type="button" class="link sm" @click="pickPhoto">{{ photo ? 'Change photo' : 'Upload photo' }}</button>
        <button v-if="photo" type="button" class="link sm muted" @click="removePhoto">Remove</button>
      </div>
      <div class="who">
        <h1>{{ me.name }}</h1>
        <p class="m">{{ [me.role, me.department, me.id].filter(Boolean).join(' · ') }}</p>
        <p class="bio">{{ bio || 'No bio yet.' }} <button class="link" @click="openBio">Edit Bio</button></p>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in tabs" :key="t" :class="{ on: tab === t }" @click="tab = t">{{ t }}</button>
    </div>

    <!-- Personal: personal details + government IDs -->
    <div v-if="tab === 'Personal'" class="grid grid-2">
      <div class="card">
        <h3 class="h">Personal</h3>
        <div v-for="[k, v] in personal" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v || '—' }}</b></div>
      </div>
      <div class="card">
        <h3 class="h">Government IDs</h3>
        <div v-for="[k, v] in govIds" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v || '—' }}</b></div>
      </div>
    </div>

    <div v-else-if="tab === 'Employment'" class="grid grid-2">
      <div class="card">
        <h3 class="h">Employment</h3>
        <div v-for="[k, v] in employment" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v || '—' }}</b></div>
      </div>
    </div>

    <!-- Contact: own contact details (editable) + emergency contact -->
    <div v-else-if="tab === 'Contact'" class="grid grid-2">
      <div class="card">
        <h3 class="h">Contact <button class="link sm edit" @click="openEdit">Edit</button></h3>
        <div v-for="[k, v] in contact" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v || '—' }}</b></div>
      </div>
      <div class="card">
        <h3 class="h">Emergency contact</h3>
        <template v-if="bg?.emergency_contact?.name">
          <div class="kv"><span class="m">Name</span><b>{{ bg.emergency_contact.name }}</b></div>
          <div class="kv"><span class="m">Relationship</span><b>{{ bg.emergency_contact.relationship || '—' }}</b></div>
          <div class="kv"><span class="m">Phone</span><b>{{ bg.emergency_contact.phone || '—' }}</b></div>
        </template>
        <p v-else class="m">No emergency contact on record.</p>
      </div>
    </div>

    <div v-else-if="tab === 'MDR'" class="grid grid-2">
      <div class="card">
        <h3 class="h">PhilHealth MDR <span v-if="mdr?.status" class="badge badge-ok">{{ mdr.status }}</span></h3>
        <template v-if="mdr?.items">
          <div v-for="(v, k) in mdr.items" :key="k" class="kv"><span class="m">{{ k }}</span><b>{{ v || '—' }}</b></div>
        </template>
        <p v-else class="m">No MDR on record.</p>
      </div>
    </div>

    <div v-else-if="tab === 'Certificates'" class="grid grid-2">
      <p v-if="!certificates.length" class="state">No certificates on record.</p>
      <div v-for="c in certificates" :key="c.level + c.name" class="card cert">
        <span class="icon-tile"><AppIcon name="award" /></span>
        <div class="ci">
          <b>{{ c.name }}</b>
          <small class="m">Level {{ c.level }} · {{ c.earned }} / {{ c.total }} earned</small>
          <div class="track"><div class="fill" :style="{ width: (c.earned / c.total * 100) + '%' }" /></div>
        </div>
        <span class="badge" :class="c.status === 'Active' ? 'badge-ok' : 'badge-gray'">{{ c.status }}</span>
      </div>
      <!-- No upload API (BACKEND.md §0 #5, G5) — same message as the mobile app. -->
      <button class="card upload" @click="flash('Certificate uploads are finalized by HR on the web portal')"><AppIcon name="plus" /> Upload certificate</button>
    </div>

    <div v-else class="card" style="padding:.25rem 1.25rem">
      <!-- Clicking anywhere on the row toggles 2FA (same confirm as the switch). -->
      <div class="set" @click="!$event.target.closest('.switch') && toggle2fa()">
        <span class="icon-tile"><AppIcon name="shield" /></span>
        <div>
          <b>Two-Factor Auth (2FA)</b>
          <small class="m">{{ twofa ? '2FA Enabled' : 'Add an extra layer of security' }}</small>
          <small class="m note">{{ twofa
            ? 'A 6-digit code is required each time you sign in with your password, on the website and the mobile app. Biometric sign-in on your phone skips the code.'
            : 'When on, a 6-digit code is required each time you sign in with your password, on the website and the mobile app. Biometric sign-in on your phone skips the code.' }}</small>
        </div>
        <label class="switch"><input :checked="twofa" type="checkbox" role="switch" aria-label="Two-factor authentication" @click.prevent="toggle2fa"><i /></label>
      </div>
      <div class="set">
        <span class="icon-tile"><AppIcon name="user" /></span>
        <!-- Read-only: biometrics is turned on/off in the ANI HRIS app (GET /auth/biometric/status). -->
        <div><b>Biometric Sign-in</b><small class="m">{{ bioNote }}</small></div>
        <span class="badge" :class="biometric.enabled ? 'badge-ok' : 'badge-gray'">{{ !biometric.loaded ? '…' : biometric.failed ? 'Unknown' : biometric.enabled ? 'Enabled' : 'Not Enabled' }}</span>
      </div>
      <!-- Whole row opens Change Password, not just the button. -->
      <NuxtLink to="/change-password" class="set">
        <span class="icon-tile"><AppIcon name="shield" /></span>
        <div><b>Change Password</b><small class="m">Update your account password</small></div>
        <span class="btn btn-ghost btn-sm" aria-hidden="true">Change</span>
      </NuxtLink>
      <button type="button" class="set logout" @click="logOut">
        <span class="icon-tile"><AppIcon name="logout" /></span><div><b>Log out</b></div>
      </button>
    </div>

    <!-- On <body>, so the dim background also covers the sticky header. -->
    <Teleport to="body">
    <div v-if="editing" class="overlay" @keydown.esc="editing = false">
      <div class="card modal">
        <DialogClose @click="editing = false" />
        <h2>Edit Bio</h2>
        <textarea ref="bioBox" v-model="draft" class="input" aria-label="Bio" style="width:100%" maxlength="200" placeholder="Write a short bio about yourself…" />
        <small class="m">{{ draft.length }}/200</small>
        <div class="foot">
          <button class="btn btn-ghost" @click="editing = false">Cancel</button>
          <button class="btn btn-primary" :disabled="!draft.trim()" @click="saveBio">Save</button>
        </div>
      </div>
    </div>
    </Teleport>
    <!-- 2FA: setup → add the key to an authenticator app → confirm a code. Turning off asks for a code. -->
    <Teleport to="body">
    <div v-if="tfa.open" class="overlay" @keydown.esc="tfa.open = false">
      <form class="card modal" @submit.prevent="confirm2fa">
        <DialogClose @click="tfa.open = false" />
        <h2>{{ tfa.mode === 'on' ? 'Turn on two-factor authentication' : 'Turn off two-factor authentication' }}</h2>
        <template v-if="tfa.mode === 'on'">
          <p class="m">Add this account to your authenticator app (Google Authenticator, Microsoft Authenticator…) using the setup key, then enter the 6-digit code it shows.</p>
          <div class="kv"><span class="m">Account</span><b>{{ tfa.account }}</b></div>
          <div class="kv"><span class="m">Setup key</span><b class="mono">{{ tfa.secret }}</b></div>
          <p class="m small">On a phone with an authenticator app, you can also <a :href="tfa.url">open the setup link</a>.</p>
        </template>
        <p v-else class="m">Enter the 6-digit code from your authenticator app to turn 2FA off.</p>
        <input v-model="tfa.code" class="input otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" aria-label="6-digit code" style="width:100%" @input="tfa.code = tfa.code.replace(/\D/g, '').slice(0, 6)">
        <p v-if="tfa.err" class="err">{{ tfa.err }}</p>
        <div class="foot">
          <button type="button" class="btn btn-ghost" @click="tfa.open = false">Cancel</button>
          <button type="submit" class="btn" :class="tfa.mode === 'on' ? 'btn-primary' : 'btn-danger'" :disabled="tfa.code.length !== 6 || tfa.busy">{{ tfa.mode === 'on' ? 'Turn on' : 'Turn off' }}</button>
        </div>
      </form>
    </div>
    </Teleport>
    <!-- Edit personal info: PUT /auth/profile/background (email change needs the password). -->
    <Teleport to="body">
    <div v-if="edit.open" class="overlay" @keydown.esc="edit.open = false">
      <form class="card modal" @submit.prevent="saveEdit">
        <DialogClose @click="edit.open = false" />
        <h2>Edit personal info</h2>
        <div v-for="fld in EDIT_FIELDS" :key="fld.key" class="field">
          <label :for="'ed-' + fld.key">{{ fld.label }}</label>
          <input :id="'ed-' + fld.key" v-model="edit.f[fld.key]" class="input" :type="fld.type || 'text'" style="width:100%">
        </div>
        <div v-if="edit.f.email !== edit.orig.email" class="field">
          <label for="ed-pw">Current password (needed to change your email)</label>
          <input id="ed-pw" v-model="edit.password" class="input" type="password" autocomplete="current-password" style="width:100%" required>
        </div>
        <p v-if="edit.err" class="err">{{ edit.err }}</p>
        <div class="foot">
          <button type="button" class="btn btn-ghost" @click="edit.open = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="edit.busy">{{ edit.busy ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>
    </Teleport>
    <PhotoCropModal v-if="cropSrc" :src="cropSrc" @close="cropSrc = ''" @save="savePhoto" />
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
// GET /auth/profile (session), /auth/profile/background, /auth/profile/mdr,
// /auth/profile/certificates, /auth/2fa/* (BACKEND.md §5).
const api = useApi()
const me = useMe()
const session = useSession()
const tabs = ['Personal', 'Employment', 'Contact', 'MDR', 'Certificates', 'Settings']
const tab = ref('Personal')
const { data: bgRes, refresh: refreshBg } = await useAsyncData('profile-bg', () => api('/auth/profile/background').catch(() => null), { server: false })
const bg = computed(() => bgRes.value || null)
const { data: mdr } = await useAsyncData('profile-mdr', () => api('/auth/profile/mdr').catch(() => null), { server: false })
const { data: certRes } = await useAsyncData('profile-certs', () => api('/auth/profile/certificates').catch(() => null), { server: false })
const certificates = computed(() => (certRes.value?.levels || []).flatMap(l => l.items.map(c => ({
  name: c.name, level: l.level,
  earned: l.items.filter(x => x.active).length, total: l.items.length || 1,
  status: c.active ? 'Active' : 'Not uploaded'
}))))
// Bio: no server field yet (BACKEND.md §0 #3, G3) — UI only, like the mobile app.
const bio = ref('')
const draft = ref('')
const editing = ref(false)
const bioBox = ref(null)
// Always start from the saved bio, so cancelled edits don't come back.
const openBio = () => {
  draft.value = bio.value
  editing.value = true
  nextTick(() => bioBox.value?.focus())
}
const saveBio = () => {
  bio.value = draft.value.trim()
  editing.value = false
  flash('Bio Updated')
}
// ---- Profile photo upload (same flow as hris_mobile edit_profile_photo.dart) ----
// No hris_server endpoint yet, so the photo is kept in this browser (header uses it too).
const { photo, setPhoto } = useProfilePhoto()
const fileBox = ref(null)
const cropSrc = ref('')
const pickPhoto = () => fileBox.value?.click()
const onFile = (e) => {
  const f = e.target.files?.[0]
  e.target.value = '' // allow picking the same file again
  if (!f) return
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return flash('Please choose a JPG, PNG or WebP image')
  if (f.size > 5 * 1024 * 1024) return flash('Image is too large (max 5 MB)')
  const r = new FileReader()
  r.onload = () => { cropSrc.value = r.result }
  r.readAsDataURL(f)
}
const savePhoto = (dataUrl) => { setPhoto(dataUrl); cropSrc.value = ''; flash('Photo Updated') }
const removePhoto = async () => {
  if (await confirm({ title: 'Remove profile photo?', message: 'Your initials will be shown instead.', confirmText: 'Remove', tone: 'danger', icon: 'user' })) {
    setPhoto(''); flash('Photo Removed')
  }
}
const twofa = ref(false)
onMounted(async () => { try { twofa.value = !!(await api('/auth/2fa/status')).enabled } catch { /* stays off */ } })
// Biometric sign-in lives on the phone; the website only shows whether it's on.
const biometric = reactive({ loaded: false, failed: false, enabled: false, devices: 0, lastUsed: null })
onMounted(async () => {
  try {
    const r = await api('/auth/biometric/status')
    Object.assign(biometric, { enabled: !!r.enabled, devices: r.devices || 0, lastUsed: r.last_used || null })
  } catch (e) {
    // Don't guess "Not Enabled" when the server couldn't answer (e.g. it isn't updated yet).
    biometric.failed = true
    console.warn('GET /auth/biometric/status failed:', e?.statusCode || e?.status, e?.data?.message || e?.message)
  }
  biometric.loaded = true
})
const bioNote = computed(() => {
  if (biometric.failed) return "Couldn't check right now — the server may need updating"
  if (!biometric.enabled) return 'Turn it on in the ANI HRIS mobile app'
  const phones = biometric.devices > 1 ? `On ${biometric.devices} phones` : 'On in the ANI HRIS app'
  return biometric.lastUsed ? `${phones} · last used ${fmtDate(biometric.lastUsed)}` : phones
})
const { confirm } = useConfirm()
const tfa = reactive({ open: false, mode: 'on', secret: '', url: '', account: '', code: '', err: '', busy: false })
const toggle2fa = async () => {
  tfa.code = ''
  tfa.err = ''
  if (twofa.value) { tfa.mode = 'off'; tfa.open = true; return }
  try {
    const r = await api('/auth/2fa/setup', { method: 'POST' })
    Object.assign(tfa, { mode: 'on', secret: r.secret, url: r.otpauth_url, account: r.account || me.value.id, open: true })
  } catch (e) {
    flash(apiError(e, 'Unable to start 2FA setup.'))
  }
}
const confirm2fa = async () => {
  tfa.busy = true
  tfa.err = ''
  try {
    const r = await api(`/auth/2fa/${tfa.mode === 'on' ? 'verify' : 'disable'}`, { method: 'POST', body: { code: tfa.code } })
    twofa.value = !!r.enabled
    tfa.open = false
    flash(r.message || (twofa.value ? '2FA Enabled' : '2FA Disabled'))
  } catch (e) {
    tfa.err = apiError(e, 'Invalid code.')
  } finally {
    tfa.busy = false
  }
}
const logOut = async () => {
  if (await confirm({ title: 'Log out?', message: 'You will need to sign in again to use HRIS.', confirmText: 'Log out', tone: 'danger', icon: 'logout' })) { await session.signOut(); navigateTo('/login') }
}

// Edit personal info (PUT /auth/profile/background).
const EDIT_FIELDS = [
  { key: 'nickname', label: 'Nickname' }, { key: 'mobile', label: 'Mobile', type: 'tel' },
  { key: 'telephone', label: 'Telephone', type: 'tel' }, { key: 'email', label: 'Email', type: 'email' },
  { key: 'address', label: 'Address' }, { key: 'birthplace', label: 'Birthplace' },
  { key: 'civil_status', label: 'Civil status' }, { key: 'religion', label: 'Religion' }
]
const edit = reactive({ open: false, f: {}, orig: {}, password: '', err: '', busy: false })
const openEdit = () => {
  const pi = bg.value?.personal_info || {}
  const vals = Object.fromEntries(EDIT_FIELDS.map(x => [x.key, pi[x.key] || '']))
  Object.assign(edit, { open: true, f: { ...vals }, orig: vals, password: '', err: '' })
}
const saveEdit = async () => {
  edit.busy = true
  edit.err = ''
  const changed = Object.fromEntries(EDIT_FIELDS.map(x => x.key).filter(k => edit.f[k] !== edit.orig[k]).map(k => [k, edit.f[k]]))
  if (!Object.keys(changed).length) { edit.open = false; edit.busy = false; return }
  if ('email' in changed) changed.current_password = edit.password
  try {
    const r = await api('/auth/profile/background', { method: 'PUT', body: changed })
    edit.open = false
    flash(r.message || 'Personal information updated')
    await refreshBg()
    session.profile.value = await api('/auth/profile').catch(() => session.profile.value)
  } catch (e) {
    edit.err = apiError(e, 'Unable to save your changes.')
  } finally {
    edit.busy = false
  }
}
const toast = ref('')
let toastTimer
const flash = (m) => {
  clearTimeout(toastTimer)
  toast.value = m
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}
onBeforeUnmount(() => clearTimeout(toastTimer))
// Manager is not returned by /auth/profile yet (BACKEND.md §0 #4, G4).
const employment = computed(() => [
  ['Company', me.value.company], ['Employee ID', me.value.id], ['Position', me.value.role],
  ['Department', me.value.department], ['Manager', me.value.manager || '—'], ['Date hired', me.value.hired],
  ...(me.value.yearsOfService != null ? [['Years of service', String(me.value.yearsOfService)]] : [])
])
const pi = computed(() => bg.value?.personal_info || {})
const contact = computed(() => [
  ['Email', pi.value.email || me.value.email], ['Mobile', pi.value.mobile || me.value.phone],
  ['Telephone', pi.value.telephone], ['Address', pi.value.address || me.value.background.address]
])
const personal = computed(() => [
  ['Full name', pi.value.full_name], ['Nickname', pi.value.nickname], ['Gender', pi.value.gender],
  ['Civil status', pi.value.civil_status || me.value.background.civil_status],
  ['Birth date', fmtDate(pi.value.birth_date || me.value.background.date_of_birth)],
  ['Birthplace', pi.value.birthplace], ['Religion', pi.value.religion]
])
const govIds = computed(() => {
  const b = me.value.background
  return [['SSS', b.sss], ['PhilHealth', b.philhealth], ['TIN', b.tin], ['Pag-IBIG', b.pagibig], ["Driver's license", b.drivers_license]]
})
</script>

<style scoped>
.head { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
.avatar { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, var(--ardent-red), var(--ardent-coral)); color: #fff; display: grid; place-items: center; font-size: 1.8rem; font-weight: 800; position: relative; border: 0; padding: 0; cursor: pointer; font-family: inherit; }
.avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.photo { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
.cam { position: absolute; right: 0; bottom: 0; width: 30px; height: 30px; border-radius: 50%; background: var(--ardent-navy); color: #fff; display: grid; place-items: center; border: 3px solid #fff; }
.avatar:hover .cam, .avatar:focus-visible .cam { background: var(--ardent-red); }
.avatar:focus-visible { outline: none; box-shadow: var(--ring); }
.link.sm { font-size: .75rem; }
.link.muted { color: var(--muted); }
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
a.set { text-decoration: none; }
.set:hover b { color: var(--ardent-red); }
.set div { flex: 1; display: flex; flex-direction: column; }
.logout b { color: var(--ardent-red); }
.switch input { display: none; }
.switch i { display: block; width: 42px; height: 24px; border-radius: 99px; background: var(--ardent-gray); position: relative; cursor: pointer; transition: background .2s; }
.switch i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s; }
.switch input:checked + i { background: var(--ardent-red); }
.switch input:checked + i::after { left: 21px; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; grid-template-columns: minmax(0, 1fr); overflow-y: auto; overscroll-behavior: contain; place-items: center; z-index: 50; padding: 1rem; }
.modal { position: relative; width: 100%; max-width: 460px; }
.modal h2 { padding-right: 2.25rem; font-size: 1.2rem; margin-bottom: 1rem; }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
.h .edit { float: right; font-size: .75rem; }
.mono { font-family: ui-monospace, Menlo, monospace; word-break: break-all; }
.small { font-size: .78rem; }
.set .note { font-size: .74rem; line-height: 1.35; margin-top: .2rem; }
</style>
