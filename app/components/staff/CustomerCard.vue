<script setup lang="ts">
defineProps<{
  name: string
  phone: string
  pointsBalance: number
}>()
</script>

<template>
  <div class="customer-card">
    <div class="customer-card__header">
      <div class="customer-card__info">
        <p class="customer-card__name">{{ name }}</p>
        <p class="customer-card__phone">{{ phone }}</p>
      </div>
      <div class="customer-card__balance">
        <span class="customer-card__balance-value">{{ pointsBalance }}</span>
        <span class="customer-card__balance-label">puntos</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
.customer-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.customer-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.customer-card__name {
  font-family: var(--font-lato);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-text);
  margin: 0;
}

.customer-card__phone {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0.25rem 0 0;
}

.customer-card__balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.customer-card__balance-value {
  color: var(--color-brand);
  font-family: var(--font-lato);
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
}

.customer-card__balance-label {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
