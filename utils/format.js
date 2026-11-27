// Shared labels, formatters and API adapters (docs/BACKEND.md). Auto-imported by Nuxt.

// Site route key -> request type. apiType is hris_server's :type (BACKEND.md §7.1).
export const requestTypes = {
  'leave-of-absence': { title: 'Leave of Absence', desc: 'File and track leave requests.', icon: 'calendar', apiType: 'loa', app: 'LOA' },
  'call-approval': { title: 'Call Approval', desc: 'File and track call approval requests.', icon: 'phone', apiType: 'call-approval', app: 'CA' },
  'manual-arrival-departure': { title: 'Manual Arrival/Departure', desc: 'File and track manual time in/out requests.', icon: 'clock', apiType: 'manual-ad', app: 'MAD' },
  overtime: { title: 'Overtime', desc: 'File and track overtime requests.', icon: 'bolt', apiType: 'overtime', app: 'OT' },
  // Versatech only — the server answers 403 for other companies.
  'other-requests': { title: 'Other Requests', desc: 'COE, EPP, Company ID and other HR requests.', icon: 'doc', apiType: 'other', app: 'REQ', versatechOnly: true }
}

// The server's tenant db key for Versatech (Other Requests).
export const VERSATECH = 'versahrs'
export const hasOtherRequests = (user) => user?.tenant === VERSATECH

// hris_server :type -> site route key.
export const siteRouteFor = (apiType) =>
  Object.keys(requestTypes).find(k => requestTypes[k].apiType === apiType) || null

// Leave types the server accepts (LOA_TYPE_CODE in requests.controller.js).
export const LEAVE_TYPES = ['Vacation Leave', 'Sick Leave', 'Approved Leave', 'Approved UT (AM/PM)', 'Additional VL', 'Accumulated Leave']

// Other Requests codes (Versatech).
export const OTHER_TYPES = {
  ID: 'Company ID', COE: 'Certificate of Employment', EPP: 'Employee Purchase Program',
  COL: 'Company Loan', BUP: 'Benefits Upgrade', ITR: 'Income Tax Return'
}

// Status label -> badge colour (BACKEND.md §2.2).
export const badge = (s) =>
  ({
    Approved: 'ok', 'Witness Approved': 'ok',
    Posted: 'blue',
    'For Approval': 'warn', 'For Witness Approval': 'warn',
    Disapproved: 'red', 'Witness Disapproved': 'red',
    Cancelled: 'gray', Inactive: 'gray',
    Active: 'navy', Saved: 'navy'
  })[s] ?? 'navy'

export const peso = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// "2021-03-15" / ISO / "11/15/2026" -> "Mar 15, 2021". Dates from the server are Manila
// wall-clock, so a bare YYYY-MM-DD is read as a local date (no UTC shift).
export const fmtDate = (v) => {
  if (!v) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v))
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Server ISO (wall clock stored as UTC) -> "YYYY-MM-DD" / "HH:mm", without a timezone shift.
export const isoDay = (v) => (v ? String(v).slice(0, 10) : '')
export const isoClock = (v) => {
  if (!v) return ''
  const m = /T(\d{2}):(\d{2})/.exec(String(v)) || /^(\d{2}):(\d{2})/.exec(String(v))
  return m ? `${m[1]}:${m[2]}` : ''
}
// "13:05" -> "01:05 PM"
export const clock12 = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// "8:00" -> 8, "2:30" -> 2.5
export const hhmmToHours = (v) => {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return v
  const [h, m] = String(v).split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

// One row of GET /auth/requests/:type -> the request table (BACKEND.md §7.3).
export const toRequestRow = (r) => {
  const rows = Array.isArray(r.rows) ? r.rows : []
  return {
    id: r.id,
    no: r.no,
    type: r.leave_type || OTHER_TYPES[String(r.request_type || '').toUpperCase()] || r.request_type || '',
    dateFiled: r.date_applied || '',
    date: r.txn_date || r.date_applied || '',
    from: r.from_display || (rows[0] ? clock12(isoClock(rows[0].date_from)) : ''),
    to: r.to_display || (rows.length ? clock12(isoClock(rows[rows.length - 1].date_to)) : ''),
    hours: r.approved_hours && r.approved_hours !== '0:00' ? r.approved_hours : (r.applied_hours || ''),
    approver: r.approved_by || '—',
    reason: r.reason || rows.map(x => x.purpose).filter(Boolean).join('; '),
    customer: rows.map(x => x.customer).filter(Boolean).join(', '),
    status: r.status,
    raw: r
  }
}

// One row of GET /auth/approvals -> the approval cards/tables (BACKEND.md §8.2).
export const toApproval = (a) => ({
  id: `${a.type}:${a.id}`,
  apiType: a.type,
  apiId: a.id,
  name: a.employee,
  empId: a.employee_id,
  app: a.category || a.app,
  short: a.app,
  no: a.no,
  date: a.txn_date || a.date_applied,
  dateSent: a.date_sent,
  hours: a.approved_ot_hours && a.approved_ot_hours !== '0:00' ? a.approved_ot_hours : a.applied_hours,
  appliedHours: a.applied_hours,
  approvedOtHours: a.approved_ot_hours,
  detail: a.detail || a.request_type_name || '',
  reason: a.reason,
  status: a.status,
  approvedBy: a.approved_by,
  approvedDate: a.approved_date,
  isOther: a.type === 'other'
})

// Same split as hris_mobile: "records" = LOA / CA / MAD / OT, "requests" = Other Requests.
export const isRequestsModule = (app) => app === 'Other Requests'
