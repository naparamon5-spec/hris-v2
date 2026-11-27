<template>
  <!-- Public full pages (Support, Privacy Policy): open to anyone, no sidebar.
       Top-right goes back into HRIS when signed in, or to sign in otherwise. -->
  <div class="doc-shell">
    <header class="doc-top">
      <NuxtLink :to="home" class="logo" aria-label="HRIS home"><HrisLogo :size="36" /></NuxtLink>
      <nav class="doc-nav" aria-label="Help">
        <NuxtLink to="/support">Support</NuxtLink>
        <NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink>
      </nav>
      <NuxtLink :to="home" class="btn btn-primary btn-sm back-btn">{{ signedIn ? '‹ Back to HRIS' : 'Sign in' }}</NuxtLink>
    </header>
    <main class="doc-main"><slot /></main>
    <footer class="doc-foot">© {{ year }} Ardent Networks, Inc.</footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
const { signedIn } = useSession()
const home = computed(() => (signedIn.value ? '/' : '/login'))
</script>

<style scoped>
.doc-shell { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.doc-top {
  position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 1.25rem;
  padding: .7rem 2rem; background: #fff; border-bottom: 1px solid var(--border);
}
.logo { color: inherit; }
.doc-nav { display: flex; gap: .25rem; margin-left: auto; }
.doc-nav a { padding: .45rem .8rem; border-radius: 999px; font-size: .84rem; font-weight: 600; color: var(--muted); }
.doc-nav a:hover { color: var(--text); background: #f4f5f7; }
.doc-nav a.router-link-active { color: var(--ardent-red); background: var(--brand-soft); }
.back-btn { flex: none; }
.doc-main { flex: 1; width: 100%; max-width: 1560px; margin: 0 auto; padding: 1.25rem 2rem 1.25rem; }
.doc-foot { text-align: center; color: var(--muted); font-size: .74rem; padding: 0 1rem 1rem; }
@media (max-width: 640px) {
  .doc-top { flex-wrap: wrap; gap: .5rem; padding: .6rem 1rem; }
  .logo :deep(small) { display: none; }
  .doc-nav { order: 3; width: 100%; margin: 0; justify-content: center; }
  .back-btn { margin-left: auto; }
  .doc-main { padding: 1.25rem 1rem 2rem; }
}
</style>
