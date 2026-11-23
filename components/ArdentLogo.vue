<template>
  <div class="logo" :class="{ light }">
    <span class="mark" aria-hidden="true"><i /><i /><i /></span>
    <span class="word">ARDENT<small v-if="sub">{{ sub }}</small></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ light?: boolean; sub?: string }>()
</script>

<style scoped>
/* Placeholder wordmark — swap for the official logo file from MarCom (public/logo.svg). */
.logo { display: flex; align-items: center; gap: .6rem; }
.mark { display: flex; gap: 3px; align-items: flex-end; height: 22px; }
.mark i { width: 6px; border-radius: 2px; display: block; }
.mark i:nth-child(1) { height: 10px; background: #760f12; }
.mark i:nth-child(2) { height: 16px; background: #C6324C; }
.mark i:nth-child(3) { height: 22px; background: #E90408; }
.word { font-weight: 800; letter-spacing: .22em; font-size: 1rem; color: var(--ardent-navy); display: flex; flex-direction: column; line-height: 1.1; }
.word small { font-weight: 500; letter-spacing: .12em; font-size: .62rem; color: var(--muted); }
.light .word { color: #fff; }
.light .word small { color: rgba(255,255,255,.65); }
</style>
