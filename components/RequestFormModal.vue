<template>
  <div class="overlay" @click.self="$emit('close')">
    <form class="card modal" @submit.prevent="submit">
      <h2>{{ title }}</h2>
      <div class="field">
        <label>{{ kind === 'other-requests' ? 'Request Type' : kind === 'leave-of-absence' ? 'Leave Type' : 'Type' }}</label>
        <select v-model="f.type" class="input" required>
          <option value="" disabled>Select…</option>
          <option v-for="s in subtypes" :key="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ kind === 'call-approval' ? 'Call Approval Date' : 'Date' }}</label>
        <input v-model="f.date" class="input" type="date" required>
      </div>
      <div v-if="kind !== 'other-requests'" class="two">
        <div class="field"><label>{{ kind === 'leave-of-absence' ? 'From' : 'Time From' }}</label><input v-model="f.from" class="input" type="time" required></div>
        <div class="field"><label>{{ kind === 'leave-of-absence' ? 'To' : 'Time To' }}</label><input v-model="f.to" class="input" type="time" required></div>
      </div>
      <div v-if="kind !== 'other-requests'" class="field">
        <label>Applied Hours</label>
        <input v-model.number="f.hours" class="input" type="number" min="0" step="0.5">
        <small v-if="kind === 'leave-of-absence'" class="m">Current Remaining: 68 hrs (VL) · 48 hrs (SL)</small>
      </div>
      <div class="field">
        <label>Reason</label>
        <textarea v-model="f.reason" class="input" placeholder="Add a reason for this request…" />
      </div>
      <div class="foot">
        <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary">{{ record ? 'Save' : 'Submit' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { RequestRecord } from '~/composables/useMockData'
const props = defineProps<{ title: string; subtypes: readonly string[]; record: RequestRecord | null; kind: string }>()
const emit = defineEmits<{ close: []; save: [Partial<RequestRecord>] }>()

const to24 = (t?: string) => {
  if (!t) return ''
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return t
  let h = +m[1] % 12; if (m[3].toUpperCase() === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
const to12 = (t: string) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
const r = props.record
const f = reactive({
  type: r?.type ?? '', date: r ? new Date(r.date).toISOString().slice(0, 10) : '',
  from: to24(r?.from), to: to24(r?.to), hours: r?.hours ?? 0, reason: r?.reason ?? ''
})
const submit = () => emit('save', {
  type: f.type, reason: f.reason, hours: f.hours, from: to12(f.from), to: to12(f.to),
  date: new Date(f.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 480px; max-height: 92vh; overflow: auto; padding: 1.5rem; }
.modal h2 { font-size: 1.2rem; margin-bottom: 1.25rem; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.foot { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
</style>
