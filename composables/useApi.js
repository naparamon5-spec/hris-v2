// Calls hris_server (docs/BACKEND.md §1.4). Bearer token on every call; on a 401 it
// refreshes the token once and retries, otherwise it signs out and goes to /login.
const ACCESS = 'hris_access'
const REFRESH = 'hris_refresh'
const WEEK = 60 * 60 * 24 * 7

export const useTokens = () => ({
  access: useCookie(ACCESS, { sameSite: 'lax', maxAge: WEEK }),
  refresh: useCookie(REFRESH, { sameSite: 'lax', maxAge: WEEK })
})

// One refresh at a time, shared by calls that fail together.
let refreshing = null

export const useApi = () => {
  const { public: { apiBase } } = useRuntimeConfig()
  const { access, refresh } = useTokens()
  const user = useState('user', () => null)
  const raw = $fetch.create({ baseURL: apiBase, credentials: 'include' })

  const renew = () => {
    refreshing ||= raw('/public/refresh', { method: 'POST', body: { refreshToken: refresh.value, rotate: true } })
      .then((r) => {
        access.value = r.accessToken
        if (r.refreshToken) refresh.value = r.refreshToken
        if (r.user) user.value = r.user
      })
      .finally(() => { refreshing = null })
    return refreshing
  }

  const call = async (url, opts = {}, retried = false) => {
    try {
      return await raw(url, {
        ...opts,
        headers: { ...(opts.headers || {}), ...(access.value ? { Authorization: `Bearer ${access.value}` } : {}) }
      })
    } catch (e) {
      const status = e?.response?.status
      const isAuthCall = url.startsWith('/public/')
      if (status === 401 && !isAuthCall && !retried && refresh.value) {
        try {
          await renew()
          return call(url, opts, true)
        } catch { /* fall through to sign-out */ }
      }
      if (status === 401 && !isAuthCall) {
        access.value = null
        refresh.value = null
        user.value = null
        await navigateTo('/login')
      }
      throw e
    }
  }
  return call
}

// The server's messages are written for users ("Insufficient leave hours"…).
export const apiError = (e, fallback = 'Something went wrong. Please try again.') => {
  const d = e?.data || e?.response?._data
  if (d?.message) return d.message
  if (Array.isArray(d?.errors) && d.errors.length) return d.errors[0].msg || d.errors[0].message || String(d.errors[0])
  if (!e?.response) return 'Cannot reach the HRIS server. Check your connection.'
  return fallback
}
