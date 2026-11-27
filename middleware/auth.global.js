// Sign-in guard (docs/BACKEND.md §1.6).
// Sign-in pages, plus the two public info pages (open to anyone, like the mobile app's URLs).
const PUBLIC = ['/company-select', '/login', '/forgot-password', '/reset-password', '/examination']
const OPEN = ['/support', '/privacy-policy'] // public AND reachable while signed in

export default defineNuxtRouteMiddleware(async (to) => {
  if (OPEN.includes(to.path)) return
  const { access } = useTokens()
  if (!access.value) return PUBLIC.includes(to.path) ? undefined : navigateTo('/login')
  if (to.path === '/login' || to.path === '/company-select') return navigateTo('/')
  if (PUBLIC.includes(to.path)) return
  const { user, load } = useSession()
  if (!user.value) {
    try { await load() } catch { /* useApi already sent an expired session to /login */ }
  }
})
