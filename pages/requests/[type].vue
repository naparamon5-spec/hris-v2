<template>
  <div v-if="meta">
    <NuxtLink to="/requests" class="back">‹ Back</NuxtLink>
    <div class="page-head">
      <div><h1>{{ meta.title }}</h1><p>{{ meta.desc }}</p></div>
      <button class="btn btn-primary" @click="openForm()"><AppIcon name="plus" /> Create</button>
    </div>

    <div class="toolbar">
      <input v-model="q" class="input" type="search" aria-label="Search requests" placeholder="Search by No., Type, Reason, Approver…">
      <FilterMenu v-model="extra" :fields="filterFields" />
    </div>

    <div ref="tableCard" class="card table-wrap no-x" style="padding:.5rem">
      <table class="table stack">
        <colgroup>
          <col class="c-pick"><col class="c-no"><col v-if="showType" class="c-type"><col class="c-date"><col class="c-hrs">
          <col class="c-why"><col class="c-appr"><col class="c-stat"><col class="c-act">
        </colgroup>
        <thead><tr>
          <th class="pick">
            <input
              ref="allBox" type="checkbox" :checked="allChecked" :disabled="!pickable.length"
              :aria-label="allChecked ? 'Deselect all' : `Select all pending (${pickable.length})`"
              :title="pickable.length ? 'Select all pending requests' : 'No pending requests to select'" @change="toggleAll"
            >
          </th>
          <th>No.</th><th v-if="showType">Type</th><th>Date</th><th>Hours</th><th>{{ reasonLabel }}</th><th>Approver</th><th>Status</th><th><span class="sr-only">Actions</span></th>
        </tr></thead>
        <tbody>
          <tr
            v-for="r in pageRows" :key="r.id"
            class="can" :class="{ picked: selected.includes(r.id) }" @click="openDetail(r, $event)"
          >
            <td class="pick" @click.stop="canPick(r) && toggle(r.id, $event)">
              <input v-if="canPick(r)" v-model="selected" type="checkbox" :value="r.id" :aria-label="`Select ${r.no}`" @click.stop>
            </td>
            <td data-label="No." :title="`Filed ${r.dateFiled}`"><b>{{ r.no }}</b></td>
            <td v-if="showType" data-label="Type" :title="r.type">{{ r.type }}</td>
            <td data-label="Date" class="date" :title="r.date">{{ fmtDate(r.date) }}</td>
            <td data-label="Hours">{{ r.hours || '—' }}</td>
            <td :data-label="reasonLabel" class="why">
              <span :title="r.reason">{{ r.reason || '—' }}</span>
              <small v-if="r.customer" class="m">{{ r.customer }}</small>
            </td>
            <td data-label="Approver" class="appr" :title="r.approver">{{ r.approver }}</td>
            <td data-label="Status"><span class="badge" :class="'badge-' + badge(r.status)">{{ r.status }}</span></td>
            <td class="acts">
              <!-- One ⋮ button per row; the menu lists only the actions this status allows. -->
              <button
                v-if="actionsFor(r).length" type="button" class="kebab" :class="{ on: menu?.id === r.id }"
                :disabled="busy" :aria-label="`Actions for ${r.no}`" aria-haspopup="menu" :aria-expanded="menu?.id === r.id"
                @click.stop="toggleMenu(r, $event)"
              ><AppIcon name="more" :size="18" /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="pending" class="empty">Loading…</p>
      <p v-else-if="loadError" class="empty">{{ loadError }} <a href="#" @click.prevent="refresh()">Try again</a></p>
      <p v-else-if="!rows.length" class="empty">No requests found</p>
    </div>
    <Pager v-model:page="page" :pages="pages" :total="total" :size="size" :class="{ 'bar-space': selected.length }" />

    <!-- Bulk actions: tick pending requests (or Select all) and cancel them in one go. -->
    <Transition name="bar">
      <div v-if="selected.length" class="action-bar" role="toolbar" aria-label="Bulk actions">
        <div class="ab-count"><b>{{ selected.length }}</b><span>selected</span></div>
        <div class="ab-btns">
          <button class="btn btn-sm ab-ghost" @click="selected = []">Clear</button>
          <button class="btn btn-sm btn-primary" @click="cancelSelected">Cancel {{ selected.length }}</button>
        </div>
      </div>
    </Transition>

    <Teleport to="body">
      <ul v-if="menu" class="row-menu" role="menu" :style="{ top: menu.y + 'px', left: menu.x + 'px' }" @click.stop>
        <li v-for="a in actionsFor(menu.row)" :key="a.key">
          <button type="button" role="menuitem" :class="{ danger: a.danger }" :disabled="busy" @click="runAction(menu.row, a.key)">{{ a.label }}</button>
        </li>
      </ul>

      <!-- Request details: opens when a row is clicked. -->
      <Transition name="dt">
        <div v-if="detail" class="dt-overlay" @click.self="detail = null">
          <div class="dt-card" role="dialog" aria-modal="true" :aria-label="`${meta.title} ${detail.no}`">
            <header class="dt-head">
              <div>
                <small class="m">{{ meta.title }}</small>
                <h2>{{ detail.no }}</h2>
              </div>
              <span class="badge" :class="'badge-' + badge(detail.status)">{{ detail.status }}</span>
              <button type="button" class="dt-x" aria-label="Close" @click="detail = null">×</button>
            </header>

            <dl class="dt-grid">
              <template v-for="f in detailFields(detail)" :key="f.label">
                <div :class="{ wide: f.wide }"><dt>{{ f.label }}</dt><dd>{{ f.value }}</dd></div>
              </template>
            </dl>

            <!-- Call Approval: one line per customer visit -->
            <div v-if="detailLines(detail).length" class="dt-lines">
              <h3>Details</h3>
              <div v-for="(l, i) in detailLines(detail)" :key="i" class="dt-line">
                <b>{{ l.time }}</b>
                <span v-if="l.customer"><small class="m">Customer</small> {{ l.customer }}</span>
                <span v-if="l.purpose"><small class="m">Purpose</small> {{ l.purpose }}</span>
              </div>
            </div>

            <footer v-if="actionsFor(detail).length" class="dt-foot">
              <button
                v-for="a in actionsFor(detail)" :key="a.key" type="button" class="btn btn-sm"
                :class="a.danger ? 'btn-danger' : a.key === 'send' ? 'btn-primary' : 'btn-ghost'"
                :disabled="busy" @click="runDetailAction(a.key)"
              >{{ a.label }}</button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>

    <RequestFormModal v-if="formOpen" :title="(editing ? 'Edit ' : 'New ') + meta.title" :record="editing" :kind="type" :busy="busy" @close="closeForm" @save="save" />
    <Toast :msg="toast" />
  </div>
