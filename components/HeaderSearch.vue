<template>
  <div ref="root" class="hs" :class="{ open: isOpen }" @focusout="onFocusOut">
    <label class="search">
      <AppIcon name="search" :size="16" />
      <input
        ref="input" v-model="q" type="search" role="combobox" autocomplete="off"
        aria-label="Search pages, people, requests and payslips" aria-autocomplete="list"
        :aria-expanded="isOpen" aria-controls="hs-results" :aria-activedescendant="active >= 0 ? `hs-opt-${active}` : undefined"
        placeholder="Search pages, people, requests…"
        @focus="openPanel" @keydown="onKey"
      >
      <kbd v-if="!q">/</kbd>
    </label>

    <div v-if="isOpen" id="hs-results" class="panel" role="listbox" aria-label="Search results">
      <template v-for="g in groups" :key="g.title">
        <div class="gt">{{ g.title }}</div>
        <button
          v-for="it in g.items" :id="`hs-opt-${it.i}`" :key="it.key" type="button" role="option"
          class="opt" :class="{ act: it.i === active }" :aria-selected="it.i === active"
          @mousedown.prevent @mousemove="active = it.i" @click="go(it)"
        >
          <span class="ic"><AppIcon :name="it.icon" :size="15" /></span>
          <span class="tx"><b>{{ it.label }}</b><small v-if="it.sub">{{ it.sub }}</small></span>
          <AppIcon name="chevron" :size="14" class="arrow" />
        </button>
      </template>
      <p v-if="q.trim() && !flat.length" class="none">No results for “{{ q.trim() }}”</p>
      <div class="foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
    </div>
  </div>
</template>

<script setup>
// Header quick finder. Searches what the site already loads (no search endpoint on the
// server, BACKEND.md G16): pages & actions, Directory, my requests, payslips and — for
// approvers — pending approvals. Fetched on first open, then cached for the session.
const api = useApi()
const { user } = useSession()
const { canApprove: canApproveRef, approvesRequests, access } = useApprovals()
const canApprove = computed(() => canApproveRef.value)
const src = useState('search-cache', () => null)
const loadSources = async () => {
  if (src.value) return
  src.value = { directory: [], requests: {}, payslips: [], approvals: [] }
  const keys = Object.keys(requestTypes).filter(k => !requestTypes[k].versatechOnly || hasOtherRequests(user.value))
  const [dir, reqs, slips, appr] = await Promise.all([
    api('/auth/directory').then(r => r.data || []).catch(() => []),
    Promise.all(keys.map(k => api(`/auth/requests/${requestTypes[k].apiType}`).then(r => [k, (r.data || []).map(toRequestRow)]).catch(() => [k, []]))),
    api('/auth/payslips').then(r => (r.data || []).map(toPayslip)).catch(() => []),
    canApprove.value
      ? Promise.all(['records', ...(approvesRequests.value ? ['requests'] : []), ...(access.value?.isWitness ? ['witness'] : [])]
        .map(m => api(`/auth/approvals?scope=pending&module=${m}`).then(r => (r.data || []).map(toApproval)).catch(() => []))).then(x => x.flat())
      : []
  ])
  src.value = { directory: dir, requests: Object.fromEntries(reqs), payslips: slips, approvals: appr }
}
const directory = computed(() => src.value?.directory || [])
const requests = computed(() => src.value?.requests || {})
const payslips = computed(() => src.value?.payslips || [])
const pending = computed(() => src.value?.approvals || [])

const q = ref('')
const isOpen = ref(false)
const active = ref(-1)
const root = ref(null)
const input = ref(null)

