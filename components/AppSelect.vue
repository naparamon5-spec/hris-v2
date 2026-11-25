<template>
  <div class="as" :class="{ open, full, disabled }">
    <button
      :id="uid" ref="btn" type="button" class="as-btn"
      role="combobox" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="listId"
      :aria-label="ariaLabel || undefined" :disabled="disabled"
      @click="toggle" @keydown="onKey"
    >
      <span class="as-val" :class="{ ph: !current }">{{ current ? current.label : placeholder }}</span>
      <svg class="as-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <Teleport to="body">
      <ul
        v-if="open" :id="listId" ref="list" class="as-list" role="listbox" :aria-labelledby="uid"
        :style="pos" tabindex="-1" @keydown="onKey"
      >
        <li
          v-for="(o, i) in opts" :id="`${listId}-${i}`" :key="String(o.value)" role="option"
          :aria-selected="o.value === modelValue" :class="{ sel: o.value === modelValue, act: i === active }"
          @mousedown.prevent="pick(o)" @mousemove="active = i"
        >
          <span>{{ o.label }}</span>
          <svg v-if="o.value === modelValue" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
        </li>
        <li v-if="!opts.length" class="none">No options</li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup>
// Styled dropdown used instead of <select> everywhere (same look on every browser).
//   <AppSelect v-model="year" :options="[2026, 2025]" aria-label="Year" />
//   options: strings/numbers, or { value, label }.
const props = defineProps({
  modelValue: { type: [String, Number, Boolean, null], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select…' },
  id: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  full: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])

const opts = computed(() => props.options.map(o => (o !== null && typeof o === 'object' ? o : { value: o, label: String(o) })))
const current = computed(() => opts.value.find(o => o.value === props.modelValue))
// useId gives the same id on the server and in the browser (no hydration mismatch).
const autoId = useId()
const uid = computed(() => props.id || `as-${autoId}`)
const listId = computed(() => `${uid.value}-list`)

const open = ref(false)
const active = ref(-1)
const btn = ref(null)
const list = ref(null)
const pos = ref({})

// The list is teleported to <body> with fixed position, so modals/cards can't clip it.
const place = () => {
  const r = btn.value?.getBoundingClientRect()
  if (!r) return
  const below = window.innerHeight - r.bottom
  const up = below < 220 && r.top > below
  pos.value = {
    left: r.left + 'px', minWidth: r.width + 'px',
    ...(up ? { bottom: window.innerHeight - r.top + 6 + 'px' } : { top: r.bottom + 6 + 'px' }),
    maxHeight: Math.max(160, Math.min(280, (up ? r.top : below) - 16)) + 'px'
  }
}
const show = async () => {
  if (props.disabled) return
  place()
  open.value = true
  active.value = Math.max(0, opts.value.findIndex(o => o.value === props.modelValue))
  await nextTick()
  scrollActive()
}
const hide = (focus = true) => { open.value = false; if (focus) btn.value?.focus() }
const toggle = () => (open.value ? hide() : show())
const pick = (o) => {
  emit('update:modelValue', o.value)
  emit('change', o.value)
  hide()
}
const scrollActive = () => list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
const move = async (d) => {
  if (!open.value) return show()
  const n = opts.value.length
  if (!n) return
  active.value = (active.value + d + n) % n
  await nextTick(); scrollActive()
}
// Typing a letter jumps to the next option starting with it.
const jump = (ch) => {
  const n = opts.value.length
  for (let k = 1; k <= n; k++) {
    const i = (active.value + k) % n
    if (opts.value[i].label.toLowerCase().startsWith(ch)) { active.value = i; nextTick(scrollActive); return }
  }
}
const onKey = (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  else if (e.key === 'Home' && open.value) { e.preventDefault(); active.value = 0; nextTick(scrollActive) }
  else if (e.key === 'End' && open.value) { e.preventDefault(); active.value = opts.value.length - 1; nextTick(scrollActive) }
  else if ((e.key === 'Enter' || e.key === ' ') && open.value) { e.preventDefault(); const o = opts.value[active.value]; if (o) pick(o) }
  else if (e.key === 'Escape' && open.value) { e.preventDefault(); e.stopPropagation(); hide() }
  else if (e.key === 'Tab' && open.value) hide(false)
  else if (e.key.length === 1 && /\S/.test(e.key)) { if (!open.value) show(); jump(e.key.toLowerCase()) }
}

const onDoc = (e) => {
  if (!open.value) return
  if (btn.value?.contains(e.target) || list.value?.contains(e.target)) return
  hide(false)
}
const onMove = () => open.value && place()
onMounted(() => {
  document.addEventListener('mousedown', onDoc)
  window.addEventListener('resize', onMove)
  window.addEventListener('scroll', onMove, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDoc)
  window.removeEventListener('resize', onMove)
  window.removeEventListener('scroll', onMove, true)
})
</script>

<style scoped>
.as { position: relative; display: inline-block; min-width: 140px; }
.as.full { display: block; width: 100%; }
.as-btn {
  width: 100%; height: 42px; display: flex; align-items: center; justify-content: space-between; gap: .6rem;
  padding: 0 .8rem 0 1rem; background: #fff; border: 1px solid var(--border); border-radius: 12px;
  font: 500 .88rem Montserrat, sans-serif; color: var(--text); cursor: pointer; text-align: left;
  transition: border-color .15s, box-shadow .15s;
}
.as-btn:hover:not(:disabled) { border-color: var(--ardent-gray, #c9ccd1); }
.as-btn:focus-visible, .as.open .as-btn { outline: none; border-color: var(--ardent-red); box-shadow: var(--ring); }
.as-btn:disabled { opacity: .55; cursor: default; background: #fafafa; }
.as-val { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-val.ph { color: var(--muted); }
.as-chev { flex: none; color: var(--muted); transition: transform .15s; }
.as.open .as-chev { transform: rotate(180deg); color: var(--ardent-red); }
</style>

<style>
/* Teleported list (unscoped so it styles outside the component root). */
.as-list {
  position: fixed; z-index: 1000; margin: 0; padding: .35rem; list-style: none; overflow-y: auto;
  background: #fff; border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 18px 40px -12px rgba(19, 51, 65, .3); font: 500 .86rem Montserrat, sans-serif;
  animation: as-in .12s ease-out;
}
.as-list li { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .55rem .75rem; border-radius: 8px; cursor: pointer; color: var(--text); white-space: nowrap; }
.as-list li.act { background: #f6f7f9; }
.as-list li.sel { color: var(--ardent-red); font-weight: 700; background: #fff4f5; }
.as-list li.none { color: var(--muted); cursor: default; }
@keyframes as-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
</style>
