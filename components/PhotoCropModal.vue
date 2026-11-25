<template>
  <!-- On <body>, so the dim background also covers the sticky header. -->
  <Teleport to="body">
  <div class="overlay">
    <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="pc-title" @keydown.esc="$emit('close')">
      <h3 id="pc-title">Edit profile photo</h3>
      <p class="m sub">Drag to position, use the slider to zoom.</p>

      <div
        class="stage" :class="{ grabbing: drag }"
        @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel.prevent="wheel"
      >
        <img v-if="img" :src="src" alt="" draggable="false" :style="imgStyle">
        <div class="ring" aria-hidden="true" />
      </div>

      <label class="zoom">
        <AppIcon name="search" :size="14" />
        <span class="sr-only">Zoom</span>
        <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" aria-label="Zoom">
      </label>

      <div class="foot">
        <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="!img" @click="save">Save photo</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
// Crops the chosen image to a circle-ready square (512×512 JPEG) and emits a data URL.
// Server note: hris_server has no photo upload endpoint yet (BACKEND.md §0 #6), so the
// page keeps the result in app state, like the mobile app keeps it on the phone.
const props = defineProps({ src: { type: String, required: true } })
const emit = defineEmits(['close', 'save'])

const SIZE = 260 // stage size in px
const img = ref(null)
const zoom = ref(1)
const pos = reactive({ x: 0, y: 0 })

onMounted(() => {
  const i = new Image()
  i.onload = () => { img.value = i }
  i.src = props.src
})

// Image scaled so its short side fills the stage at zoom 1.
const base = computed(() => (img.value ? SIZE / Math.min(img.value.width, img.value.height) : 1))
const dims = computed(() => {
  const s = base.value * zoom.value
  return { w: (img.value?.width || 0) * s, h: (img.value?.height || 0) * s }
})
const clamp = () => {
  const mx = Math.max(0, (dims.value.w - SIZE) / 2)
  const my = Math.max(0, (dims.value.h - SIZE) / 2)
  pos.x = Math.min(mx, Math.max(-mx, pos.x))
  pos.y = Math.min(my, Math.max(-my, pos.y))
}
watch(zoom, clamp)
const imgStyle = computed(() => ({
  width: dims.value.w + 'px', height: dims.value.h + 'px',
  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`
}))

let drag = ref(false), sx = 0, sy = 0, px = 0, py = 0
const down = (e) => { drag.value = true; sx = e.clientX; sy = e.clientY; px = pos.x; py = pos.y; e.currentTarget.setPointerCapture?.(e.pointerId) }
const move = (e) => { if (!drag.value) return; pos.x = px + e.clientX - sx; pos.y = py + e.clientY - sy; clamp() }
const up = () => { drag.value = false }
const wheel = (e) => { zoom.value = Math.min(3, Math.max(1, zoom.value - e.deltaY * 0.002)) }

const save = () => {
  const out = 512
  const c = document.createElement('canvas')
  c.width = c.height = out
  const ctx = c.getContext('2d')
  const k = out / SIZE
  const s = base.value * zoom.value
  const dw = img.value.width * s * k, dh = img.value.height * s * k
  const dx = (out - dw) / 2 + pos.x * k, dy = (out - dh) / 2 + pos.y * k
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, out, out)
  ctx.drawImage(img.value, dx, dy, dw, dh)
  emit('save', c.toDataURL('image/jpeg', 0.9))
}
</script>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 60; background: rgba(15, 23, 33, .55); display: grid; place-items: center; padding: 1rem; }
.modal { width: 100%; max-width: 380px; padding: 1.4rem; display: flex; flex-direction: column; align-items: center; gap: .9rem; }
.modal h3 { align-self: flex-start; font-size: 1.1rem; }
.sub { align-self: flex-start; font-size: .82rem; margin-top: -.6rem; }
.stage { position: relative; width: 260px; height: 260px; border-radius: 16px; overflow: hidden; background: #111; cursor: grab; touch-action: none; user-select: none; }
.stage.grabbing { cursor: grabbing; }
.stage img { position: absolute; left: 50%; top: 50%; max-width: none; pointer-events: none; }
.ring { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 999px rgba(0, 0, 0, .5); border: 2px solid rgba(255, 255, 255, .9); pointer-events: none; }
.zoom { display: flex; align-items: center; gap: .6rem; width: 260px; color: var(--muted); }
.zoom input { flex: 1; accent-color: var(--ardent-red); }
.foot { display: flex; justify-content: flex-end; gap: .5rem; width: 100%; padding-top: .3rem; }
</style>
