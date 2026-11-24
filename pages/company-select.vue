<template>
  <AuthCard slim>
    <div class="head">
      <div>
        <h2>Switch company</h2>
        <p class="sub">Choose which company account to open.</p>
      </div>
      <NuxtLink to="/" class="back-link">‹ Back</NuxtLink>
    </div>

    <!-- One compact column; rows are short so all companies fit without scrolling. -->
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
.grid-co { display: flex; flex-direction: column; gap: .35rem; }
.co {
  display: flex; align-items: center; gap: .85rem; min-height: 46px; padding: .3rem .85rem .3rem .4rem;
  background: #fff; border: 1px solid var(--border); border-radius: 12px;
  cursor: pointer; font: inherit; color: var(--text); text-align: left; transition: border-color .15s, box-shadow .15s;
}
.co:hover { border-color: var(--ardent-red); }
.co:focus-visible { outline: none; box-shadow: var(--ring); border-color: var(--ardent-red); }
.co.on { border-color: var(--ardent-red); background: #fff7f8; box-shadow: var(--ring); }
.co-logo { width: 88px; flex-shrink: 0; display: flex; justify-content: center; height: 30px; }
.co-logo :deep(.chip) { height: 30px; }
.co-logo :deep(.chip img) { max-width: 84px; }
.co-logo :deep(.mono) { width: 30px; height: 30px; font-size: .7rem; border-radius: 8px; }
.co-name { flex: 1; font-size: .84rem; font-weight: 600; }
.cur { font-size: .6rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ardent-red); }
@media (max-width: 860px) { .back-link { padding-top: .3rem; } }
@media (max-height: 760px) { .co { min-height: 40px; } .co-logo, .co-logo :deep(.chip) { height: 24px; } .co-logo :deep(.mono) { width: 24px; height: 24px; } }
</style>
