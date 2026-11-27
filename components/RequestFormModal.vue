<template>
  <!-- On <body>, so the dim background also covers the sticky header. -->
  <Teleport to="body">
  <div class="overlay">
    <form class="card modal" @submit.prevent="submit(true)">
      <DialogClose @click="$emit('close')" />
      <h2>{{ title }}</h2>

      <!-- ===== Leave of Absence: leave type + date/time range ===== -->
      <template v-if="kind === 'leave-of-absence'">
        <div class="field">
          <label for="rf-type">Leave Type</label>
          <AppSelect id="rf-type" v-model="f.leaveType" :options="LEAVE_TYPES" placeholder="Select…" full />
          <small v-if="remaining" class="m">Current Remaining: {{ remaining }}</small>
        </div>
        <div class="two">
          <div class="field"><label for="rf-from">From</label><input id="rf-from" v-model="f.dateFrom" class="input" type="datetime-local" required></div>
          <div class="field"><label for="rf-to">To</label><input id="rf-to" v-model="f.dateTo" class="input" type="datetime-local" required></div>
        </div>
        <small class="m hint">Hours are computed by the server. Up to 45 days back.</small>
      </template>

      <!-- ===== Call Approval: one date, one or more time rows ===== -->
      <template v-else-if="kind === 'call-approval'">
        <div class="field"><label for="rf-date">Call Approval Date</label><input id="rf-date" v-model="f.date" class="input" type="date" required></div>
        <div v-for="(row, i) in f.rows" :key="i" class="ca-row">
          <div class="ca-head">
            <b>Detail {{ i + 1 }}</b>
            <button v-if="f.rows.length > 1" type="button" class="btn btn-ghost btn-sm" @click="f.rows.splice(i, 1)">Remove</button>
          </div>
          <div class="two">
            <div class="field"><label :for="`rf-tf-${i}`">Time From</label><input :id="`rf-tf-${i}`" v-model="row.from" class="input" type="time" required></div>
            <div class="field"><label :for="`rf-tt-${i}`">Time To</label><input :id="`rf-tt-${i}`" v-model="row.to" class="input" type="time" required></div>
          </div>
          <div class="field"><label :for="`rf-cu-${i}`">Customer</label>
            <input :id="`rf-cu-${i}`" v-model="row.customer" class="input" maxlength="200" placeholder="Customer or client name" required></div>
          <div class="field"><label :for="`rf-pu-${i}`">Purpose</label>
            <textarea :id="`rf-pu-${i}`" v-model="row.purpose" class="input" maxlength="200" placeholder="What is the call or visit for?" required />
            <small class="m count">{{ row.purpose.length }}/200</small></div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm add-row" @click="f.rows.push(blankRow())"><AppIcon name="plus" :size="14" /> Add detail</button>
      </template>

      <!-- ===== Manual Arrival/Departure & Overtime: date + times ===== -->
      <template v-else-if="kind === 'manual-arrival-departure' || kind === 'overtime'">
        <div class="field"><label for="rf-date">Date</label><input id="rf-date" v-model="f.date" class="input" type="date" required></div>
        <div class="two">
          <div class="field"><label for="rf-from">{{ kind === 'overtime' ? 'Time From' : 'Arrival' }}</label><input id="rf-from" v-model="f.timeFrom" class="input" type="time" required></div>
          <div class="field"><label for="rf-to">{{ kind === 'overtime' ? 'Time To' : 'Departure' }}</label><input id="rf-to" v-model="f.timeTo" class="input" type="time" required></div>
        </div>
        <small v-if="kind === 'overtime'" class="m hint">Overtime may end at 12:00 AM (next day).</small>
      </template>

      <!-- ===== Other Requests (Versatech): fields per request type ===== -->
      <template v-else-if="kind === 'other-requests'">
        <div class="field">
          <label for="rf-otype">Request Type</label>
          <AppSelect id="rf-otype" v-model="f.otherType" :options="otherOptions" placeholder="Select…" full />
        </div>
        <template v-if="f.otherType === 'ID'">
          <div class="field"><label for="o-ec">Emergency Contact Name</label><input id="o-ec" v-model="f.o.emergency_contact_name" class="input" required></div>
          <div class="field"><label for="o-rel">Relationship with Employee</label><input id="o-rel" v-model="f.o.relationship" class="input" required></div>
          <div class="two">
            <div class="field"><label for="o-cn">Contact Number</label><input id="o-cn" v-model="f.o.contact_number" class="input" type="tel" required></div>
            <div class="field"><label for="o-em">Email</label><input id="o-em" v-model="f.o.email" class="input" type="email"></div>
          </div>
          <div class="field"><label for="o-ad">Address</label><textarea id="o-ad" v-model="f.o.address" class="input" required /></div>
        </template>
        <div v-if="f.otherType === 'COE'" class="field radios">
          <label v-for="c in ['Without Compensation', 'With Compensation']" :key="c" class="check"><input v-model="f.o.compensation" type="radio" :value="c"> {{ c }}</label>
        </div>
        <template v-if="f.otherType === 'COL'">
          <div class="field radios">
            <label v-for="t in ['5', '10']" :key="t" class="check"><input v-model="f.o.terms" type="radio" :value="t"> {{ t }} Months</label>
          </div>
          <div class="field"><label for="o-la">Loan Amount</label><input id="o-la" v-model="f.o.loan_amount" class="input" type="number" min="1" step="0.01" required></div>
        </template>
        <template v-if="f.otherType === 'BUP'">
          <div class="field"><label for="o-mo">Choose Month</label><AppSelect id="o-mo" v-model="f.o.month" :options="MONTHS" full /></div>
          <div class="field radios">
            <label v-for="p in ['PREMIUM', 'ELITE']" :key="p" class="check"><input v-model="f.o.plan" type="radio" :value="p" @change="f.o.benefit_upgrade = ''"> {{ p }}</label>
          </div>
          <div class="field"><label for="o-bu">Choose your benefit upgrade</label>
            <AppSelect id="o-bu" v-model="f.o.benefit_upgrade" :options="f.o.plan === 'ELITE' ? BUP_ELITE : BUP_PREMIUM" placeholder="Select…" full /></div>
        </template>
        <template v-if="f.otherType === 'EPP'">
          <div class="field radios">
            <label v-for="t in ['Cash', 'Charge']" :key="t" class="check"><input v-model="f.o.epp_type" type="radio" :value="t"> {{ t }}</label>
          </div>
          <template v-if="f.o.epp_type === 'Cash'">
            <div v-for="(it, i) in f.o.items" :key="i" class="ca-row">
              <div class="ca-head"><b>Item {{ i + 1 }}</b>
                <button v-if="f.o.items.length > 1" type="button" class="btn btn-ghost btn-sm" @click="f.o.items.splice(i, 1)">Remove</button></div>
              <div class="field"><label :for="`e-it-${i}`">Item Description</label><input :id="`e-it-${i}`" v-model="it.item" class="input" required></div>
              <div class="two">
                <div class="field"><label :for="`e-q-${i}`">Quantity</label><input :id="`e-q-${i}`" v-model.number="it.qty" class="input" type="number" min="1" required></div>
                <div class="field"><label :for="`e-u-${i}`">Unit Price</label><input :id="`e-u-${i}`" v-model.number="it.uprice" class="input" type="number" min="0.01" step="0.01" required></div>
              </div>
              <small class="m">Amount: {{ peso((it.qty || 0) * (it.uprice || 0)) }}</small>
            </div>
            <button type="button" class="btn btn-ghost btn-sm add-row" @click="f.o.items.push({ item: '', qty: 1, uprice: null })"><AppIcon name="plus" :size="14" /> Add item</button>
          </template>
          <template v-if="f.o.epp_type === 'Charge'">
            <div class="field radios">
              <label v-for="t in ['3', '6', '9', '12']" :key="t" class="check"><input v-model="f.o.charge_terms" type="radio" :value="t"> {{ t }} Months</label>
            </div>
            <div class="field"><label for="e-ci">Item Description</label><input id="e-ci" v-model="f.o.item" class="input" required></div>
            <div class="field"><label for="e-ca">Amount</label><input id="e-ca" v-model="f.o.amt" class="input" type="number" min="1" step="0.01" required></div>
          </template>
        </template>
      </template>

      <!-- Reason: everything except Call Approval (per-row Purpose), BUP and EPP. -->
      <div v-if="needsReason" class="field">
        <label for="rf-reason">Reason</label>
        <textarea id="rf-reason" v-model="f.reason" class="input" :maxlength="maxLen" :required="reasonRequired" :placeholder="reasonHint" />
        <small class="m count">{{ f.reason.length }}/{{ maxLen }}</small>
      </div>

      <p v-if="err" class="err" role="alert">{{ err }}</p>
      <div class="foot">
        <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="busy" :aria-busy="busy">{{ busy ? 'Saving…' : 'Submit' }}</button>
      </div>
    </form>
  </div>
  </Teleport>