// ---- What can be found ----
const fileable = computed(() => Object.keys(requestTypes).filter(k => !requestTypes[k].versatechOnly || hasOtherRequests(user.value)))
const short = { 'leave-of-absence': 'loa leave vacation sick', 'call-approval': 'ca call client', 'manual-arrival-departure': 'mad manual arrival departure time in out', overtime: 'ot', 'other-requests': 'coe epp certificate' }
const pages = computed(() => [
  { label: 'Home', to: '/', icon: 'home', kw: 'dashboard' },
  { label: 'Requests', to: '/requests', icon: 'requests', kw: '' },
  { label: 'Leave Hours', to: '/leave-hours', icon: 'hourglass', kw: 'balance vl sl ut undertime credits' },
  { label: 'Payslips', to: '/payroll', icon: 'wallet', kw: 'payroll pay salary' },
  { label: 'Timesheet', to: '/timesheet', icon: 'table', kw: 'time in out dtr attendance' },
  { label: "Who's Out", to: '/whos-out', icon: 'calendar', kw: 'whos out absent calendar' },
  { label: 'Directory', to: '/directory', icon: 'people', kw: 'people employees contacts' },
  ...(canApprove.value ? [
    { label: 'Approvals', to: '/approvals', icon: 'check', kw: 'pending approve' },
    { label: 'Approved Records', to: '/approvals?tab=records', icon: 'check', kw: 'history decided' }
  ] : []),
  ...(approvesRequests.value ? [{ label: 'Approved Requests', to: '/approvals?tab=requests', icon: 'doc', kw: 'history decided other' }] : []),
  { label: 'Notifications', to: '/notifications', icon: 'bell', kw: 'alerts' },
  { label: 'Profile', to: '/profile', icon: 'people', kw: 'account me photo 2fa' },
  { label: 'Change Password', to: '/change-password', icon: 'shield', kw: 'password security' },
  { label: 'Support', to: '/support', icon: 'bell', kw: 'help ticket' },
  { label: 'Privacy Policy', to: '/privacy-policy', icon: 'shield', kw: 'privacy' }
].map(p => ({ ...p, sub: 'Page' })))
const actions = computed(() => [
  ...fileable.value.map(k => ({
    label: `File ${requestTypes[k].title}`, sub: 'New request', icon: 'plus',
    to: `/requests/${k}?new=1`, kw: `new create file ${short[k] || ''}`
  })),
  { label: 'Download Payslips', sub: 'Payroll', icon: 'download', to: '/payroll?download=1', kw: 'pdf bulk' }
])
const people = computed(() => directory.value.map(d => ({
  label: d.name, sub: [d.role, d.department].filter(Boolean).join(' · '), icon: 'people',
  to: `/directory?q=${encodeURIComponent(d.name)}`, kw: d.id
})))
const myRequests = computed(() => fileable.value.flatMap(k => (requests.value[k] || []).map(r => ({
  label: r.no, sub: `${requestTypes[k].title} · ${r.type} · ${r.status}`, icon: requestTypes[k].icon,
  to: `/requests/${k}?q=${encodeURIComponent(r.no)}`, kw: `${short[k] || ''} ${r.reason || ''} ${r.customer || ''} ${r.date} ${r.approver}`
}))))
const slips = computed(() => payslips.value.map(p => ({
  label: `Period ${p.period} · ${p.label}`, sub: `Payslip · Pay date ${p.payDate}`, icon: 'wallet',
  to: `/payroll/${p.id}`, kw: `payslip ${p.payDate}`
})))
const approvals = computed(() => (canApprove.value ? pending.value : []).map(t => ({
  label: `${t.name} · ${t.no}`, sub: `${t.app} · ${t.date} · waiting for you`, icon: 'check',
  to: `/approvals?q=${encodeURIComponent(t.no)}`, kw: `${t.empId} ${t.reason || ''} approval`
})))

// Every word typed must match the start of a word somewhere (any order): "ot" finds
// Overtime / OT-2026-… but not "photo". Whole-word hits rank first, so "ot" lists
// Overtime before "Other Requests".
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const score = (it, words) => {
  const hay = `${it.label} ${it.sub || ''} ${it.kw || ''}`.toLowerCase()
  let total = 0
  for (const w of words) {
    if (new RegExp(`(^|[^a-z0-9])${esc(w)}($|[^a-z0-9])`).test(hay)) total += 2
    else if (new RegExp(`(^|[^a-z0-9])${esc(w)}`).test(hay)) total += 1
    else return 0
  }
  return total
}
const PER_GROUP = 4

// ---- Recent picks (this browser only) ----
const recent = ref([])
const RKEY = 'hris.recentSearch'
onMounted(() => {
  try { recent.value = JSON.parse(localStorage.getItem(RKEY) || '[]') } catch { recent.value = [] }
})
const remember = (it) => {
  const keep = { label: it.label, sub: it.sub, icon: it.icon, to: it.to }
  recent.value = [keep, ...recent.value.filter(r => r.to !== it.to)].slice(0, 4)
  try { localStorage.setItem(RKEY, JSON.stringify(recent.value)) } catch { /* storage blocked: fine */ }
}

