// Company accent color, like hris_mobile (main.dart → AppColors.applyAccent): the signed-in
// company's color from GET /public/tenants themes buttons, links, highlights and the brand
// gradient. Ardent keeps the site's own red palette. On the sign-in pages the picked company's
// color is used — on /company-select as soon as a company is highlighted. Status colors for errors (--ardent-alert) stay red.
const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
const VARS = ['--ardent-red', '--ardent-coral', '--brand-rgb', '--brand2-rgb', '--brand-soft', '--brand-soft-2', '--brand-line']

export default defineNuxtPlugin(() => {
  const { company, companies } = useCompany()
  // The company highlighted on /company-select (before Continue), so the page recolors on pick.
  const preview = useState('company-preview', () => null)
  const { user, signedIn } = useSession()
  const root = document.documentElement.style

  const apply = () => {
    // Signed in: the company in the token (by name); otherwise the one picked for sign-in.
    const c = (signedIn.value && user.value?.company && companies.value.find(x => x.name === user.value.company)) ||
      (!signedIn.value && preview.value) || company.value
    const rgb = c && c.id !== 'ardent' ? hexToRgb(c.color) : null
    if (!rgb) { VARS.forEach(v => root.removeProperty(v)); return }
    const white = [255, 255, 255]
    const black = [0, 0, 0]
    const bright = mix(rgb, white, 0.18)
    root.setProperty('--ardent-red', hex(rgb))
    root.setProperty('--ardent-coral', hex(bright))
    root.setProperty('--brand-rgb', rgb.join(', '))
    root.setProperty('--brand2-rgb', bright.join(', '))
    root.setProperty('--brand-soft', hex(mix(rgb, white, 0.9)))
    root.setProperty('--brand-soft-2', hex(mix(rgb, white, 0.82)))
    root.setProperty('--brand-line', hex(mix(rgb, white, 0.72)))
    // Keep text on the accent readable for very light colors (e.g. Versatech's light blue).
    const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
    if (lum > 0.62) {
      const deep = mix(rgb, black, 0.3)
      root.setProperty('--ardent-red', hex(deep))
      root.setProperty('--brand-rgb', deep.join(', '))
    }
  }
  watch([company, companies, user, signedIn, preview], apply, { immediate: true })
})
