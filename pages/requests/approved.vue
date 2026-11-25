<template><div /></template>

<script setup>
// Old link: Approved Records moved to a tab on the approver-only Approvals page.
definePageMeta({ middleware: () => navigateTo('/approvals?tab=records', { replace: true }) })
</script>