</template>

<script setup>
import { peso, LEAVE_TYPES } from '~/utils/format'
// Builds the hris_server create/edit body per request type (docs/BACKEND.md §7.4).
// Submit = save + send for approval (no Save as draft button).
const props = defineProps({ title: String, record: { type: Object, default: null }, kind: String, busy: Boolean })
const emit = defineEmits(['close', 'save'])

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const BUP_PREMIUM = ['Medicine Allowance', 'Rice Allowance', 'Grocery Reimbursement', 'Cash']
const BUP_ELITE = [...BUP_PREMIUM,
  'Additional 5 days vacation leave valid for 1year only',
  'Enroll 1 dependent HMO (subject for approval of provider)',
  'Education/Training/Certification Reimbursement']
const otherOptions = Object.entries(OTHER_TYPES).map(([value, label]) => ({ value, label }))

const raw = props.record?.raw || null
const blankRow = () => ({ from: '', to: '', customer: '', purpose: '' })
const f = reactive({
  // LOA
  leaveType: raw?.leave_type || '',
  dateFrom: raw?.date_from ? `${isoDay(raw.date_from)}T${isoClock(raw.date_from)}` : '',
  dateTo: raw?.date_to ? `${isoDay(raw.date_to)}T${isoClock(raw.date_to)}` : '',
  // CA / MAD / OT
  date: raw ? isoDay(raw.date_from || (raw.rows && raw.rows[0]?.date_from)) : '',
  rows: raw?.rows?.length
    ? raw.rows.map(x => ({ from: isoClock(x.date_from), to: isoClock(x.date_to), customer: x.customer || '', purpose: x.purpose || '' }))
    : [blankRow()],
  timeFrom: raw?.time_from || '',
  timeTo: raw?.time_to || '',
  reason: raw?.reason || '',
  // Other Requests
  otherType: '',
  o: {
    emergency_contact_name: '', relationship: '', contact_number: '', email: '', address: '',
    compensation: 'Without Compensation', terms: '5', loan_amount: '',
    month: 'January', plan: 'PREMIUM', benefit_upgrade: '',
    epp_type: '', items: [{ item: '', qty: 1, uprice: null }], charge_terms: '3', item: '', amt: ''
  }
})

