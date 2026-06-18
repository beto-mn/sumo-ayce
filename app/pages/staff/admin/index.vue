<script setup lang="ts">
definePageMeta({ middleware: 'staff-auth' })

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const voidError = ref<string | null>(null)
const voidSuccess = ref<string | null>(null)
const txPage = ref(1)

const { data: metricsData, refresh: refreshMetrics } = await useFetch(
  () => `/api/v1/staff/admin/reports/daily?date=${selectedDate.value}`,
  { credentials: 'include' }
)

const { data: txData, refresh: refreshTx } = await useFetch(
  () => `/api/v1/staff/admin/transactions?page=${txPage.value}&limit=50`,
  { credentials: 'include' }
)

const metrics = computed(
  () =>
    (metricsData.value as { data: Record<string, unknown> } | null)?.data ??
    null
)
interface TxResponse {
  data: {
    transactions: Record<string, unknown>[]
    total: number
    page: number
    limit: number
  }
}
const transactions = computed(
  () => (txData.value as unknown as TxResponse | null)?.data?.transactions ?? []
)
const total = computed(
  () => (txData.value as unknown as TxResponse | null)?.data?.total ?? 0
)

watch(selectedDate, () => refreshMetrics())

async function handleVoid(transactionId: string) {
  const reason = prompt('Razón de la anulación:')
  if (!reason?.trim()) return

  voidError.value = null
  voidSuccess.value = null

  try {
    await $fetch(`/api/v1/staff/admin/transactions/${transactionId}/void`, {
      method: 'POST',
      body: { reason },
      credentials: 'include',
    })
    voidSuccess.value = 'Transacción anulada correctamente'
    await Promise.all([refreshTx(), refreshMetrics()])
  } catch (err: unknown) {
    voidError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Error al anular'
  }
}

function prevPage() {
  if (txPage.value > 1) txPage.value--
}

function nextPage() {
  if (txPage.value * 50 < total.value) txPage.value++
}
</script>

<template>
  <div class="admin-panel">
    <header class="admin-panel__header">
      <NuxtLink to="/staff/dashboard" class="admin-panel__back">← Dashboard</NuxtLink>
      <h1 class="admin-panel__title">Panel de administración</h1>
    </header>

    <main class="admin-panel__main">
      <!-- Metrics -->
      <section class="admin-panel__metrics">
        <div class="admin-panel__metrics-controls">
          <h2 class="admin-panel__section-title">Métricas del día</h2>
          <input
            v-model="selectedDate"
            type="date"
            class="admin-panel__date-input"
          />
        </div>

        <div v-if="metrics" class="admin-panel__metrics-grid">
          <div class="admin-panel__metric-card">
            <span class="admin-panel__metric-value">{{ metrics.visitsCount }}</span>
            <span class="admin-panel__metric-label">Visitas</span>
          </div>
          <div class="admin-panel__metric-card">
            <span class="admin-panel__metric-value">{{ metrics.pointsEarned }}</span>
            <span class="admin-panel__metric-label">Puntos emitidos</span>
          </div>
          <div class="admin-panel__metric-card">
            <span class="admin-panel__metric-value">{{ metrics.redemptionsCount }}</span>
            <span class="admin-panel__metric-label">Canjes</span>
          </div>
          <div class="admin-panel__metric-card">
            <span class="admin-panel__metric-value">{{ metrics.newCustomers }}</span>
            <span class="admin-panel__metric-label">Clientes nuevos</span>
          </div>
        </div>
      </section>

      <!-- Transactions -->
      <section class="admin-panel__transactions">
        <h2 class="admin-panel__section-title">Historial de transacciones</h2>

        <p v-if="voidSuccess" class="admin-panel__success" role="status">{{ voidSuccess }}</p>
        <p v-if="voidError" class="admin-panel__error" role="alert">{{ voidError }}</p>

        <StaffTransactionTable
          :transactions="transactions as never"
          @void="handleVoid"
        />

        <div class="admin-panel__pagination">
          <button class="admin-panel__page-btn" :disabled="txPage === 1" @click="prevPage">← Anterior</button>
          <span class="admin-panel__page-info">Página {{ txPage }} · {{ total }} total</span>
          <button class="admin-panel__page-btn" :disabled="txPage * 50 >= total" @click="nextPage">Siguiente →</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-panel {
  background: var(--color-dark);
  min-height: 100dvh;
}

.admin-panel__header {
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.admin-panel__back {
  color: var(--color-brand);
  font-size: 0.875rem;
  text-decoration: none;
}

.admin-panel__title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.admin-panel__main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.admin-panel__section-title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.admin-panel__metrics-controls {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.admin-panel__date-input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.admin-panel__metrics-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .admin-panel__metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.admin-panel__metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
}

.admin-panel__metric-value {
  color: var(--color-brand);
  font-family: var(--font-lato);
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.admin-panel__metric-label {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.admin-panel__success {
  color: rgb(var(--green));
  font-size: 0.875rem;
  margin: 0 0 0.75rem;
}

.admin-panel__error {
  color: rgb(var(--pink));
  font-size: 0.875rem;
  margin: 0 0 0.75rem;
}

.admin-panel__pagination {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.admin-panel__page-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.375rem 0.875rem;
}

.admin-panel__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.admin-panel__page-info {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