const groups = computed(() => {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
  let list
  if (!words.length) {
    list = [
      { title: 'Recent', items: recent.value },
      { title: 'Quick actions', items: [actions.value[0], pages.value.find(p => p.to === '/timesheet'), slips.value[0] && { ...slips.value[0], label: `Latest payslip · ${slips.value[0].label}` }, ...(canApprove.value ? [pages.value.find(p => p.to === '/approvals')] : [])].filter(Boolean) }
    ]
  } else {
    const pick = (arr) => arr
      .map(it => ({ it, s: score(it, words) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s) // stable: equal scores keep their original order
      .slice(0, PER_GROUP)
      .map(x => x.it)
    const payslipGroup = { title: 'Payslips', items: pick(slips.value) }
    list = [
      { title: 'Go to', items: pick([...actions.value, ...pages.value]) },
      { title: 'People', items: pick(people.value) },
      { title: 'My requests', items: pick(myRequests.value) },
      { title: 'Approvals', items: pick(approvals.value) }
    ]
    // A plain number ("22") is most likely a pay period: show payslips first.
    if (/^\d+$/.test(q.value.trim())) list.unshift(payslipGroup)
    else list.splice(3, 0, payslipGroup)
  }
  // Number every row so ↑/↓ can move across groups.
  let i = 0
  return list.filter(g => g.items.length).map(g => ({ ...g, items: g.items.map(it => ({ ...it, key: g.title + it.to + it.label, i: i++ })) }))
})
const flat = computed(() => groups.value.flatMap(g => g.items))
watch(q, () => { active.value = flat.value.length ? 0 : -1 })

// ---- Open / close / pick ----
const openPanel = () => { loadSources(); isOpen.value = true; active.value = flat.value.length && q.value ? 0 : -1 }
const close = () => { isOpen.value = false; active.value = -1 }
const go = (it) => {
  remember(it)
  close()
  q.value = ''
  input.value?.blur()
  navigateTo(it.to)
}
const onFocusOut = (e) => { if (!root.value?.contains(e.relatedTarget)) close() }
const onKey = (e) => {
  const n = flat.value.length
  if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen.value) openPanel(); else if (n) active.value = (active.value + 1) % n; scrollActive() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) active.value = (active.value - 1 + n) % n; scrollActive() }
  else if (e.key === 'Enter') { e.preventDefault(); const it = flat.value[active.value] || flat.value[0]; if (it) go(it) }
  else if (e.key === 'Escape') { if (q.value) q.value = ''; else { close(); input.value?.blur() } }
}
const scrollActive = () => nextTick(() => document.getElementById(`hs-opt-${active.value}`)?.scrollIntoView({ block: 'nearest' }))

// "/" or Ctrl/⌘+K from anywhere focuses the search (not while typing in another field).
const onGlobalKey = (e) => {
  const t = e.target
  const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); input.value?.focus() }
  else if (e.key === '/' && !typing) { e.preventDefault(); input.value?.focus() }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
// Close when the page changes some other way.
const route = useRoute()
watch(() => route.fullPath, close)
</script>

<style scoped>
.hs { position: relative; flex: 1; max-width: 400px; min-width: 0; }
.search {
  display: flex; align-items: center; gap: .6rem; width: 100%;
  padding: .55rem .6rem .55rem 1rem; border-radius: 999px; background: #f1f2f5; color: var(--muted);
  border: 1px solid transparent; transition: all .15s;
}
.search:focus-within { background: #fff; border-color: var(--ardent-red); box-shadow: var(--ring); }
.search input { flex: 1; border: 0; background: none; outline: none; font: 500 .88rem Montserrat, sans-serif; color: var(--text); min-width: 0; }
.search input::-webkit-search-cancel-button { cursor: pointer; }
kbd { font: 600 .7rem Montserrat, sans-serif; color: var(--muted); background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: .1rem .45rem; }

.panel {
  position: absolute; top: calc(100% + 8px); left: 0; width: max(100%, 480px); max-height: min(70vh, 560px); overflow-y: auto;
  background: #fff; border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 24px 48px -16px rgba(19, 51, 65, .35);
  padding: .4rem; z-index: 50; animation: hs-in .12s ease-out;
}
@keyframes hs-in { from { opacity: 0; transform: translateY(-4px); } }
.gt { font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: .65rem .7rem .3rem; }
.opt {
  width: 100%; display: flex; align-items: center; gap: .7rem; padding: .5rem .7rem; border: 0; border-radius: 10px;
  background: none; cursor: pointer; text-align: left; font-family: inherit; color: var(--text);
}
.opt.act { background: #fff4f5; }
.ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; flex: none; background: #f4f5f7; color: var(--muted); }
.opt.act .ic { background: var(--brand-soft); color: var(--ardent-red); }
.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.tx b { font-size: .86rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tx small { font-size: .74rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arrow { color: var(--muted); opacity: 0; flex: none; }
.opt.act .arrow { opacity: 1; color: var(--ardent-red); }
.none { margin: 0; padding: 1.4rem .8rem; text-align: center; color: var(--muted); font-size: .85rem; }
.foot { display: flex; gap: 1rem; padding: .6rem .7rem .35rem; margin-top: .3rem; border-top: 1px solid var(--border); font-size: .72rem; color: var(--muted); }
.foot kbd { margin-right: .2rem; padding: 0 .35rem; }
@media (max-width: 860px) {
  .search { padding: .5rem .75rem; }
  .search input { font-size: .85rem; }
  kbd, .foot { display: none; }
  .panel { position: fixed; top: 60px; left: .75rem; right: .75rem; width: auto; }
}
</style>