const needsReason = computed(() => props.kind !== 'call-approval' &&
  !(props.kind === 'other-requests' && (!f.otherType || f.otherType === 'BUP' || f.otherType === 'EPP')))
const reasonRequired = computed(() => props.kind !== 'other-requests' || ['ID', 'COE', 'ITR'].includes(f.otherType))
// hris_server limits: LOA / MAD / OT reason ≤ 75, Other Requests ≤ 150.
const maxLen = computed(() => (props.kind === 'other-requests' ? 150 : 75))
const reasonHint = computed(() => ({
  ID: 'Please specify i.e. lost, change of name, etc.',
  COE: 'Please specify i.e. loan application, visa application, etc.',
  COL: 'Please specify i.e. medical emergency, death of immediate family, etc.'
})[f.otherType] || 'Add a reason for this request…')

// LOA: show the remaining hours for the chosen leave type (GET /auth/leaves/hours).
const api = useApi()
const hours = ref(null)
if (props.kind === 'leave-of-absence') api('/auth/leaves/hours').then(r => { hours.value = r }).catch(() => {})
const remaining = computed(() => {
  const h = hours.value
  if (!h) return ''
  const key = { 'Vacation Leave': 'vl_paid', 'Sick Leave': 'sl_paid', 'Additional VL': 'additional_vl', 'Accumulated Leave': 'accumulated_leave' }[f.leaveType]
  return key && h[key] != null ? `${h[key]} hrs` : ''
})

