// Signed-in state (mock). A cookie, so the server render and the browser agree on it.
// Live: hold the hris_server login token here (POST /public/login → token), clear it on sign out.
// The public pages' top bar (/support, /privacy-policy) uses it: "Back to HRIS" vs "Sign in".
export const SESSION_COOKIE = 'hris.session'
export const useSession = () => {
  const cookie = useCookie(SESSION_COOKIE, { sameSite: 'lax', maxAge: 60 * 60 * 12 })
  const signedIn = computed(() => !!cookie.value)
  const signIn = () => { cookie.value = '1' }
  const signOut = () => { cookie.value = null }
  return { signedIn, signIn, signOut }
}
