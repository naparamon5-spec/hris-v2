<template>
  <div class="logo" :class="{ light }">
    <!-- The logos have dark lettering, so on dark backgrounds they sit on a white chip. -->
    <span class="chip">
      <img v-if="src" :src="src" :alt="name" @error="failed = true">
      <span v-else class="mono">{{ initials }}</span>
    </span>
    <small v-if="sub" class="sub">{{ sub }}</small>
  </div>
</template>

<script setup>
// Company logo, same files as hris_mobile (assets/logos/<id>.png), copied to public/logos.
// Uses the given company ({ id, name, logo } from GET /public/tenants), or the signed-in one.
const props = defineProps({ light: Boolean, sub: String, company: Object })
const { company: selected, companies } = useCompany()
const { user } = useSession()
const current = computed(() =>
  props.company || selected.value || companies.value.find(c => c.name === user.value?.company) || null)
const name = computed(() => current.value?.name || user.value?.company || '')
const failed = ref(false)
watch(name, () => { failed.value = false })
const src = computed(() => (failed.value ? null : companyLogo(current.value)))
const initials = computed(() => name.value.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase())
</script>

<style scoped>
.logo { display: flex; flex-direction: column; align-items: flex-start; gap: .45rem; }
.chip { display: inline-flex; align-items: center; height: 44px; }
.chip img { height: 100%; width: auto; max-width: 170px; object-fit: contain; display: block; }
.light .chip { background: #fff; border-radius: 12px; padding: 6px 12px; height: 52px; box-shadow: 0 6px 16px -8px rgba(0,0,0,.5); }
.mono { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--grad-brand); color: #fff; font-weight: 800; font-size: .9rem; }
.sub { font-weight: 600; letter-spacing: .14em; text-transform: uppercase; font-size: .62rem; color: var(--muted); }
.light .sub { color: rgba(255,255,255,.55); padding-left: .15rem; }
</style>