</template>

<script setup>
import { badge, fmtDate, clock12, isoClock } from '~/utils/format'
// My requests of one type (BACKEND.md §7): GET/POST /auth/requests/:type, GET/PUT /:id,
// POST /:id/send|resend|cancel|reverse. Create saves a draft (Active); Send submits it.
const route = useRoute()
const type = computed(() => route.params.type)
// Same wording as hris_mobile: Call Approval shows Purpose (+ customer), the rest Reason.
const reasonLabel = computed(() => (type.value === 'call-approval' ? 'Purpose' : 'Reason'))
const meta = computed(() => requestTypes[type.value])

// Unknown request type (e.g. /requests/foo): show the 404 page instead of a blank screen.
if (!meta.value) {
  throw createError({ statusCode: 404, statusMessage: 'Request type not found', fatal: true })
}

const api = useApi()
const apiType = computed(() => meta.value.apiType)
// The server has no edit for Other Requests ("Edit not available for this type").
const canEdit = computed(() => apiType.value !== 'other')
const isPendingStatus = (s) => s === 'For Approval' || s === 'For Witness Approval'
// Call Approval / MAD / OT have no type — hide the column when no row has one.
const showType = computed(() => rows.value.some(r => r.type))

// Row actions, by status (BACKEND.md §7.2): Active = draft → Send / Edit / Cancel;
// For Approval → Resend; Approved → Cancel / Reverse; Cancelled / Disapproved → Reverse.
const actionsFor = (r) => [
  r.status === 'Active' && { key: 'send', label: 'Send' },
  r.status === 'Active' && canEdit.value && { key: 'edit', label: 'Edit' },
  isPendingStatus(r.status) && { key: 'resend', label: 'Resend' },
  ['Approved', 'Cancelled', 'Disapproved'].includes(r.status) && { key: 'reverse', label: 'Reverse' },
  (r.status === 'Active' || r.status === 'Approved') && { key: 'cancel', label: 'Cancel', danger: true }
].filter(Boolean)
const menu = ref(null) // { id, row, x, y }
const MENU_W = 160
const toggleMenu = (r, e) => {
  if (menu.value?.id === r.id) { menu.value = null; return }
  const b = e.currentTarget.getBoundingClientRect()
  const h = actionsFor(r).length * 38 + 12
  const below = b.bottom + 6 + h <= window.innerHeight
  menu.value = {
    id: r.id, row: r,
    x: Math.max(8, b.right - MENU_W),
    y: below ? b.bottom + 6 : Math.max(8, b.top - 6 - h)
  }
}
const closeMenu = () => { menu.value = null }
const runAction = (r, key) => {
  closeMenu()
  if (key === 'edit') openForm(r)
  else act(r, key)
}
const onKey = (e) => { if (e.key === 'Escape') { closeMenu(); detail.value = null } }

