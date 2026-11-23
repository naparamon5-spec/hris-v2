<template>
  <AuthCard>
    <h2>Switch company</h2>
    <p class="sub">Choose which company account to open.</p>
    <NuxtLink to="/" class="alt" style="margin:-1rem 0 1rem;text-align:left">‹ Back to dashboard</NuxtLink>
    <input v-model="q" class="input" placeholder="Search companies…" style="width:100%;margin-bottom:1rem">
    <button v-for="c in list" :key="c" class="co" @click="pick(c)" :class="{ on: c === company }">
      <span class="icon-tile"><AppIcon name="people" /></span><b>{{ c }}</b><AppIcon name="chevron" />
    </button>
  </AuthCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })
const { companies } = useMockData()
const q = ref('')
const company = useState('company', () => companies[0])
const pick = (c) => { company.value = c; navigateTo('/') }
const list = computed(() => companies.filter(c => c.toLowerCase().includes(q.value.toLowerCase())))
</script>

<style scoped>
.co { width: 100%; display: flex; align-items: center; gap: .9rem; padding: .9rem 1rem; margin-bottom: .6rem; background: #fff; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font: inherit; color: var(--text); text-align: left; }
.co:hover { border-color: var(--ardent-red); }
.co b { flex: 1; }
.co.on { border-color: var(--ardent-red); background: #fff7f8; box-shadow: var(--ring); }
.list { max-height: 60vh; overflow: auto; }
</style>
