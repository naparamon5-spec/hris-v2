// Payslips (docs/BACKEND.md §9.1–9.2): GET /auth/payslips, GET /auth/payslips/:id.
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// "MM/DD/YYYY" -> Date (local)
const mdy = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s || ''))
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null
}
// "11/01/2026 - 11/15/2026" -> "Nov 1 – 15" (or "Nov 16 – Dec 1")
const rangeLabel = (period) => {
  const [a, b] = String(period || '').split(/\s*-\s*/).map(mdy)
  if (!a) return String(period || '')
  if (!b) return `${MON[a.getMonth()]} ${a.getDate()}`
  return a.getMonth() === b.getMonth()
    ? `${MON[a.getMonth()]} ${a.getDate()} – ${b.getDate()}`
    : `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}`
}
// "₱42,500.00" -> 42500
const money = (v) => (typeof v === 'number' ? v : Number(String(v || '0').replace(/[^\d.-]/g, '')) || 0)

export const toPayslip = (p) => {
  const start = mdy(String(p.period || '').split(/\s*-\s*/)[0])
  const pay = mdy(p.pay_date)
  return {
    id: p.id,
    period: Number(String(p.id).split('-')[1]) || p.id,
    year: String(p.id).split('-')[0],
    label: rangeLabel(p.period),
    half: start ? (start.getDate() <= 15 ? '1' : '2') : '',
    payDate: pay ? `${MON[pay.getMonth()]} ${pay.getDate()}, ${pay.getFullYear()}` : (p.pay_date || ''),
    monthShort: pay ? MON[pay.getMonth()] : '',
    gross: money(p.gross),
    deductions: money(p.deductions),
    net: money(p.net),
    earnings: (p.earnings || []).map(e => ({ label: e.label, amount: money(e.amount) })),
    deductionItems: (p.deduction_items || []).map(d => ({ label: d.label, amount: money(d.amount) }))
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Payslip PDF, built in the browser like the mobile app (payslip_pdf.dart) — no PDF endpoint.
// Opens a print view with one page per payslip; the browser's "Save as PDF" makes the file.
export const printPayslips = (slips, me, logo) => {
  const w = window.open('', '_blank')
  if (!w) return false
  const bg = me.background || {}
  const page = (s) => `
    <section class="slip">
      <header>${logo ? `<img src="${esc(logo)}" alt="">` : ''}<div><h1>PAYSLIP</h1><p>${esc(me.company)}</p></div></header>
      <table class="emp">
        <tr><td>Employee</td><td>${esc(me.name)}</td><td>Employee ID</td><td>${esc(me.id)}</td></tr>
        <tr><td>Department</td><td>${esc(me.department)}</td><td>Period</td><td>${esc(s.period)} · ${esc(s.label)}</td></tr>
        <tr><td>SSS</td><td>${esc(bg.sss || '—')}</td><td>TIN</td><td>${esc(bg.tin || '—')}</td></tr>
        <tr><td>Pay date</td><td colspan="3">${esc(s.payDate)}</td></tr>
      </table>
      <div class="cols">
        <table><tr><th colspan="2">Earnings</th></tr>
          ${s.earnings.map(e => `<tr><td>${esc(e.label)}</td><td class="n">${esc(peso(e.amount))}</td></tr>`).join('')}
          <tr class="t"><td>Gross Pay</td><td class="n">${esc(peso(s.gross))}</td></tr></table>
        <table><tr><th colspan="2">Deductions</th></tr>
          ${s.deductionItems.map(d => `<tr><td>${esc(d.label)}</td><td class="n">${esc(peso(d.amount))}</td></tr>`).join('')}
          <tr class="t"><td>Total Deductions</td><td class="n">${esc(peso(s.deductions))}</td></tr></table>
      </div>
      <p class="net">Net Pay <b>${esc(peso(s.net))}</b></p>
    </section>`
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Payslips_${slips.length}</title>
    <style>
      body { font: 12px/1.45 Montserrat, Arial, sans-serif; color: #133341; margin: 0; }
      .slip { padding: 28px 32px; page-break-after: always; }
      .slip:last-child { page-break-after: auto; }
      header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #c6324c; padding-bottom: 10px; margin-bottom: 14px; }
      header img { height: 40px; }
      h1 { margin: 0; font-size: 18px; letter-spacing: .12em; color: #c6324c; }
      header p { margin: 0; }
      table { width: 100%; border-collapse: collapse; }
      .emp td { padding: 3px 6px; }
      .emp td:nth-child(odd) { color: #6b7a86; width: 18%; }
      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
      th { text-align: left; border-bottom: 1px solid #d5dbe0; padding: 4px 0; }
      .cols td { padding: 3px 0; }
      .n { text-align: right; }
      .t td { border-top: 1px solid #d5dbe0; font-weight: 700; }
      .net { margin-top: 18px; text-align: right; font-size: 14px; }
      .net b { font-size: 18px; margin-left: 10px; }
    </style></head><body>${slips.map(page).join('')}
    <script>window.onload = () => { window.focus(); window.print(); }<\/script></body></html>`)
  w.document.close()
  return true
}

// Payslip password (POST /auth/verify-password). The server does not tie it to the payslip
// request yet — the gate is client-side, same as mobile (BACKEND.md §0 #10, G11).
export const verifyPassword = async (api, password) => {
  try {
    const r = await api('/auth/verify-password', { method: 'POST', body: { password } })
    return r?.valid !== false ? '' : 'Incorrect password. Please try again.'
  } catch (e) {
    return apiError(e, 'Incorrect password. Please try again.')
  }
}
