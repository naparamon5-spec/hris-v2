// The company (tenant) the user signs in to. hris_server puts the tenant inside the login
// token, so the company is picked BEFORE sign-in (/company-select → /login) and switching
// means signing out and in again. The last pick is remembered in this browser.
// Live: companies from GET /public/tenants; send the chosen tenant with POST /public/login.
const KEY = 'hris.company'

export const useCompany = () => {
  const { companies } = useMockData()
  const company = useState('company', () => companies[0])
  const chosen = useState('company-chosen', () => false)

  // Read the remembered company (browser only; call from onMounted).
  const load = () => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved && companies.includes(saved)) { company.value = saved; chosen.value = true }
    } catch { /* storage blocked: user just picks again */ }
    return chosen.value
  }
  const choose = (c) => {
    company.value = c
    chosen.value = true
    try { localStorage.setItem(KEY, c) } catch { /* fine */ }
  }
  return { companies, company, chosen, load, choose }
}
