<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
  <ConfirmDialog />
</template>

<script setup>
// Browser tab title: "HRIS | <page>"
const route = useRoute()
const PAGES = {
  '/': 'Home',
  '/login': 'Sign in',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/change-password': 'Change Password',
  '/examination': 'For Examination',
  '/company-select': 'Switch Company',
  '/requests': 'Requests',
  '/requests/approved': 'Approved Records',
  '/requests/approved-requests': 'Approved Requests',
  '/whos-out': "Who's Out",
  '/approvals': 'Approvals',
  '/payroll': 'Payroll',
  '/directory': 'Directory',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/leave-hours': 'Leave Hours',
  '/timesheet': 'Timesheet',
  '/support': 'Support',
  '/privacy-policy': 'Privacy Policy'
}
const page = computed(() => {
  const p = route.path.replace(/\/+$/, '') || '/'
  if (PAGES[p]) return PAGES[p]
  if (p.startsWith('/payroll/')) return 'Payslip'
  if (p.startsWith('/requests/')) return requestTypes[route.params.type]?.title || 'Requests'
  return ''
})
useHead({ title: () => (page.value ? `HRIS | ${page.value}` : 'HRIS') })
</script>
