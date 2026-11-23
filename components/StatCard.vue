<template>
  <div class="stat">
    <div class="row">
      <span class="label">{{ label }}</span>
      <span v-if="icon" class="ic"><AppIcon :name="icon" :size="16" /></span>
    </div>
    <strong>{{ value }}<em v-if="unit">{{ unit }}</em></strong>
    <small v-if="trend" :class="{ up: trend.startsWith('+') }">{{ trend }}</small>
    <div v-if="progress !== undefined" class="track"><div class="fill" :style="{ width: progress + '%' }" /></div>
  </div>
</template>

<script setup>
defineProps({ label: String, value: String, trend: String, unit: String, icon: String, progress: { type: Number, default: undefined } })
</script>

<style scoped>
.stat {
  position: relative; display: flex; flex-direction: column; gap: .35rem; height: 100%;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 1.15rem 1.25rem; transition: transform .15s, box-shadow .15s;
}
.stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.row { display: flex; justify-content: space-between; align-items: center; }
.label { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 700; }
.ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: linear-gradient(135deg, #fdecef, #ffe1e4); color: var(--ardent-red); }
strong { font-size: 2rem; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
em { font-style: normal; font-size: .8rem; font-weight: 600; color: var(--muted); margin-left: .35rem; letter-spacing: 0; }
small { color: var(--muted); font-size: .78rem; }
small.up { color: #18794e; }
.track { height: 6px; border-radius: 99px; background: #f0f1f3; overflow: hidden; margin-top: .4rem; }
.fill { height: 100%; border-radius: 99px; background: var(--grad-brand); }
</style>
