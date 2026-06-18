<script setup lang="ts">
interface Transaction {
  id: string
  type: 'earn' | 'redeem'
  pointsDelta: number
  ticketId: string | null
  voidedAt: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string }
  createdBy: { id: string; name: string | null } | null
}

const props = defineProps<{
  transactions: Transaction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  void: [transactionId: string]
}>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
</script>

<template>
  <div class="tx-table-wrapper">
    <p v-if="props.loading" class="tx-table__loading">Cargando…</p>

    <p v-else-if="!props.transactions.length" class="tx-table__empty">
      No hay transacciones para este período.
    </p>

    <table v-else class="tx-table">
      <thead>
        <tr>
          <th class="tx-table__th">Fecha</th>
          <th class="tx-table__th">Cliente</th>
          <th class="tx-table__th">Cajero</th>
          <th class="tx-table__th">Tipo</th>
          <th class="tx-table__th">Puntos</th>
          <th class="tx-table__th">Estado</th>
          <th class="tx-table__th"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="tx in props.transactions"
          :key="tx.id"
          class="tx-table__row"
          :class="{ 'tx-table__row--voided': !!tx.voidedAt }"
        >
          <td class="tx-table__td">{{ formatDate(tx.createdAt) }}</td>
          <td class="tx-table__td">
            <span class="tx-table__name">{{ tx.customer.name }}</span>
            <span class="tx-table__phone">{{ tx.customer.phone }}</span>
          </td>
          <td class="tx-table__td">{{ tx.createdBy?.name ?? '—' }}</td>
          <td class="tx-table__td">
            <span class="tx-table__type" :class="`tx-table__type--${tx.type}`">
              {{ tx.type === 'earn' ? 'Visita' : 'Canje' }}
            </span>
          </td>
          <td class="tx-table__td tx-table__td--points">
            {{ tx.type === 'earn' ? '+' : '-' }}{{ Math.abs(tx.pointsDelta) }}
          </td>
          <td class="tx-table__td">
            <span v-if="tx.voidedAt" class="tx-table__status tx-table__status--voided">Anulada</span>
            <span v-else class="tx-table__status tx-table__status--active">Activa</span>
          </td>
          <td class="tx-table__td">
            <button
              v-if="!tx.voidedAt"
              class="tx-table__void-btn"
              @click="$emit('void', tx.id)"
            >
              Anular
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.tx-table-wrapper {
  overflow-x: auto;
}

.tx-table__loading,
.tx-table__empty {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  padding: 1.5rem 0;
  text-align: center;
}

.tx-table {
  border-collapse: collapse;
  font-family: var(--font-lato);
  font-size: 0.875rem;
  width: 100%;
}

.tx-table__th {
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.625rem 0.75rem;
  text-align: left;
  white-space: nowrap;
}

.tx-table__row {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}

.tx-table__row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.tx-table__row--voided {
  opacity: 0.5;
}

.tx-table__td {
  color: var(--color-text);
  padding: 0.75rem;
  vertical-align: middle;
  white-space: nowrap;
}

.tx-table__td--points {
  font-weight: 700;
}

.tx-table__name {
  display: block;
  font-weight: 600;
}

.tx-table__phone {
  color: var(--color-text-muted);
  display: block;
  font-size: 0.8125rem;
}

.tx-table__type {
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
}

.tx-table__type--earn {
  background: rgba(34, 197, 94, 0.15);
  color: rgb(var(--green));
}

.tx-table__type--redeem {
  background: rgba(243, 112, 33, 0.15);
  color: var(--color-brand);
}

.tx-table__status {
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  padding: 0.2rem 0.5rem;
}

.tx-table__status--active {
  background: rgba(34, 197, 94, 0.15);
  color: rgb(var(--green));
}

.tx-table__status--voided {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(var(--pink));
}

.tx-table__void-btn {
  background: none;
  border: 1px solid rgb(var(--pink));
  border-radius: 0.25rem;
  color: rgb(var(--pink));
  cursor: pointer;
  font-size: 0.8125rem;
  padding: 0.25rem 0.625rem;
  transition: background 0.15s;
}

.tx-table__void-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
