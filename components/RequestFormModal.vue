<template>
  <div class="overlay" @click.self="$emit('close')">
    <form class="card modal" @submit.prevent="submit">
      <h2>{{ title }}</h2>
      <div class="field">
        <label for="rf-type">{{ kind === 'other-requests' ? 'Request Type' : kind === 'leave-of-absence' ? 'Leave Type' : 'Type' }}</label>
        <AppSelect id="rf-type" v-model="f.type" :options="subtypes" placeholder="Select…" full />
        <small v-if="typeErr && !f.type" class="err">Please choose one.</small>
      </div>
      <div class="field">
        <label for="rf-date">{{ kind === 'call-approval' ? 'Call Approval Date' : 'Date' }}</label>
        <input id="rf-date" v-model="f.date" class="input" type="date" required>
      </div>
      <div v-if="kind !== 'other-requests'" class="two">
        <div class="field"><label for="rf-from">{{ kind === 'leave-of-absence' ? 'From' : 'Time From' }}</label><input id="rf-from" v-model="f.from" class="input" type="time" required></div>
        <div class="field"><label for="rf-to">{{ kind === 'leave-of-absence' ? 'To' : 'Time To' }}</label><input id="rf-to" v-model="f.to" class="input" type="time" required></div>
      </div>
      <div v-if="kind !== 'other-requests'" class="field">
        <label for="rf-hours">Applied Hours</label>
        <input id="rf-hours" v-model.number="f.hours" class="input" type="number" min="0" step="0.5">
        <small v-if="kind === 'leave-of-absence'" class="m">Current Remaining: 68 hrs (VL) · 48 hrs (SL)</small>
      </div>
      <!-- Same wording as hris_mobile: Call Approval asks for Customer + Purpose, the rest for a Reason. -->
      <div v-if="kind === 'call-approval'" class="field">
        <label for="rf-customer">Customer</label>
        <input id="rf-customer" v-model="f.customer" class="input" maxlength="200" placeholder="Customer or client name" required>
      </div>
      <div class="field">
        <label for="rf-reason">{{ isCa ? 'Purpose' : 'Reason' }}</label>
        <textarea
          id="rf-reason" v-model="f.reason" class="input" :maxlength="maxLen" required
          :placeholder="isCa ? 'What is the call or visit for?' : 'Add a reason for this request…'"
        />
        <small class="m count">{{ f.reason.length }}/{{ maxLen }}</small>
      </div>
      <div class="foot">
        <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary">{{ record ? 'Save' : 'Submit' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({ title: String, subtypes: { type: Array, default: () => [] }, record: { type: Object, default: null }, kind: String })
const emit = defineEmits(['close', 'save'])

const to24 = (t) => {
  if (!t) return ''
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return t
  let h = +m[1] % 12; if (m[3].toUpperCase() === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
const to12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
// Local date as YYYY-MM-DD (toISOString() would shift the day in UTC+8).
const toIsoDate = (label) => {
  const d = new Date(label)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const r = props.record
// hris_server limits: CA customer/purpose ≤ 200, MAD/OT reason ≤ 75, Other Requests reason ≤ 150.
const isCa = computed(() => props.kind === 'call-approval')
const maxLen = computed(() => ({ 'call-approval': 200, 'manual-arrival-departure': 75, overtime: 75, 'other-requests': 150 })[props.kind] ?? 200)
const f = reactive({
  type: r?.type ?? '', date: r ? toIsoDate(r.date) : '',
  from: to24(r?.from), to: to24(r?.to), hours: r?.hours ?? 0, reason: r?.reason ?? '', customer: r?.customer ?? ''
})
const typeErr = ref(false)
const submit = () => (!f.type && props.subtypes.length ? (typeErr.value = true) : emit('save', {
  type: f.type, reason: f.reason.trim(), ...(isCa.value ? { customer: f.customer.trim() } : {}), hours: f.hours, from: to12(f.from), to: to12(f.to),
  date: new Date(f.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}))
</script>

<style scoped>
.err { color: var(--ardent-red); font-size: .75rem; }
.count { display: block; text-align: right; font-size: .72rem; margin-top: .2rem; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 480px; max-height: 92vh; overflow: auto; padding: 1.5rem; }
.modal h2 { font-size: 1.2rem; margin-bottom: 1.25rem; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
</style>
