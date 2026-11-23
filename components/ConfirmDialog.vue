<template>
  <Transition name="cd">
    <div v-if="dialog" class="cd-overlay" @click.self="close(false)">
      <div class="cd" role="alertdialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-msg">
        <span class="cd-icon" :class="dialog.tone"><AppIcon :name="dialog.icon" :size="22" /></span>
        <h2 id="cd-title">{{ dialog.title }}</h2>
        <p v-if="dialog.message" id="cd-msg">{{ dialog.message }}</p>
        <div class="cd-actions">
          <button class="btn btn-ghost" @click="close(false)">{{ dialog.cancelText }}</button>
          <button ref="okBtn" class="btn" :class="dialog.tone === 'danger' ? 'btn-solid-danger' : 'btn-primary'" @click="close(true)">{{ dialog.confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const { dialog, close } = useConfirm()
const okBtn = ref(null)

watch(dialog, (d) => { if (d) nextTick(() => okBtn.value?.focus()) })
// Treat leaving the page as "cancel" so a dialog never follows you to another page.
const route = useRoute()
watch(() => route.fullPath, () => { if (dialog.value) close(false) })

const onKey = (e) => { if (dialog.value && e.key === 'Escape') close(false) }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.cd-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(19,51,65,.5); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 1rem; }
.cd { width: 100%; max-width: 400px; background: #fff; border-radius: 20px; padding: 1.75rem 1.5rem 1.4rem; text-align: center; box-shadow: var(--shadow-lg); }
.cd-icon { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 1rem; background: #fdecef; color: var(--ardent-red); }
.cd-icon.primary { background: #e8f6ef; color: #18794e; }
.cd h2 { font-size: 1.15rem; }
.cd p { margin: .5rem 0 0; color: var(--muted); font-size: .9rem; line-height: 1.55; }
.cd-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: 1.5rem; }
.btn-solid-danger { background: var(--ardent-red); color: #fff; box-shadow: 0 6px 16px -6px rgba(198,50,76,.6); }
.btn-solid-danger:hover { background: #b02a42; }
.cd-enter-active, .cd-leave-active { transition: opacity .15s; }
.cd-enter-active .cd, .cd-leave-active .cd { transition: transform .15s; }
.cd-enter-from, .cd-leave-to { opacity: 0; }
.cd-enter-from .cd, .cd-leave-to .cd { transform: scale(.95); }
</style>
