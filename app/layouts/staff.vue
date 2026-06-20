<script setup lang="ts">
/**
 * Staff portal layout. Loads the dark-themed staff stylesheet scoped to staff
 * routes only — it is intentionally NOT in the global `css:` array so its
 * `body { background: dark }` rule never leaks onto the public (cream) pages.
 */
import '@/assets/css/staff.css'
</script>

<template>
  <div class="staff-shell">
    <slot />
  </div>
</template>

<style scoped>
.staff-shell {
  background: var(--color-dark);
  color: var(--color-text);
  font-family: var(--font-lato);
  min-height: 100dvh;
}
</style>
