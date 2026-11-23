<template>
  <Transition name="t"><div v-if="msg" class="toast" role="status">{{ msg }}</div></Transition>
</template>

<script setup lang="ts">
defineProps<{ msg: string }>()
</script>

<style scoped>
.toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: var(--ardent-navy); color: #fff; font-weight: 600; font-size: .88rem; padding: .8rem 1.3rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.2); z-index: 60; border-left: 4px solid var(--ardent-coral); }
.t-enter-active, .t-leave-active { transition: opacity .2s, transform .2s; }
.t-enter-from, .t-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
