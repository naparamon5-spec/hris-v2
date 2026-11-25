// Approver inbox shared by the Approvals page tabs, the sidebar and Home.
// Replace with: GET /auth/approvals/access, and GET /auth/approvals?scope=pending|history&module=records|requests
export const useApprovals = () => {
  const { approvals, approvalAccess } = useMockData()
  const items = useState('mock-approvals', () => approvals.map(a => ({ ...a })))
  const access = approvalAccess
  const canApprove = access.isApprover || access.isWitness
  const pending = computed(() => items.value.filter(t => t.status === 'For Approval'))
  return { items, access, canApprove, pending }
}

// Same split as hris_mobile: "records" = LOA / CA / MAD / OT, "requests" = Other Requests.
export const isRequestsModule = (app) => app === 'Other Requests'