const err = ref('')
const body = () => {
  const reason = f.reason.trim()
  switch (props.kind) {
    case 'leave-of-absence':
      if (!f.leaveType) throw new Error('Please choose a leave type.')
      return { leave_type: f.leaveType, date_from: f.dateFrom.replace('T', ' '), date_to: f.dateTo.replace('T', ' '), reason }
    case 'call-approval':
      return {
        txn_date: f.date,
        rows: f.rows.map(x => ({
          time_from: `${f.date} ${x.from}`, time_to: `${f.date} ${x.to}`,
          customer: x.customer.trim(), purpose: x.purpose.trim()
        }))
      }
    case 'manual-arrival-departure':
    case 'overtime':
      return { txn_date: f.date, time_from: f.timeFrom, time_to: f.timeTo, reason }
    case 'other-requests': {
      const t = f.otherType
      if (!t) throw new Error('Please choose a request type.')
      const o = f.o
      const b = { request_type: t.toLowerCase(), reason }
      if (t === 'ID') Object.assign(b, { emergency_contact_name: o.emergency_contact_name, relationship: o.relationship, contact_number: o.contact_number, email: o.email, address: o.address })
      if (t === 'COE') b.compensation = o.compensation
      if (t === 'COL') Object.assign(b, { terms: o.terms, loan_amount: o.loan_amount })
      if (t === 'BUP') {
        if (!o.benefit_upgrade) throw new Error('Please choose your benefit upgrade.')
        Object.assign(b, { month: o.month, plan: o.plan, benefit_upgrade: o.benefit_upgrade })
      }
      if (t === 'EPP') {
        if (!o.epp_type) throw new Error('Please choose Cash or Charge.')
        b.epp_type = o.epp_type.toLowerCase()
        if (o.epp_type === 'Cash') b.items = o.items.map(it => ({ item: it.item, qty: it.qty, uprice: it.uprice, amt: (it.qty || 0) * (it.uprice || 0) }))
        else Object.assign(b, { terms: o.charge_terms, item: o.item, amt: o.amt })
      }
      return b
    }
  }
  return {}
}
const submit = (sendNow) => {
  err.value = ''
  try {
    emit('save', { body: body(), sendNow })
  } catch (e) {
    err.value = e.message
  }
}
</script>

<style scoped>
.err { color: var(--ardent-red); font-size: .8rem; }
.count { display: block; text-align: right; font-size: .72rem; margin-top: .2rem; }
.hint { display: block; margin: -.4rem 0 .9rem; font-size: .75rem; }
.overlay { position: fixed; inset: 0; background: rgba(19,51,65,.45); display: grid; grid-template-columns: minmax(0, 1fr); overflow-y: auto; overscroll-behavior: contain; place-items: center; z-index: 50; padding: 1rem; }
.modal { position: relative; width: 100%; max-width: 520px; max-height: 92vh; overflow: auto; padding: 1.5rem; }
.modal h2 { padding-right: 2.25rem; font-size: 1.2rem; margin-bottom: 1.25rem; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .75rem; }
.modal .input { width: 100%; min-width: 0; box-sizing: border-box; }
.ca-row { border: 1px solid var(--border); border-radius: 12px; padding: .75rem .85rem .25rem; margin-bottom: .75rem; }
.ca-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; font-size: .85rem; }
.add-row { margin-bottom: 1rem; }
.radios { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; }
.foot { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
@media (max-width: 480px) { .two { grid-template-columns: 1fr; } }
</style>
