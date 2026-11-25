// Mock data mirroring the hris_mobile app screens. Frontend only — no API calls.
// Request statuses: 'Approved' | 'For Approval' | 'Disapproved' | 'Cancelled' | 'Draft'

export const requestTypes = {
  'leave-of-absence': {
    title: 'Leave of Absence', desc: 'File and track leave requests.', icon: 'calendar',
    subtypes: ['Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Bereavement Leave', 'Birthday Leave']
  },
  'call-approval': {
    title: 'Call Approval', desc: 'File and track call approval requests.', icon: 'phone',
    subtypes: ['Client Call', 'Site Visit', 'Field Work']
  },
  'manual-arrival-departure': {
    title: 'Manual Arrival/Departure', desc: 'File and track manual time in/out requests.', icon: 'clock',
    subtypes: ['Manual Arrival', 'Manual Departure']
  },
  overtime: {
    title: 'Overtime', desc: 'File and track overtime requests.', icon: 'bolt',
    subtypes: ['Regular OT', 'Rest Day OT', 'Holiday OT']
  },
  'other-requests': {
    title: 'Other Requests', desc: 'COE, EPP items and other HR requests.', icon: 'doc',
    subtypes: ['Certificate of Employment', 'EPP Item', 'ID Replacement', 'Company Loan']
  }
}

const approvers = ['Ramon Napa', 'Kristine Samonte', 'Vincent Cataylo']
const statuses = ['Approved', 'For Approval', 'Posted', 'Disapproved', 'Cancelled', 'Approved', 'For Approval', 'Posted']
const reasons = ['Family matter', 'Client meeting in Makati', 'Medical check-up', 'Network deployment', 'Personal errand', 'Year-end inventory']
const purposes = ['Site survey for network upgrade', 'Firewall configuration', 'Quarterly business review', 'On-site troubleshooting', 'Product demo', 'Cabling inspection']
const customers = ['ACME Corp', 'BGC Tower 3', 'Makati Medical Center', 'SM Megamall', 'Globe Telecom', 'Ayala Land']

function makeRecords(key, prefix) {
  const subs = requestTypes[key].subtypes
  return Array.from({ length: 9 }, (_, i) => {
    const day = 22 - i * 2
    return {
      no: `${prefix}-2026-${String(140 - i).padStart(4, '0')}`,
      type: subs[i % subs.length],
      dateFiled: `Nov ${Math.max(day - 1, 1)}, 2026`,
      date: `Nov ${Math.max(day, 1)}, 2026`,
      from: key === 'leave-of-absence' ? '08:00 AM' : '06:00 PM',
      to: key === 'leave-of-absence' ? '05:00 PM' : '09:00 PM',
      hours: key === 'leave-of-absence' ? 8 : 3,
      reason: key === 'call-approval' ? purposes[i % purposes.length] : reasons[i % reasons.length],
      ...(key === 'call-approval' ? { customer: customers[i % customers.length] } : {}),
      approver: approvers[i % approvers.length],
      status: statuses[i % statuses.length]
    }
  })
}

