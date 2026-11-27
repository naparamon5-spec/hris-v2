// The company (tenant) the user signs in to. hris_server puts the tenant inside the login
// token, so the company is picked BEFORE sign-in (/company-select → /login) and switching
// means signing out and in again. The last pick (tenant id) is remembered in this browser.
// Companies: GET /public/tenants (BACKEND.md §4).
const KEY = 'hris.company'

export const companyLogo = (c) => (c ? c.logo || `/logos/${c.id}.png` : null)

export const useCompany = () => {
  const api = useApi()
  const companies = useState('companies', () => [])
  const company = useState('company', () => null) // { id, name, subtitle, color, logo }
  const chosen = useState('company-chosen', () => false)
  const loading = useState('companies-loading', () => false)
  const error = useState('companies-error', () => '')

  const fetchCompanies = async () => {
    if (companies.value.length) return companies.value
    loading.value = true
    error.value = ''
    try {
      const r = await api('/public/tenants')
      companies.value = r.data || []
    } catch (e) {
      error.value = apiError(e, 'Unable to load companies.')
    } finally {
      loading.value = false
    }
    return companies.value
  }

  // Read the remembered company (browser only; call from onMounted).
  const load = async () => {
    await fetchCompanies()
    try {
      const saved = localStorage.getItem(KEY)
      const hit = companies.value.find(c => c.id === saved || c.name === saved)
      if (hit) { company.value = hit; chosen.value = true }
    } catch { /* storage blocked: user just picks again */ }
    return chosen.value
  }
  const choose = (c) => {
    company.value = c
    chosen.value = true
    try { localStorage.setItem(KEY, c.id) } catch { /* fine */ }
  }
  return { companies, company, chosen, loading, error, load, choose, fetchCompanies }
}
