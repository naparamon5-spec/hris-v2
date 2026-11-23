// Mock data mirroring the hris_mobile app screens. Frontend only — no API calls.
export type Status = 'Approved' | 'For Approval' | 'Disapproved' | 'Cancelled' | 'Draft'

export interface RequestRecord {
  no: string
  type: string
  dateFiled: string
  date: string
  from?: string
  to?: string
  hours: number
  reason: string
  approver: string
  status: Status
}

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
} as const
export type RequestTypeKey = keyof typeof requestTypes

const approvers = ['Ramon Napa', 'Kristine Samonte', 'Vincent Cataylo']
const statuses: Status[] = ['Approved', 'For Approval', 'Approved', 'Disapproved', 'Cancelled', 'Approved', 'For Approval']
const reasons = ['Family matter', 'Client meeting in Makati', 'Medical check-up', 'Network deployment', 'Personal errand', 'Year-end inventory']

function makeRecords(key: RequestTypeKey, prefix: string): RequestRecord[] {
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
      reason: reasons[i % reasons.length],
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

  const leaveHours = {
    summary: [
      { label: 'VL Paid', value: 68 }, { label: 'SL Paid', value: 48 },
      { label: 'Additional VL', value: 8 }, { label: 'Accumulated Leave', value: 124 }
    ],
    approvedLeave: [
      { date: 'Nov 3, 2026', type: 'Vacation Leave', hours: 8 },
      { date: 'Oct 14, 2026', type: 'Sick Leave', hours: 8 },
      { date: 'Sep 22, 2026', type: 'Vacation Leave', hours: 16 },
      { date: 'Aug 8, 2026', type: 'Birthday Leave', hours: 8 }
    ],
    approvedUt: [
      { date: 'Oct 30, 2026', type: 'PM Undertime', hours: 4 },
      { date: 'Sep 5, 2026', type: 'AM Undertime', hours: 4 }
    ]
  }

  // Shared state so records created in the UI persist while navigating.
  const requests = useState<Record<RequestTypeKey, RequestRecord[]>>('mock-requests', () => ({
    'leave-of-absence': makeRecords('leave-of-absence', 'LOA'),
    'call-approval': makeRecords('call-approval', 'CA'),
    'manual-arrival-departure': makeRecords('manual-arrival-departure', 'MAD'),
    overtime: makeRecords('overtime', 'OT'),
    'other-requests': makeRecords('other-requests', 'OR')
  }))

  const recentActivity = [
    { title: 'Overtime approved', meta: 'OT-2026-0140 • by Ramon Napa', when: '2h ago', status: 'Approved' as Status },
    { title: 'Leave of Absence filed', meta: 'LOA-2026-0139 • Vacation Leave', when: 'Yesterday', status: 'For Approval' as Status },
    { title: 'Payslip released', meta: 'Period 22 • Nov 1–15', when: 'Nov 15', status: 'Approved' as Status },
    { title: 'Call Approval disapproved', meta: 'CA-2026-0137 • Site Visit', when: 'Nov 12', status: 'Disapproved' as Status }
  ]

  const approvals = [
    { id: 1, name: 'Maria Santos', empId: 'AN-0012', app: 'Overtime', no: 'OT-2026-0211', date: 'Nov 21, 2026', hours: 3, detail: 'Regular OT • 06:00 PM – 09:00 PM', status: 'For Approval' as Status },
    { id: 2, name: 'Jose Reyes', empId: 'AN-0034', app: 'Leave of Absence', no: 'LOA-2026-0310', date: 'Nov 25, 2026', hours: 8, detail: 'Sick Leave • Whole day', status: 'For Approval' as Status },
    { id: 3, name: 'Liza Garcia', empId: 'AN-0078', app: 'Call Approval', no: 'CA-2026-0098', date: 'Nov 20, 2026', hours: 4, detail: 'Client Call • BGC', status: 'For Approval' as Status },
    { id: 4, name: 'Mark Bautista', empId: 'AN-0067', app: 'Manual Arrival/Departure', no: 'MAD-2026-0044', date: 'Nov 19, 2026', hours: 0, detail: 'Manual Arrival • 08:47 AM', status: 'For Approval' as Status },
    { id: 5, name: 'Paolo Mendoza', empId: 'AN-0090', app: 'Overtime', no: 'OT-2026-0207', date: 'Nov 18, 2026', hours: 2.5, detail: 'Rest Day OT • 09:00 AM – 11:30 AM', status: 'For Approval' as Status },
    { id: 6, name: 'Ana Villanueva', empId: 'AN-0051', app: 'Other Requests', no: 'OR-2026-0019', date: 'Nov 17, 2026', hours: 0, detail: 'Certificate of Employment', status: 'For Approval' as Status }
  ]

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

  const timesheet = Array.from({ length: 11 }, (_, i) => {
    const d = 16 + i
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(d + 0) % 7]
    const weekend = dow === 'Sat' || dow === 'Sun'
    return {
      date: `Nov ${d}`, dow,
      in: weekend ? '—' : ['08:52', '09:04', '08:41', '08:58', '09:17'][i % 5],
      out: weekend ? '—' : ['18:04', '18:10', '17:55', '19:30', '18:22'][i % 5],
      late: !weekend && i % 5 === 4 ? 17 : 0,
      ot: !weekend && i % 5 === 3 ? 1.5 : 0,
      totalHrs: weekend ? 0 : 8,
      remarks: weekend ? 'Rest day' : i % 5 === 4 ? 'Late' : ''
    }
  })

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

  const whosOut: Record<number, { name: string; type: string; kind: 'leave' | 'call' }[]> = {
    3: [{ name: 'Vincent Cataylo', type: 'Vacation Leave', kind: 'leave' }],
    10: [{ name: 'Jose Reyes', type: 'Sick Leave', kind: 'leave' }, { name: 'Liza Garcia', type: 'Client Call', kind: 'call' }],
    14: [{ name: 'Abner Padilla', type: 'Vacation Leave', kind: 'leave' }],
    18: [{ name: 'Mark Bautista', type: 'Emergency Leave', kind: 'leave' }],
    23: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }, { name: 'Paolo Mendoza', type: 'Site Visit', kind: 'call' }],
    24: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }],
    25: [{ name: 'Ana Villanueva', type: 'Vacation Leave', kind: 'leave' }, { name: 'Jose Reyes', type: 'Sick Leave', kind: 'leave' }],
    27: [{ name: 'Maria Santos', type: 'Client Call', kind: 'call' }]
  }

  const notifications = [
    { id: 1, title: 'Overtime approved', body: 'Your OT-2026-0140 was approved by Ramon Napa.', when: '2h ago', unread: true },
    { id: 2, title: 'New approval request', body: 'Maria Santos filed an Overtime request for Nov 21.', when: '5h ago', unread: true },
    { id: 3, title: 'Payslip available', body: 'Your payslip for Nov 1 – 15 is ready to view.', when: 'Nov 15', unread: false },
    { id: 4, title: 'Call Approval disapproved', body: 'CA-2026-0137 was disapproved. Reason: incomplete details.', when: 'Nov 12', unread: false },
    { id: 5, title: 'Holiday advisory', body: 'Nov 30 (Bonifacio Day) is a regular holiday.', when: 'Nov 10', unread: false }
  ]

  const certificates = [
    { name: 'Cisco CCNA', level: 2, earned: 3, total: 4, status: 'Active' },
    { name: 'Fortinet NSE', level: 4, earned: 2, total: 4, status: 'Active' },
    { name: 'AWS Cloud Practitioner', level: 1, earned: 1, total: 1, status: 'Active' }
  ]

  const companies = ['Ardent Networks Inc.', 'Lamco International', 'Match', 'Fastronics', 'Diamond Concept', 'Diamond Office', 'Overland', 'Versatech International', 'EZ Touch', 'Real Modern Design', 'HRIS Test']

  const badge = (s: string) =>
    ({ Approved: 'ok', 'For Approval': 'warn', Draft: 'navy', Disapproved: 'red', Cancelled: 'gray' } as Record<string, string>)[s] ?? 'navy'

  const peso = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return {
    user, leaveCredits, leaveHours, requests, recentActivity, approvals, payslips, timesheet,
    directory, whosOut, notifications, certificates, companies, badge, peso
  }
}