export const useMockData = () => {
  const user = {
    name: 'Juan Dela Cruz', initials: 'JD', id: 'AN-0142', role: 'Network Engineer', department: 'Technical',
    company: 'Ardent Networks, Inc.', email: 'juan.delacruz@ardentnetworks.com.ph', phone: '+63 917 555 0142',
    hired: 'Mar 15, 2021', manager: 'Ramon Napa', bio: 'Keeping the network up so everyone else can power innovation.'
  }

  const leaveCredits = [
    { label: 'Vacation Leave', value: 8.5, unit: 'days' },
    { label: 'Sick Leave', value: 6, unit: 'days' },
    { label: 'Approved Leave', value: 7, unit: 'days' },
    { label: 'Approved UT (AM/PM)', value: 2, unit: 'times' }
  ]

  // Leave Hours — same shape as hris_server GET /auth/leaves/hours ("hh:mm" strings;
  // null = leave type not assigned to the employee, so its card is hidden like mobile).
  const leaveHours = {
    approved_leave: '16:00', approved_ut: '08:00',
    approved_leave_used: '24:00', approved_ut_used: '08:00',
    vl_paid: '68:00', sl_paid: '48:00', additional_vl: '08:00', accumulated_leave: '124:00'
  }

  // Shared state so records created in the UI persist while navigating.
  const requests = useState('mock-requests', () => ({
    'leave-of-absence': makeRecords('leave-of-absence', 'LOA'),
    'call-approval': makeRecords('call-approval', 'CA'),
    'manual-arrival-departure': makeRecords('manual-arrival-departure', 'MAD'),
    overtime: makeRecords('overtime', 'OT'),
    'other-requests': makeRecords('other-requests', 'OR')
  }))

  const recentActivity = [
    { title: 'Overtime approved', meta: 'OT-2026-0140 • by Ramon Napa', when: '2h ago', status: 'Approved' },
    { title: 'Leave of Absence filed', meta: 'LOA-2026-0139 • Vacation Leave', when: 'Yesterday', status: 'For Approval' },
    { title: 'Payslip released', meta: 'Period 22 • Nov 1–15', when: 'Nov 15', status: 'Approved' },
    { title: 'Call Approval disapproved', meta: 'CA-2026-0137 • Site Visit', when: 'Nov 12', status: 'Disapproved' }
  ]

  const approvals = [
    { id: 1, name: 'Maria Santos', empId: 'AN-0012', app: 'Overtime', no: 'OT-2026-0211', date: 'Nov 21, 2026', hours: 3, detail: 'Regular OT • 06:00 PM – 09:00 PM', reason: 'Release deployment for client go-live', status: 'For Approval' },
    { id: 2, name: 'Jose Reyes', empId: 'AN-0034', app: 'Leave of Absence', no: 'LOA-2026-0310', date: 'Nov 25, 2026', hours: 8, detail: 'Sick Leave • Whole day', reason: 'Fever and check-up', status: 'For Approval' },
    { id: 3, name: 'Liza Garcia', empId: 'AN-0078', app: 'Call Approval', no: 'CA-2026-0098', date: 'Nov 20, 2026', hours: 4, detail: 'Client Call • BGC', reason: 'Quarterly business review', customer: 'BGC Tower 3', status: 'For Approval' },
    { id: 4, name: 'Mark Bautista', empId: 'AN-0067', app: 'Manual Arrival/Departure', no: 'MAD-2026-0044', date: 'Nov 19, 2026', hours: 0, detail: 'Manual Arrival • 08:47 AM', reason: 'Biometric scanner was offline', status: 'For Approval' },
    { id: 5, name: 'Paolo Mendoza', empId: 'AN-0090', app: 'Overtime', no: 'OT-2026-0207', date: 'Nov 18, 2026', hours: 2.5, detail: 'Rest Day OT • 09:00 AM – 11:30 AM', reason: 'Weekend server migration', status: 'For Approval' },
    { id: 6, name: 'Ana Villanueva', empId: 'AN-0051', app: 'Other Requests', no: 'OR-2026-0019', date: 'Nov 17, 2026', hours: 0, detail: 'Certificate of Employment', reason: 'Bank loan requirement', status: 'For Approval' },
    // Already decided by this approver (GET /auth/approvals?scope=history). They show on
    // Approved Records (LOA/CA/MAD/OT) and Approved Requests (Other Requests), not on Approvals.
    { id: 7, name: 'Maria Santos', empId: 'AN-0012', app: 'Overtime', no: 'OT-2026-0198', date: 'Nov 14, 2026', hours: 2, detail: 'Regular OT • 06:00 PM – 08:00 PM', reason: 'Month-end report', status: 'Approved' },
    { id: 8, name: 'Jose Reyes', empId: 'AN-0034', app: 'Leave of Absence', no: 'LOA-2026-0297', date: 'Nov 12, 2026', hours: 8, detail: 'Vacation Leave • Whole day', reason: 'Family matter', status: 'Posted' },
    { id: 9, name: 'Liza Garcia', empId: 'AN-0078', app: 'Call Approval', no: 'CA-2026-0091', date: 'Nov 11, 2026', hours: 3, detail: 'Client Call • Makati', reason: 'Network assessment', customer: 'Ayala Tower One', status: 'Approved' },
    { id: 10, name: 'Mark Bautista', empId: 'AN-0067', app: 'Manual Arrival/Departure', no: 'MAD-2026-0039', date: 'Nov 10, 2026', hours: 0, detail: 'Manual Departure • 06:12 PM', reason: 'Forgot to time out', status: 'Disapproved' },
    { id: 11, name: 'Paolo Mendoza', empId: 'AN-0090', app: 'Leave of Absence', no: 'LOA-2026-0288', date: 'Nov 7, 2026', hours: 8, detail: 'Sick Leave • Whole day', reason: 'Flu', status: 'Posted' },
    { id: 12, name: 'Ana Villanueva', empId: 'AN-0051', app: 'Overtime', no: 'OT-2026-0181', date: 'Nov 5, 2026', hours: 4, detail: 'Rest Day OT • 09:00 AM – 01:00 PM', reason: 'Data center move', status: 'Cancelled' },
    { id: 13, name: 'Liza Garcia', empId: 'AN-0078', app: 'Other Requests', no: 'OR-2026-0016', date: 'Nov 8, 2026', hours: 0, detail: 'Certificate of Employment', reason: 'Visa application', status: 'Approved' },
    { id: 14, name: 'Jose Reyes', empId: 'AN-0034', app: 'Other Requests', no: 'OR-2026-0012', date: 'Oct 29, 2026', hours: 0, detail: 'EPP Item', reason: 'Laptop purchase plan', status: 'Disapproved' }
  ]

  // Stand-in for GET /auth/approvals/access. Approvals (with Approved Records) shows only
  // when isApprover or isWitness; the Approved Requests tab only when approvesRequests
  // (HR managers who decide Other Requests).
  const approvalAccess = { isApprover: true, approvesRequests: true, isWitness: false }

  const payslips = Array.from({ length: 8 }, (_, i) => {
    const half = i % 2 === 0 ? 'Nov 16 – 30' : 'Nov 1 – 15'
    const monthIdx = 10 - Math.floor(i / 2)
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIdx]
    return {
      period: 23 - i,
      label: half.replace('Nov', month),
      payDate: `${month} ${i % 2 === 0 ? 30 : 15}, 2026`,
      gross: 42500 + (i % 3) * 1250,
      deductions: 7380 + (i % 2) * 220,
      get net() { return this.gross - this.deductions },
      earnings: [
        { label: 'Basic Pay', amount: 37500 }, { label: 'Overtime', amount: 2750 + (i % 3) * 1250 },
        { label: 'Night Differential', amount: 650 }, { label: 'Allowances', amount: 1600 }
      ],
      deductionItems: [
        { label: 'Withholding Tax', amount: 4950 }, { label: 'SSS', amount: 1350 },
        { label: 'PhilHealth', amount: 937.5 }, { label: 'Pag-IBIG', amount: 142.5 + (i % 2) * 220 }
      ]
    }
  })

  // Timesheet — same shapes as hris_server:
  //   GET /auth/pay-periods?type=timesheet -> { data: [{ code, year, range, date_from, date_to }] }
  //   GET /auth/timesheets/<year>-<code>   -> { data: [Day], totals, total }
  // Semi-monthly periods: 1st half = odd code (1–15), 2nd half = even code (16–end).
  // Only periods that have started by "today" are listed, like the server's ts_timesheet.
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad2 = (n) => String(n).padStart(2, '0')
  const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const periodDates = (year, n) => {
    const m = Math.floor((n - 1) / 2)
    const first = n % 2 === 1
    return { from: new Date(year, m, first ? 1 : 16), to: new Date(year, m, first ? 15 : new Date(year, m + 1, 0).getDate()) }
  }
  const timesheetPeriods = (year) => {
    const today = new Date()
    const out = []
    for (let n = 1; n <= 24; n++) {
      const { from, to } = periodDates(year, n)
      if (from > today) break
      out.push({
        code: String(n).padStart(3, '0'), year: String(year),
        range: `${MON[from.getMonth()]} ${pad2(from.getDate())} – ${MON[to.getMonth()]} ${pad2(to.getDate())}`,
        date_from: iso(from), date_to: iso(to)
      })
    }
    return out.reverse() // newest first
  }
  const HOLIDAYS = { '01-01': 'Legal Holiday', '04-09': 'Legal Holiday', '05-01': 'Legal Holiday', '06-12': 'Legal Holiday', '08-21': 'Special Holiday', '11-01': 'Special Holiday', '11-30': 'Legal Holiday', '12-25': 'Legal Holiday', '12-30': 'Legal Holiday' }
  const timesheetFor = (year, code) => {
    const { from, to } = periodDates(Number(year), Number(code))
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const ins = ['08:52', '09:04', '08:41', '08:58', '09:17', '08:47', '08:33']
    const outs = ['18:04', '18:10', '17:55', '19:30', '18:22', '18:01', '20:05']
    const data = []
    for (let d = new Date(from); d <= to && d <= today; d.setDate(d.getDate() + 1)) {
      const seed = d.getDate() + d.getMonth() * 31
      const dow = d.getDay()
      const holiday = HOLIDAYS[`${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`]
      const rest = dow === 0 || dow === 6
      const leave = !rest && !holiday && seed % 13 === 5
      const worked = !rest && !holiday && !leave
      const tin = worked ? ins[seed % ins.length] : ''
      const tout = worked ? outs[seed % outs.length] : ''
      const ot = worked && (tout === '19:30' || tout === '20:05') ? (tout === '20:05' ? 2 : 1.5) : 0
      const late = worked && tin > '09:00'
      data.push({
        date: iso(d),
        day_type: holiday || (rest ? (dow === 6 ? 'Saturday' : 'Sunday') : leave ? 'Vacation Leave' : 'Regular'),
        leave_type: leave ? 'Vacation Leave' : '',
        time_in: tin, time_out: tout,
        basic_hrs: worked ? 8 : 0, basic_nd_hrs: 0,
        ot_hrs: ot, nd_ot_hrs: 0,
        leave_hrs: leave ? 8 : 0,
        total_hrs: (worked ? 8 : 0) + ot + (leave ? 8 : 0),
        remarks: late ? 'Late' : ''
      })
    }
    const totals = data.reduce((t, r) => ({
      basic: t.basic + r.basic_hrs, basic_nd: t.basic_nd + r.basic_nd_hrs, ot: t.ot + r.ot_hrs,
      nd_ot: t.nd_ot + r.nd_ot_hrs, leave: t.leave + r.leave_hrs, total: t.total + r.total_hrs
    }), { basic: 0, basic_nd: 0, ot: 0, nd_ot: 0, leave: 0, total: 0 })
    return { data, totals, total: data.length }
  }

  const directory = [
    { name: 'Ramon Napa', role: 'IT Manager', department: 'Technical', email: 'r.napa@ardent.example', local: '214' },
    { name: 'Kristine Samonte', role: 'MarCom Lead', department: 'Marketing', email: 'k.samonte@ardent.example', local: '305' },
    { name: 'Maria Santos', role: 'Account Manager', department: 'Sales', email: 'm.santos@ardent.example', local: '118' },
    { name: 'Jose Reyes', role: 'Network Engineer', department: 'Technical', email: 'j.reyes@ardent.example', local: '221' },
    { name: 'Ana Villanueva', role: 'Payroll Officer', department: 'Finance', email: 'a.villanueva@ardent.example', local: '410' },
    { name: 'Mark Bautista', role: 'MarCom Specialist', department: 'Marketing', email: 'm.bautista@ardent.example', local: '306' },
    { name: 'Liza Garcia', role: 'HR Generalist', department: 'Human Resources', email: 'l.garcia@ardent.example', local: '502' },
    { name: 'Paolo Mendoza', role: 'Pre-Sales Engineer', department: 'Technical', email: 'p.mendoza@ardent.example', local: '225' },
    { name: 'Vincent Cataylo', role: 'Operations Supervisor', department: 'Operations', email: 'v.cataylo@ardent.example', local: '601' },
    { name: 'Abner Padilla', role: 'Logistics Officer', department: 'Operations', email: 'a.padilla@ardent.example', local: '604' }
  ]

  const whosOut = {
    3: [{ name: 'Vincent Cataylo', type: 'Vacation Leave', kind: 'leave' }],
    10: [{ name: 'Jose Reyes', type: 'Sick Leave', kind: 'leave' }, { name: 'Liza Garcia', type: 'Client Call', kind: 'call' }],
    14: [{ name: 'Abner Padilla', type: 'Vacation Leave', kind: 'leave' }],
    18: [{ name: 'Mark Bautista', type: 'Emergency Leave', kind: 'leave' }],
    23: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }, { name: 'Paolo Mendoza', type: 'Site Visit', kind: 'call' }],
    24: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }],
    25: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }, { name: 'Jose Reyes', type: 'Sick Leave', kind: 'leave' }],
    27: [{ name: 'Maria Santos', type: 'Client Call', kind: 'call' }]
  }

  // Shared so the header bell count updates when items are read.
  const notifications = useState('mock-notifications', () => [
    { id: 1, title: 'Overtime approved', body: 'Your OT-2026-0140 was approved by Ramon Napa.', when: '2h ago', unread: true, kind: 'Requests' },
    { id: 2, title: 'New approval request', body: 'Maria Santos filed an Overtime request for Nov 21.', when: '5h ago', unread: true, kind: 'Approvals' },
    { id: 3, title: 'Payslip available', body: 'Your payslip for Nov 1 – 15 is ready to view.', when: 'Nov 15', unread: false, kind: 'Payroll' },
    { id: 4, title: 'Call Approval disapproved', body: 'CA-2026-0137 was disapproved. Reason: incomplete details.', when: 'Nov 12', unread: false, kind: 'Requests' },
    { id: 5, title: 'Holiday advisory', body: 'Nov 30 (Bonifacio Day) is a regular holiday.', when: 'Nov 10', unread: false, kind: 'Advisory' }
  ])

  const certificates = [
    { name: 'Cisco CCNA', level: 2, earned: 3, total: 4, status: 'Active' },
    { name: 'Fortinet NSE', level: 4, earned: 2, total: 4, status: 'Active' },
    { name: 'AWS Cloud Practitioner', level: 1, earned: 1, total: 1, status: 'Active' }
  ]

  const companies = ['Ardent Networks Inc.', 'Lamco International', 'Match', 'Fastronics', 'Diamond Concept', 'Diamond Office', 'Overland', 'Versatech International', 'EZ Touch', 'Real Modern Design', 'HRIS Test']

  // Logo file per company (public/logos/<id>.png, from hris_mobile assets/logos).
  const logoIds = {
    'Ardent Networks Inc.': 'ardent', 'Lamco International': 'lamco', Match: 'match', Fastronics: 'fastronics',
    'Diamond Concept': 'diamond_concept', 'Diamond Office': 'diamond_office', Overland: 'overland',
    'Versatech International': 'versatech', 'EZ Touch': 'ez_touch', 'Real Modern Design': 'rmd'
  }
  const companyLogo = (name) => (logoIds[name] ? `/logos/${logoIds[name]}.png` : null)

  const badge = (s) =>
    ({
      Approved: 'ok', 'Witness Approved': 'ok', // green
      Posted: 'blue',                            // blue — processed by payroll
      'For Approval': 'warn', 'For Witness Approval': 'warn',
      Disapproved: 'red', 'Witness Disapproved': 'red',
      Cancelled: 'gray', Inactive: 'gray',
      Active: 'navy', Saved: 'navy', Draft: 'navy'
    })[s] ?? 'navy'

  const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return {
    user, leaveCredits, leaveHours, requests, recentActivity, approvals, approvalAccess, payslips, timesheetPeriods, timesheetFor,
    directory, whosOut, notifications, certificates, companies, companyLogo, badge, peso
  }
}
