// Helpers for the FilterMenu on list pages.
//   inDateRange('Nov 22, 2026', '2026-11-01', '2026-11-30') -> true
//   uniq(rows, r => r.approver) -> sorted distinct values for a select
const toDay = (v) => {
  if (!v) return null
  // 'YYYY-MM-DD' from <input type="date"> → local midnight (avoid UTC shift)
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  const d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(v)
  if (isNaN(d)) return null
  d.setHours(0, 0, 0, 0)
  return d
}

export const inDateRange = (value, from, to) => {
  if (!from && !to) return true
  const d = toDay(value)
  if (!d) return false
  const f = toDay(from), t = toDay(to)
  return (!f || d >= f) && (!t || d <= t)
}

export const uniq = (rows, pick) =>
  [...new Set(rows.map(pick).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)))

// Lists always show the latest first, whatever order the server sends.
// dateOf: row -> date (string like "Nov 21, 2026", ISO, or Date); tieOf: row -> value for
// same-day rows (e.g. the request no., higher = newer).
export const newestFirst = (list, dateOf, tieOf = () => 0) => {
  const t = (r) => { const v = new Date(dateOf(r)).getTime(); return Number.isNaN(v) ? 0 : v }
  return [...list].sort((a, b) => (t(b) - t(a)) || String(tieOf(b)).localeCompare(String(tieOf(a)), undefined, { numeric: true }))
}