// ---- Row details modal ----
const detail = ref(null)
const openDetail = (r, e) => {
  if (e.target.closest('button, a, input')) return
  closeMenu()
  detail.value = r
}
const runDetailAction = (key) => {
  const r = detail.value
  detail.value = null
  runAction(r, key)
}
const dash = (v) => (v == null || v === '' ? '—' : v)
const detailFields = (r) => {
  const x = r.raw || {}
  const ca = type.value === 'call-approval'
  const ot = type.value === 'overtime'
  return [
    r.type && { label: 'Type', value: r.type },
    { label: 'Date filed', value: dash(r.dateFiled) },
    { label: 'Date', value: dash(r.date) },
    (x.from_display || x.to_display) && { label: 'From', value: dash(x.from_display) },
    (x.from_display || x.to_display) && { label: 'To', value: dash(x.to_display) },
    { label: ot ? 'Applied hours' : 'Hours', value: dash(x.applied_hours || r.hours) },
    ot && { label: 'Approved hours', value: dash(x.approved_hours && x.approved_hours !== '0:00' ? x.approved_hours : '') },
    { label: 'Approver', value: dash(x.approved_by) },
    x.approved_date && { label: 'Date approved', value: x.approved_date },
    x.witnessed_by && { label: 'Witness', value: x.witnessed_by },
    !ca && { label: reasonLabel.value, value: dash(r.reason), wide: true },
    ca && !(x.rows || []).length && { label: 'Purpose', value: dash(r.reason), wide: true }
  ].filter(Boolean)
}
const detailLines = (r) =>
  (Array.isArray(r.raw?.rows) ? r.raw.rows : []).map(l => {
    const a = clock12(isoClock(l.date_from)), b = clock12(isoClock(l.date_to))
    return { time: a || b ? [a, b].filter(Boolean).join(' – ') : '—', customer: l.customer, purpose: l.purpose }
  })
