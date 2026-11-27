// Approver inbox shared by the Approvals page, the sidebar and Home (docs/BACKEND.md §8).
//   GET /auth/approvals/access
//   GET /auth/approvals?scope=pending|history&module=records|requests|witness
export const useApprovals = () => {
  const { access, reloadAccess, user } = useSession()
  const canApprove = computed(() => !!(access.value?.isApprover || access.value?.isWitness))
  // Other Requests are Versatech's (HR managers approve them).
  const approvesRequests = computed(() => !!access.value?.isApprover && hasOtherRequests(user.value))
  const pendingCount = computed(() => {
    const a = access.value || {}
    return (a.pending || 0) + (a.pendingRequests || 0) + (a.pendingWitness || 0)
  })
  return { access, canApprove, approvesRequests, pendingCount, reloadAccess }
}
