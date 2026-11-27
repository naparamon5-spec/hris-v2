// Signed-in state (docs/BACKEND.md §1.5): the hris_server tokens (cookies, so the server
// render and the browser agree), the token user (/auth/me), the profile (/auth/profile)
// and the approver access (/auth/approvals/access).
// The public pages' top bar (/support, /privacy-policy) uses signedIn: "Back to HRIS" vs "Sign in".
export const useSession = () => {
  const api = useApi()
  const { access, refresh } = useTokens()
  const user = useState('user', () => null)
  const profile = useState('profile', () => null)
  const approver = useState('approverAccess', () => null)

  const signedIn = computed(() => !!access.value)

  // login.vue passes the POST /public/login response.
  const signIn = (r) => {
    access.value = r.accessToken
    refresh.value = r.refreshToken || null
    user.value = r.user || null
  }

  const clear = () => {
    access.value = null
    refresh.value = null
    user.value = null
    profile.value = null
    approver.value = null
    // useCookie writes the browser cookie later (on its watcher), so a navigateTo('/login')
    // right after signing out could still see the old token and bounce back to Home.
    // Expire the cookies now and re-sync every useCookie ref that reads them.
    if (import.meta.client) {
      for (const name of ['hris_access', 'hris_refresh']) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
        refreshCookie(name)
      }
    }
  }

  const signOut = async () => {
    try {
      if (access.value) await api('/auth/logout', { method: 'POST', body: { refreshToken: refresh.value } })
    } catch { /* signed out locally anyway */ }
    clear()
  }

  // After a page refresh: who is signed in, their profile and approver access.
  const load = async () => {
    const [me, prof, acc] = await Promise.all([
      api('/auth/me'),
      api('/auth/profile').catch(() => null),
      api('/auth/approvals/access').catch(() => null)
    ])
    user.value = me
    profile.value = prof
    approver.value = acc
  }

  const reloadAccess = async () => {
    try { approver.value = await api('/auth/approvals/access') } catch { /* keep the old one */ }
  }

  return { signedIn, signIn, signOut, clear, user, profile, access: approver, load, reloadAccess }
}

// Header / Home / Profile view of the signed-in employee (BACKEND.md §5.1 toUser).
export const useMe = () => {
  const { user, profile } = useSession()
  return computed(() => {
    const u = user.value || {}
    const p = profile.value || {}
    const bg = p.personal_background || {}
    const name = p.name || String(u.user_name || '').replace(/\s*\(.*\)\s*$/, '') || u.user_id || ''
    return {
      name,
      id: p.employee_id || u.employee_id || u.user_id || '',
      role: p.role || u.position || '',
      department: p.department || u.department || '',
      company: u.company || '',
      tenant: u.tenant || '',
      email: p.email || '',
      phone: bg.contact_number || '',
      hired: fmtDate(bg.date_hired),
      yearsOfService: p.years_of_service,
      initials: name.split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join('').toUpperCase(),
      manager: '', // not returned by /auth/profile (BACKEND.md §0 #4)
      background: bg
    }
  })
}
