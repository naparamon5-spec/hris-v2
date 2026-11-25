<template>
  <!-- Sign-in progress: 1 Company → 2 Sign in. Done steps link back. -->
  <ol class="steps" aria-label="Sign-in steps">
    <li v-for="(s, i) in steps" :key="s.label" :class="{ on: i + 1 === current, done: i + 1 < current }" :aria-current="i + 1 === current ? 'step' : undefined">
      <component :is="i + 1 < current ? NuxtLink : 'span'" :to="i + 1 < current ? s.to : undefined" class="st">
        <span class="num"><AppIcon v-if="i + 1 < current" name="check" :size="12" /><template v-else>{{ i + 1 }}</template></span>
        <span class="lbl">{{ s.label }}</span>
      </component>
      <span v-if="i < steps.length - 1" class="bar" aria-hidden="true" />
    </li>
  </ol>
</template>

<script setup>
import { NuxtLink } from '#components'
defineProps({ current: { type: Number, required: true } })
const steps = [
  { label: 'Company', to: '/company-select' },
  { label: 'Sign in', to: '/login' }
]
</script>

<style scoped>
.steps { display: flex; align-items: center; gap: .5rem; list-style: none; margin: 0 0 .9rem; padding: 0; }
.steps li { display: flex; align-items: center; gap: .5rem; }
.st { display: inline-flex; align-items: center; gap: .45rem; color: var(--muted); font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
a.st:hover { color: var(--ardent-red); }
.num { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: .72rem; border: 2px solid var(--ardent-gray); color: var(--muted); background: #fff; }
.on .st { color: var(--ardent-red); }
.on .num { border-color: var(--ardent-red); background: var(--ardent-red); color: #fff; }
.done .num { border-color: #18794e; background: #18794e; color: #fff; }
.done .st { color: var(--text); }
.bar { width: 36px; height: 2px; border-radius: 2px; background: var(--ardent-gray); }
.done .bar { background: #18794e; }
</style>
