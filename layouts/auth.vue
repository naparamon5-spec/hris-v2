<template>
  <div class="auth"><slot /></div>
</template>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
.auth { min-height: 100dvh; }
@media (max-width: 860px) { .auth { grid-template-columns: minmax(0, 1fr); align-content: start; } }
</style>
