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

    <div class="grid-co" role="list">
      <button
        v-for="c in list" :key="c" type="button" role="listitem" class="co"
        :class="{ on: c === company }" :aria-current="c === company ? 'true' : undefined"
        @click="pick(c)"
      >
        <span class="co-logo"><ArdentLogo :company="c" /></span>
        <span class="co-name">{{ c }}</span>
        <span v-if="c === company" class="cur">Current</span>
      </button>
      <p v-if="!list.length" class="empty">No company matches "{{ q }}".</p>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const { companies } = useMockData()
const company = useState('company', () => companies[0])
const pick = (c) => { company.value = c; navigateTo('/') }
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
.cur { font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ardent-red); }
@media (max-width: 860px) { .back-link { padding-top: .3rem; } }
</style>
