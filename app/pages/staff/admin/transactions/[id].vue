<script setup lang="ts">
definePageMeta({ middleware: 'staff-auth' })

const route = useRoute()
const id = route.params.id as string

const voidReason = ref('')
const voiding = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const { data, error: fetchError } = await useFetch(
  `/api/v1/staff/admin/transactions?limit=1`,
  {
    credentials: 'include',
  }
)

async function submitVoid() {
  if (!voidReason.value.trim()) return
  voiding.value = true
  error.value = null

  try {
    await $fetch(`/api/v1/staff/admin/transactions/${id}/void`, {
      method: 'POST',
      body: { reason: voidReason.value.trim() },
      credentials: 'include',
    })
    success.value = 'Transacción anulada correctamente'
  } catch (err: unknown) {
    error.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Error al anular'
  } finally {
    voiding.value = false
  }
}
</script>

<template>
  <div class="tx-detail">
    <header class="tx-detail__header">
      <NuxtLink to="/staff/admin" class="tx-detail__back">← Volver</NuxtLink>
      <h1 class="tx-detail__title">Detalle de transacción</h1>
    </header>

    <main class="tx-detail__main">
      <p class="tx-detail__id">ID: <code>{{ id }}</code></p>

      <div v-if="!success" class="tx-detail__void-form">
        <h2 class="tx-detail__form-title">Anular transacción</h2>
        <p class="tx-detail__form-note">Esta acción revierte los puntos al cliente y queda registrada en el historial.</p>

        <textarea
          v-model="voidReason"
          class="tx-detail__reason-input"
          placeholder="Describe la razón de la anulación…"
          rows="3"
        />

        <p v-if="error" class="tx-detail__error" role="alert">{{ error }}</p>

        <button
          class="tx-detail__void-btn"
          :disabled="!voidReason.trim() || voiding"
          @click="submitVoid"
        >
          {{ voiding ? 'Anulando…' : 'Confirmar anulación' }}
        </button>
      </div>

      <p v-else class="tx-detail__success" role="status">{{ success }}</p>
    </main>
  </div>
</template>

<style scoped>
.tx-detail {
  background: var(--color-dark);
  min-height: 100dvh;
}

.tx-detail__header {
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.tx-detail__back {
  color: var(--color-brand);
  font-size: 0.875rem;
  text-decoration: none;
}

.tx-detail__title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.tx-detail__main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.tx-detail__id {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.tx-detail__void-form {
  background: var(--color-surface);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.tx-detail__form-title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.tx-detail__form-note {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.tx-detail__reason-input {
  background: var(--color-dark);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 0.9375rem;
  outline: none;
  padding: 0.75rem 1rem;
  resize: vertical;
}

.tx-detail__reason-input:focus {
  border-color: var(--color-brand);
}

.tx-detail__error {
  color: rgb(var(--pink));
  font-size: 0.875rem;
  margin: 0;
}

.tx-detail__void-btn {
  background: rgb(var(--pink));
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 0.75rem;
  transition: opacity 0.15s;
}

.tx-detail__void-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tx-detail__success {
  color: rgb(var(--green));
  font-size: 0.9375rem;
}
</style>
