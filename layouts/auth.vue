<template>
  <div class="auth"><slot /></div>
</template>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
@media (max-width: 860px) { .auth { grid-template-columns: 1fr; } }
</style>