onMounted(() => {
  document.addEventListener('click', closeMenu)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', closeMenu, true)
  window.addEventListener('resize', closeMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', closeMenu, true)
  window.removeEventListener('resize', closeMenu)
})

const { data: source, pending, error: fetchError, refresh } = await useAsyncData(
  () => `requests-${apiType.value}`,
  () => api(`/auth/requests/${apiType.value}`).then(r => (r.data || []).map(toRequestRow)),
  { default: () => [], server: false, watch: [apiType] }
)
const loadError = computed(() => (fetchError.value ? apiError(fetchError.value, 'Unable to load requests.') : ''))

const q = ref('')
const filters = ['All', 'Active', 'For Approval', 'Approved', 'Posted', 'Disapproved', 'Cancelled']
// Switching request type starts unfiltered.
const blankExtra = () => ({ status: '', type: '', approver: '', dateFrom: '', dateTo: '', filedFrom: '', filedTo: '' })
const extra = ref(blankExtra())
watch(type, () => { q.value = ''; extra.value = blankExtra() })
// Header search links here with ?q=<request no.>.
watch(() => route.query.q, v => { if (v) q.value = String(v) }, { immediate: true })
const toast = ref('')
let toastTimer
const flash = (m) => {
  clearTimeout(toastTimer)
  toast.value = m
  toastTimer = setTimeout(() => (toast.value = ''), 2600)
}
onBeforeUnmount(() => clearTimeout(toastTimer))

// Filters menu: status, type, approver, request date and filed date.
const filterFields = computed(() => [
  { key: 'status', label: 'Status', options: filters.slice(1) },
  { key: 'type', label: 'Type', options: uniq(source.value, r => r.type) },
  { key: 'approver', label: 'Approver', options: uniq(source.value.filter(r => r.approver !== '—'), r => r.approver) },
  { key: 'date', label: 'Request date', type: 'date-range' },
  { key: 'filed', label: 'Date filed', type: 'date-range' }
])
const rows = computed(() => {
  const f = extra.value
  return newestFirst(source.value.filter(r =>
    (!f.status || r.status === f.status) &&
    (!f.type || r.type === f.type) &&
    (!f.approver || r.approver === f.approver) &&
    inDateRange(r.date, f.dateFrom, f.dateTo) &&
    inDateRange(r.dateFiled, f.filedFrom, f.filedTo) &&
    `${r.no} ${r.type} ${r.approver} ${r.reason || ''} ${r.customer || ''}`.toLowerCase().includes(q.value.toLowerCase())), r => r.dateFiled, r => r.no)
})

const formOpen = ref(false)
const editing = ref(null)
const busy = ref(false)
// Edit opens the full record (GET /auth/requests/:type/:id) so every field is filled in.
const openForm = async (r = null) => {
  if (!r) { editing.value = null; formOpen.value = true; return }
  busy.value = true
  try {
    const full = await api(`/auth/requests/${apiType.value}/${r.id}`)
    editing.value = { ...r, raw: full.data || full }
    formOpen.value = true
  } catch (e) {
    flash(apiError(e, 'Unable to open this record.'))
  } finally {
    busy.value = false
  }
}
const closeForm = () => { formOpen.value = false; editing.value = null }
const { confirm } = useConfirm()

const ACTIONS = {
  send: { title: 'Send for approval?', msg: 'will be sent to your approver.', ok: 'Send', done: 'Sent for Approval', tone: 'primary', icon: 'check' },
  resend: { title: 'Resend to your approver?', msg: 'will be sent to your approver again.', ok: 'Resend', done: 'Resent', tone: 'primary', icon: 'bell' },
  cancel: { title: 'Cancel this request?', msg: "will be cancelled. You can reverse it later.", ok: 'Yes, cancel it', done: 'Record Cancelled', tone: 'danger', icon: 'doc' },
  reverse: { title: 'Reverse this record?', msg: 'goes back to Active (draft) so you can edit and send it again.', ok: 'Yes, reverse', done: 'Record Reversed', tone: 'danger', icon: 'clock' }
}
const act = async (r, action) => {
  const a = ACTIONS[action]
  const ok = await confirm({
    title: a.title, message: `${r.no}${r.type ? ' · ' + r.type : ''} on ${r.date} ${a.msg}`,
    confirmText: a.ok, cancelText: 'Keep it', tone: a.tone, icon: a.icon
  })
  if (!ok) return
  busy.value = true
  try {
    await api(`/auth/requests/${apiType.value}/${r.id}/${action}`, { method: 'POST' })
    flash(a.done)
  } catch (e) {
    flash(apiError(e))
  } finally {
    busy.value = false
    refresh()
  }
}

// body = the server's create/edit body for this type, built by RequestFormModal.
// sendNow: create and send in one go (Save as draft leaves it Active).
const save = async ({ body, sendNow }) => {
  busy.value = true
  try {
    if (editing.value) {
      await api(`/auth/requests/${apiType.value}/${editing.value.id}`, { method: 'PUT', body })
      if (sendNow) await api(`/auth/requests/${apiType.value}/${editing.value.id}/send`, { method: 'POST' })
      flash(sendNow ? 'Record Updated · Sent for Approval' : 'Record Updated')
    } else {
      const r = await api(`/auth/requests/${apiType.value}`, { method: 'POST', body })
      const id = r?.data?.id
      if (sendNow && id != null) {
        try {
          await api(`/auth/requests/${apiType.value}/${id}/send`, { method: 'POST' })
          flash('Record Created · Sent for Approval')
        } catch (e) {
          flash(`Saved as draft, but not sent: ${apiError(e)}`)
        }
      } else flash('Record Saved as Draft')
    }
    closeForm()
  } catch (e) {
    flash(apiError(e, 'Unable to save the request.'))
  } finally {
    busy.value = false
    refresh()
  }
}

// "File leave" / quick actions link here with ?new=1: open the form, then drop the
// query so a reload or Back doesn't reopen it. Watching (not just onMounted) also
// covers arriving while this page is already open.
const router = useRouter()
const openFromQuery = () => {
  if (!route.query.new) return
  openForm()
  router.replace({ query: { ...route.query, new: undefined } })
}
onMounted(openFromQuery)
watch(() => route.query.new, openFromQuery)
const { page, size, total, pages, pageRows } = usePagination(rows, 6)

// ?view=<id> (from a notification): open that request's details once the list is loaded.
const openFromView = () => {
  const id = route.query.view
  if (!id || pending.value || !source.value) return
  const r = source.value.find(x => String(x.id) === String(id))
  router.replace({ query: { ...route.query, view: undefined } })
  if (!r) { flash('This request is no longer in your list'); return }
  q.value = ''
  const i = rows.value.findIndex(x => x.id === r.id)
  if (i >= 0) page.value = Math.floor(i / size.value) + 1
  detail.value = r
}
onMounted(() => nextTick(openFromView))
watch([() => route.query.view, source, pending], () => nextTick(openFromView))

// Up to 6 rows per page, fewer on a short screen, so the list and pager fit the window
// with no vertical scroll (desktop only; phones show one card per request and scroll).
const MAX_ROWS = 6
const tableCard = ref(null)
const fitRows = () => {
  const el = tableCard.value
  if (!el || window.innerWidth <= 640) { size.value = MAX_ROWS; return }
  const top = el.getBoundingClientRect().top + window.scrollY
  const head = el.querySelector('thead')?.offsetHeight || 36
  const row = Math.max(48, ...[...el.querySelectorAll('tbody tr')].map(r => r.offsetHeight))
  const below = 56 /* pager */ + 32 /* page bottom padding */ + 16 /* card padding */
  const fit = Math.floor((window.innerHeight - top - head - below) / row)
  size.value = Math.max(3, Math.min(MAX_ROWS, fit))
}
const refit = () => nextTick(fitRows)
onMounted(() => { refit(); window.addEventListener('resize', refit) })
onBeforeUnmount(() => window.removeEventListener('resize', refit))
watch([rows, page], refit)

// ---- Multi-select: drafts (Active) can be cancelled together ----
// No bulk endpoint (BACKEND.md §0 #9b): one POST /auth/requests/:type/:id/cancel per item.
const selected = ref([])
const canPick = (r) => r.status === 'Active'
const pickable = computed(() => rows.value.filter(canPick).map(r => r.id))
const allChecked = computed(() => pickable.value.length > 0 && pickable.value.every(id => selected.value.includes(id)))
const allBox = ref(null)
watchEffect(() => { if (allBox.value) allBox.value.indeterminate = selected.value.length > 0 && !allChecked.value })
const toggle = (id, e) => {
  if (e.target.closest('button, a, input')) return
  selected.value = selected.value.includes(id) ? selected.value.filter(x => x !== id) : [...selected.value, id]
}
// Select all = every draft in the current search/filter (all pages).
const toggleAll = () => {
  selected.value = allChecked.value
    ? selected.value.filter(id => !pickable.value.includes(id))
    : [...new Set([...selected.value, ...pickable.value])]
}
// Drop picks that are filtered out or no longer drafts; start fresh on another type.
watch(pickable, (ids) => { selected.value = selected.value.filter(id => ids.includes(id)) })
watch(type, () => { selected.value = [] })
const cancelSelected = async () => {
  const n = selected.value.length
  const first = source.value.find(r => r.id === selected.value[0])
  const ok = await confirm({
    title: `Cancel ${n === 1 ? 'this request' : `${n} requests`}?`,
    message: `${n === 1 ? first?.no : `${n} draft ${meta.value.title} requests`} will be cancelled. You can reverse them later.`,
    confirmText: n === 1 ? 'Yes, cancel it' : `Yes, cancel ${n}`,
    cancelText: 'Keep them',
    tone: 'danger',
    icon: 'doc'
  })
  if (!ok) return
  busy.value = true
  const ids = [...selected.value]
  const res = await Promise.allSettled(ids.map(id => api(`/auth/requests/${apiType.value}/${id}/cancel`, { method: 'POST' })))
  const failed = res.filter(x => x.status === 'rejected').length
  selected.value = []
  busy.value = false
  flash(failed ? `${n - failed} cancelled, ${failed} failed` : `${n} Record${n === 1 ? '' : 's'} Cancelled`)
  refresh()
}
</script>

<style scoped>
.acts { white-space: nowrap; text-align: right; }
.pick { width: 1%; padding-right: 0; }
.pick input { accent-color: var(--ardent-red); width: 16px; height: 16px; cursor: pointer; vertical-align: middle; }
.pick input:disabled { cursor: default; opacity: .4; }
tr.can { cursor: pointer; }
tr.picked td { background: #fff7f8; }
.why { max-width: 240px; }
.why span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.why small { display: block; font-size: .74rem; }
@media (max-width: 640px) { .why { max-width: none; } .why span { white-space: normal; } }
/* Phone cards: request no. is the card title; the checkbox sits in the top-right corner. */
@media (max-width: 640px) {
  tbody tr { position: relative; }
  tbody td.pick { position: absolute; top: .9rem; right: .5rem; width: auto; padding: 0; }
  tbody td[data-label="No."] { display: block; text-align: left; padding: 0 2.25rem .45rem .5rem; }
  tbody td[data-label="No."]::before { display: none; }
  tbody td[data-label="No."] b { font-size: .95rem; }
}
.acts .btn + .btn { margin-left: .35rem; }
/* Desktop: the table always fits the card width (fixed column widths, long text is cut
   with "…" and shown in full on hover), and rows stay short so the page needs no scroll. */
@media (min-width: 641px) {
  .table { table-layout: fixed; font-size: .84rem; }
  .table th, .table td { padding-left: .55rem; padding-right: .55rem; }
  .table th { padding-top: .6rem; padding-bottom: .6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .table td { padding-top: .45rem; padding-bottom: .45rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
  .table td > b, .table td small, .table td > span { display: block; overflow: hidden; text-overflow: ellipsis; }
  /* Sub-labels (Filed date, from–to time, customer) are shown in full: they wrap, never "…". */
  .table td small { font-size: .72rem; line-height: 1.25; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }
  .table td > span { white-space: normal; }
  .table td > span small { margin-top: .1rem; }
  .table td.date, .table td.appr { white-space: normal; overflow: visible; text-overflow: clip; }
  .table td.why > span { white-space: nowrap; } /* reason stays one line (full text on hover) */
  .table td br { display: none; }
  .table .badge { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
  col.c-pick { width: 34px; } col.c-no { width: 12%; } col.c-type { width: 12%; } col.c-date { width: 12%; }
  col.c-hrs { width: 7%; } col.c-appr { width: 17%; } col.c-stat { width: 11%; } col.c-act { width: 52px; }
  .why { max-width: none; }
  .acts { overflow: visible; }
}
.no-x { overflow-x: hidden; }
/* ⋮ actions button + its menu (teleported to <body> so the card never clips it) */
.kebab { width: 32px; height: 32px; display: inline-grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: var(--muted); cursor: pointer; }
.kebab:hover, .kebab.on { background: var(--brand-soft); color: var(--ardent-red); }
.kebab:disabled { opacity: .4; cursor: default; }
.row-menu { position: fixed; z-index: 200; width: 160px; margin: 0; padding: .35rem; list-style: none; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-lg, 0 12px 32px rgba(19,51,65,.16)); }
.row-menu button { width: 100%; text-align: left; border: 0; background: none; font: inherit; font-size: .85rem; font-weight: 600; color: var(--ardent-navy); padding: .55rem .7rem; border-radius: 8px; cursor: pointer; }
.row-menu button:hover { background: #f4f6f8; }
.row-menu button.danger { color: var(--ardent-red); }
.row-menu button.danger:hover { background: var(--brand-soft); }
.row-menu button:disabled { opacity: .5; cursor: default; }
/* Request details modal */
.dt-overlay { position: fixed; inset: 0; z-index: 150; background: rgba(19,51,65,.45); display: grid; grid-template-columns: minmax(0, 1fr); place-items: center; padding: 1rem; overflow-y: auto; overscroll-behavior: contain; }
.dt-card { position: relative; width: 100%; max-width: 520px; background: #fff; border-radius: 18px; box-shadow: var(--shadow-lg, 0 20px 50px rgba(19,51,65,.25)); padding: 1.4rem 1.5rem 1.25rem; }
.dt-head { display: flex; align-items: flex-start; gap: .75rem; padding-right: 2rem; margin-bottom: 1rem; }
.dt-head > div { flex: 1; min-width: 0; }
.dt-head h2 { margin: .1rem 0 0; font-size: 1.2rem; }
.dt-head .badge { margin-top: .2rem; white-space: nowrap; }
.dt-x { position: absolute; top: .9rem; right: .9rem; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; font-size: 1.4rem; line-height: 1; color: var(--muted); cursor: pointer; }
.dt-x:hover { background: #f4f6f8; }
.dt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .85rem 1.25rem; margin: 0; }
.dt-grid .wide { grid-column: 1 / -1; }
.dt-grid dt { font-size: .72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
.dt-grid dd { margin: .15rem 0 0; font-weight: 600; font-size: .9rem; overflow-wrap: anywhere; white-space: pre-line; }
.dt-lines { margin-top: 1.1rem; border-top: 1px solid var(--border); padding-top: .9rem; }
.dt-lines h3 { font-size: .72rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; margin: 0 0 .5rem; }
.dt-line { display: flex; flex-direction: column; gap: .15rem; padding: .6rem .75rem; background: #f8f9fa; border-radius: 10px; font-size: .86rem; }
.dt-line + .dt-line { margin-top: .45rem; }
.dt-line small { margin-right: .35rem; }
.dt-foot { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.dt-enter-active, .dt-leave-active { transition: opacity .15s; }
.dt-enter-from, .dt-leave-to { opacity: 0; }
@media (max-width: 480px) { .dt-grid { grid-template-columns: 1fr; } }
</style>
