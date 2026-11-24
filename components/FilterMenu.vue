<template>
  <div ref="root" class="fm">
    <button type="button" class="fm-btn" :class="{ on: count }" :aria-expanded="open" aria-haspopup="dialog" @click="open = !open">
      <AppIcon name="filter" :size="16" />
      Filters
      <span v-if="count" class="fm-count">{{ count }}</span>
    </button>

    <div v-if="open" class="fm-pop" role="dialog" aria-label="Filters" @keydown.esc="open = false">
      <div v-for="f in fields" :key="f.key" class="fm-field">
        <template v-if="f.type === 'date-range'">
          <span class="fm-label">{{ f.label }}</span>
          <div class="fm-range">
            <label class="sr-only" :for="id(f.key + '-from')">{{ f.label }} from</label>
            <input :id="id(f.key + '-from')" type="date" class="input" :value="draft[f.key + 'From']" :max="draft[f.key + 'To'] || undefined" @input="set(f.key + 'From', $event.target.value)">
            <span class="m">to</span>
            <label class="sr-only" :for="id(f.key + '-to')">{{ f.label }} to</label>
            <input :id="id(f.key + '-to')" type="date" class="input" :value="draft[f.key + 'To']" :min="draft[f.key + 'From'] || undefined" @input="set(f.key + 'To', $event.target.value)">
          </div>
        </template>
        <template v-else>
          <label class="fm-label" :for="id(f.key)">{{ f.label }}</label>
          <select :id="id(f.key)" class="input" :value="draft[f.key] || ''" @change="set(f.key, $event.target.value)">
            <option value="">All</option>
            <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
          </select>
        </template>
      </div>
      <div class="fm-foot">
        <button type="button" class="btn btn-ghost btn-sm" :disabled="!draftCount" @click="clear">Clear all</button>
        <button type="button" class="btn btn-primary btn-sm" @click="apply">Apply</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Compact "Filters" button + popover. v-model is a plain object, e.g.
// { type: 'Sick Leave', dateFrom: '2026-11-01', dateTo: '' }. A field of type
// 'date-range' with key 'date' writes dateFrom / dateTo.
const props = defineProps({
  modelValue: { type: Object, required: true },
  fields: { type: Array, required: true }
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const draft = ref({ ...props.modelValue })
watch(open, (o) => { if (o) draft.value = { ...props.modelValue } })
watch(() => props.modelValue, (v) => { if (!open.value) draft.value = { ...v } })

const filled = (o) => Object.values(o).filter(v => v !== '' && v != null).length
const count = computed(() => filled(props.modelValue))
const draftCount = computed(() => filled(draft.value))
const set = (k, v) => { draft.value = { ...draft.value, [k]: v } }
const apply = () => { emit('update:modelValue', { ...draft.value }); open.value = false }
const clear = () => {
  const empty = Object.fromEntries(Object.keys(draft.value).map(k => [k, '']))
  draft.value = empty
  emit('update:modelValue', empty)
  open.value = false
}

const uid = Math.random().toString(36).slice(2, 7)
const id = (k) => `fm-${uid}-${k}`

// Close when clicking outside.
const root = ref(null)
const onDoc = (e) => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('mousedown', onDoc))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDoc))
</script>

<style scoped>
.fm { position: relative; flex: none; }
.fm-btn {
  display: inline-flex; align-items: center; gap: .45rem; height: 40px; padding: 0 .95rem;
  border: 1px solid var(--border); border-radius: 999px; background: #fff; color: var(--text);
  font: 600 .82rem Montserrat, sans-serif; cursor: pointer; transition: border-color .15s, color .15s;
}
.fm-btn:hover, .fm-btn.on { border-color: var(--ardent-red); color: var(--ardent-red); }
.fm-btn:focus-visible { outline: none; box-shadow: var(--ring); }
.fm-count { min-width: 20px; height: 20px; padding: 0 .35rem; border-radius: 999px; background: var(--ardent-red); color: #fff; font-size: .7rem; display: grid; place-items: center; }
.fm-pop {
  position: absolute; right: 0; top: calc(100% + .5rem); z-index: 30; width: 340px;
  background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 1rem;
  box-shadow: 0 18px 40px -12px rgba(19,51,65,.28); display: flex; flex-direction: column; gap: .8rem;
}
.fm-field { display: flex; flex-direction: column; gap: .35rem; }
.fm-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.fm-pop .input { width: 100%; min-width: 0; flex-basis: auto; padding: .55rem .75rem; background: #fff; font-size: .85rem; }
.fm-range { display: flex; align-items: center; gap: .4rem; }
.fm-range .input { flex: 1; min-width: 0; }
.fm-range .m { font-size: .78rem; }
.fm-foot { display: flex; justify-content: space-between; gap: .5rem; padding-top: .3rem; border-top: 1px solid var(--border); margin-top: .1rem; padding-top: .8rem; }
@media (max-width: 640px) { .fm-pop { position: fixed; left: 1rem; right: 1rem; top: auto; width: auto; } }
</style>
