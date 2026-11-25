<template>
  <div>
    <div class="card head">
      <div class="photo">
        <button type="button" class="avatar" aria-label="Change profile photo" @click="pickPhoto">
          <img v-if="photo" :src="photo" alt="">
          <template v-else>{{ user.initials }}</template>
          <span class="cam" aria-hidden="true"><AppIcon name="camera" :size="16" /></span>
        </button>
        <input ref="fileBox" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" @change="onFile">
        <button type="button" class="link sm" @click="pickPhoto">{{ photo ? 'Change photo' : 'Upload photo' }}</button>
        <button v-if="photo" type="button" class="link sm muted" @click="removePhoto">Remove</button>
      </div>
      <div class="who">
        <h1>{{ user.name }}</h1>
        <p class="m">{{ user.role }} · {{ user.department }} · {{ user.id }}</p>
        <p class="bio">{{ bio }} <button class="link" @click="openBio">Edit Bio</button></p>
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
      <!-- Clicking anywhere on the row toggles 2FA (same confirm as the switch). -->
      <div class="set" @click="!$event.target.closest('.switch') && toggle2fa()">
        <span class="icon-tile"><AppIcon name="shield" /></span>
        <div><b>Two-Factor Auth (2FA)</b><small class="m">{{ twofa ? '2FA Enabled' : 'Add an extra layer of security' }}</small></div>
        <label class="switch"><input :checked="twofa" type="checkbox" role="switch" aria-label="Two-factor authentication" @click.prevent="toggle2fa"><i /></label>
      </div>
      <div class="set">
        <span class="icon-tile"><AppIcon name="user" /></span>
        <div><b>Biometric Sign-in</b><small class="m">Available on the mobile app</small></div>
        <span class="badge badge-gray">Not Enabled</span>
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
    <PhotoCropModal v-if="cropSrc" :src="cropSrc" @close="cropSrc = ''" @save="savePhoto" />
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
  if (await confirm({ title: 'Log out?', message: 'You will need to sign in again to use HRIS.', confirmText: 'Log out', tone: 'danger', icon: 'logout' })) { useSession().signOut(); navigateTo('/login') }
}
const toast = ref('')
let toastTimer
const flash = (m) => {
  clearTimeout(toastTimer)
  toast.value = m
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}
onBeforeUnmount(() => clearTimeout(toastTimer))
const employment = [['Company', user.company], ['Employee ID', user.id], ['Position', user.role], ['Department', user.department], ['Manager', user.manager], ['Date hired', user.hired]]
const contact = [['Email', user.email], ['Mobile', user.phone]]
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
</style>
