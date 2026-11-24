<template>
  <nav class="pager" aria-label="Pagination">
    <span class="info"><template v-if="total">Showing <b>{{ from }}–{{ to }}</b> of <b>{{ total }}</b></template><template v-else>No results</template></span>
    <div v-if="pages > 1" class="ctrls">
      <button type="button" class="pg" :disabled="page === 1" aria-label="Previous page" @click="go(page - 1)">
        <AppIcon name="chevron" :size="16" class="flip" />
      </button>
      <template v-for="(n, i) in numbers" :key="i">
        <span v-if="n === '…'" class="gap">…</span>
        <button
          v-else type="button" class="pg num" :class="{ on: n === page }"
          :aria-current="n === page ? 'page' : undefined" :aria-label="`Page ${n}`" @click="go(n)"
        >{{ n }}</button>
      </template>
      <button type="button" class="pg" :disabled="page === pages" aria-label="Next page" @click="go(page + 1)">
        <AppIcon name="chevron" :size="16" />
      </button>
    </div>
  </nav>
</template>

<script setup>
const props = defineProps({ page: { type: Number, required: true }, pages: { type: Number, required: true }, total: { type: Number, required: true }, size: { type: Number, required: true } })
const emit = defineEmits(['update:page'])
const from = computed(() => (props.total ? (props.page - 1) * props.size + 1 : 0))
const to = computed(() => Math.min(props.page * props.size, props.total))
const go = (n) => emit('update:page', Math.min(Math.max(1, n), props.pages))
// 1 … 4 5 6 … 12 style page list
const numbers = computed(() => {
  const n = props.pages, p = props.page
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const set = [1, p - 1, p, p + 1, n].filter(x => x >= 1 && x <= n)
  const out = []
  ;[...new Set(set)].sort((a, b) => a - b).forEach((x, i, arr) => { if (i && x - arr[i - 1] > 1) out.push('…'); out.push(x) })
  return out
})
</script>

<style scoped>
.pager { margin-top: auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; padding: .9rem .25rem .2rem; font-size: .82rem; color: var(--muted); }
.info b { color: var(--text); }
.ctrls { display: flex; align-items: center; gap: .3rem; }
.pg { min-width: 34px; height: 34px; padding: 0 .55rem; border-radius: 10px; border: 1px solid var(--border); background: #fff; color: var(--text); font: 600 .82rem Montserrat, sans-serif; display: grid; place-items: center; cursor: pointer; transition: all .15s; }
.pg:hover:not(:disabled):not(.on) { border-color: var(--ardent-red); color: var(--ardent-red); }
.pg:disabled { opacity: .4; cursor: default; }
.pg.on { background: var(--ardent-navy); border-color: var(--ardent-navy); color: #fff; }
.pg:focus-visible { outline: none; box-shadow: var(--ring); }
.flip { transform: rotate(180deg); }
.gap { padding: 0 .2rem; }
@media (max-width: 640px) { .pager { justify-content: center; } .info { width: 100%; text-align: center; } }
</style>
