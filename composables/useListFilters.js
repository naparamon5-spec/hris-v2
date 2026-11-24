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
