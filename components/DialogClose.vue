<template>
  <!-- Top-right X for dialogs. Does the same as the dialog's Cancel button.
       The dialog box needs position: relative. -->
  <button type="button" class="dialog-x" :aria-label="label" :title="label">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
</template>

<script setup>
defineProps({ label: { type: String, default: 'Close' } })
</script>

<style scoped>
.dialog-x {
  position: absolute; top: .75rem; right: .75rem; z-index: 2;
  width: 34px; height: 34px; border-radius: 50%; border: 0;
  display: grid; place-items: center; cursor: pointer;
  background: transparent; color: var(--muted);
  transition: background .15s, color .15s;
}
.dialog-x:hover { background: #f1f2f4; color: var(--text); }
.dialog-x:focus-visible { outline: none; box-shadow: var(--ring); color: var(--text); }
</style>
