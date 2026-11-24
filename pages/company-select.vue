<template>
  <AuthCard slim>
    <div class="head">
      <div>
        <h2>Switch company</h2>
        <p class="sub">Choose which company account to open.</p>
      </div>
      <NuxtLink to="/" class="back-link">‹ Back</NuxtLink>
    </div>

    <input v-model="q" class="input search" type="search" aria-label="Search companies" placeholder="Search companies…">

    <!-- Tapping a row only selects it; Continue does the switch (avoids accidental switches). -->
    <div class="grid-co" role="radiogroup" aria-label="Companies">
      <button
        v-for="c in list" :key="c" type="button" role="radio" class="co"
        :class="{ on: c === chosen }" :aria-checked="c === chosen"
        @click="chosen = c" @dblclick="chosen = c; go()"
      >
        <span class="co-logo"><ArdentLogo :company="c" /></span>
        <span class="co-name">{{ c }}</span>
        <span v-if="c === company" class="cur">Current</span>
        <span class="tick" aria-hidden="true"><AppIcon v-if="c === chosen" name="check" :size="14" /></span>
      </button>
      <p v-if="!list.length" class="empty">No company matches "{{ q }}".</p>
    </div>

    <div class="footer-bar">
      <button type="button" class="btn btn-primary continue" :disabled="!chosen" @click="go">
        {{ chosen === company ? 'Continue' : `Continue to ${chosen}` }}
        <AppIcon name="chevron" :size="16" />
      </button>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const { companies } = useMockData()
const company = useState('company', () => companies[0])
const chosen = ref(company.value)
const go = () => { if (!chosen.value) return; company.value = chosen.value; navigateTo('/') }
const q = ref('')
const list = computed(() => companies.filter(c => c.toLowerCase().includes(q.value.trim().toLowerCase())))
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.head :deep(.sub), .head .sub { margin-bottom: 1rem !important; }
.back-link { font-size: .82rem; font-weight: 600; white-space: nowrap; padding-top: .45rem; }
.search { width: 100%; margin-bottom: .75rem; padding-left: 2.6rem; background: #fbfbfc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364788a' stroke-width='2' stroke-linecap='round' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M21 21l-4.3-4.3'/%3E%3C/svg%3E") no-repeat 1rem center; }
.empty { padding: 1.5rem 0; }
.grid-co { display: flex; flex-direction: column; gap: .4rem; }
.co {
  display: flex; align-items: center; gap: .85rem; min-height: 56px; padding: .4rem 1rem .4rem .5rem;
  background: #fff; border: 1px solid var(--border); border-radius: 14px;
  cursor: pointer; font: inherit; color: var(--text); text-align: left; transition: border-color .15s, box-shadow .15s;
}
.co:hover { border-color: var(--ardent-red); }
.co:focus-visible { outline: none; box-shadow: var(--ring); border-color: var(--ardent-red); }
.co.on { border-color: var(--ardent-red); background: #fff7f8; box-shadow: var(--ring); }
.co-logo { width: 104px; flex-shrink: 0; display: flex; justify-content: center; height: 40px; }
.co-logo :deep(.chip) { height: 40px; }
.co-logo :deep(.chip img) { max-width: 100px; }
.co-logo :deep(.mono) { width: 40px; height: 40px; font-size: .85rem; border-radius: 10px; }
.co-name { flex: 1; font-size: .98rem; font-weight: 600; }
.cur { font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); background: #f0f1f3; padding: .2rem .5rem; border-radius: 99px; }
.tick { width: 22px; height: 22px; flex-shrink: 0; border-radius: 50%; border: 2px solid var(--ardent-gray); display: grid; place-items: center; color: #fff; transition: all .15s; }
.co.on .tick { background: var(--ardent-red); border-color: var(--ardent-red); }
.footer-bar { position: sticky; bottom: 0; padding: .9rem 0 .25rem; margin-top: .4rem; background: linear-gradient(transparent, #fff 35%); }
.continue { width: 100%; padding: .9rem; font-size: .95rem; }
.continue :deep(svg) { margin-left: .1rem; }
@media (max-width: 860px) { .back-link { padding-top: .3rem; } }
</style>
