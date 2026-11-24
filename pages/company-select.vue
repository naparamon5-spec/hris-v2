<template>
  <AuthCard slim>
    <div class="head">
      <div>
        <h2>Switch company</h2>
        <p class="sub">Choose which company account to open.</p>
      </div>
      <NuxtLink to="/" class="back-link">‹ Back</NuxtLink>
    </div>

    <!-- Compact 2-column grid so all companies fit on one screen without scrolling. -->
    <div class="grid-co" role="list">
      <button
        v-for="c in companies" :key="c" type="button" role="listitem" class="co"
        :class="{ on: c === company }" :aria-current="c === company ? 'true' : undefined"
        @click="pick(c)"
      >
        <span class="co-logo"><ArdentLogo :company="c" /></span>
        <span class="co-name">{{ c }}</span>
        <span v-if="c === company" class="cur">Current</span>
      </button>
    </div>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const { companies } = useMockData()
const company = useState('company', () => companies[0])
const pick = (c) => { company.value = c; navigateTo('/') }
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.head :deep(.sub), .head .sub { margin-bottom: 1rem !important; }
.back-link { font-size: .82rem; font-weight: 600; white-space: nowrap; padding-top: .45rem; }
.grid-co { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
.co {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3rem;
  min-height: 74px; padding: .55rem .5rem; background: #fff; border: 1px solid var(--border); border-radius: 12px;
  cursor: pointer; font: inherit; color: var(--text); text-align: center; transition: border-color .15s, box-shadow .15s, transform .12s;
}
.co:hover { border-color: var(--ardent-red); transform: translateY(-1px); }
.co:focus-visible { outline: none; box-shadow: var(--ring); border-color: var(--ardent-red); }
.co.on { border-color: var(--ardent-red); background: #fff7f8; box-shadow: var(--ring); }
.co-logo { display: flex; justify-content: center; height: 30px; }
.co-logo :deep(.chip) { height: 30px; }
.co-logo :deep(.chip img) { max-width: 110px; }
.co-name { font-size: .74rem; font-weight: 600; line-height: 1.2; }
.cur { position: absolute; top: 5px; right: 6px; font-size: .58rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--ardent-red); }
@media (max-width: 860px) { .back-link { padding-top: .3rem; } }
@media (max-height: 720px) { .co { min-height: 64px; } .co-logo, .co-logo :deep(.chip) { height: 24px; } }
</style>
