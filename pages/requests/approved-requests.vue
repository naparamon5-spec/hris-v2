<template><div /></template>

<script setup>
// Old link: Approved Requests moved to a tab on the approver-only Approvals page.
definePageMeta({ middleware: () => navigateTo('/approvals?tab=requests', { replace: true }) })
</script>
