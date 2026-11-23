<template>
  <div class="hris" :class="{ light }">
    <!-- Same mark as hris_mobile AniHrisIcon: white squircle with a bold red 'H'. -->
    <span class="icon" :style="{ '--s': size + 'px' }" aria-hidden="true">H</span>
    <span class="text">
      <b>ANI HRIS</b>
      <small v-if="sub">{{ sub }}</small>
    </span>
  </div>
</template>

<script setup>
defineProps({ light: Boolean, sub: { type: String, default: 'Ardent Networks, Inc.' }, size: { type: Number, default: 40 } })
</script>

<style scoped>
.hris { display: flex; align-items: center; gap: .75rem; }
.icon {
  width: var(--s); height: var(--s); flex-shrink: 0; display: grid; place-items: center;
  background: #fff; border: 1px solid #ECECEF; border-radius: calc(var(--s) * .22);
  color: #EB1E23; font: 900 calc(var(--s) * .58) / 1 Roboto, 'Arial Black', Arial, sans-serif;
  box-shadow: 0 calc(var(--s) * .06) calc(var(--s) * .16) rgba(16,24,40,.08), 0 2px calc(var(--s) * .08) rgba(235,30,35,.08);
}
.text { display: flex; flex-direction: column; line-height: 1.1; }
.text b { font-size: 1.15rem; font-weight: 900; letter-spacing: -.01em; color: #17171C; }
.text small { margin-top: 2px; font-size: .68rem; font-weight: 600; letter-spacing: .02em; color: #6C6C77; }
.light .text b { color: #fff; }
.light .text small { color: rgba(255,255,255,.6); }
.light .icon { border-color: transparent; }
</style>
