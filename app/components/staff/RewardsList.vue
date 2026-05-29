<script setup lang="ts">
interface Reward {
  id: string
  name: string
  description: string | null
  pointsCost: number
}

const props = defineProps<{
  rewards: Reward[]
  customerBalance: number
  loading?: boolean
}>()

const emit = defineEmits<{
  redeem: [rewardId: string, ticketId: string]
}>()

const selectedRewardId = ref<string | null>(null)
const ticketId = ref('')
const redeeming = ref(false)

function selectReward(id: string) {
  selectedRewardId.value = selectedRewardId.value === id ? null : id
  ticketId.value = ''
}

async function confirmRedeem() {
  if (!selectedRewardId.value || !ticketId.value.trim()) return
  redeeming.value = true
  try {
    emit('redeem', selectedRewardId.value, ticketId.value.trim())
  } finally {
    selectedRewardId.value = null
    ticketId.value = ''
    redeeming.value = false
  }
}
</script>

<template>
  <div class="rewards-list">
    <h3 class="rewards-list__title">Recompensas disponibles</h3>

    <p v-if="!props.rewards.length" class="rewards-list__empty">
      No hay recompensas activas.
    </p>

    <ul v-else class="rewards-list__items">
      <li
        v-for="reward in props.rewards"
        :key="reward.id"
        class="rewards-list__item"
        :class="{ 'rewards-list__item--selected': selectedRewardId === reward.id, 'rewards-list__item--disabled': props.customerBalance < reward.pointsCost }"
      >
        <div class="rewards-list__item-header" @click="props.customerBalance >= reward.pointsCost && selectReward(reward.id)">
          <div class="rewards-list__item-info">
            <p class="rewards-list__item-name">{{ reward.name }}</p>
            <p v-if="reward.description" class="rewards-list__item-desc">{{ reward.description }}</p>
          </div>
          <span class="rewards-list__item-cost" :class="{ 'rewards-list__item-cost--affordable': props.customerBalance >= reward.pointsCost }">
            {{ reward.pointsCost }} pts
          </span>
        </div>

        <div v-if="selectedRewardId === reward.id" class="rewards-list__confirm">
          <input
            v-model="ticketId"
            type="text"
            class="rewards-list__ticket-input"
            placeholder="ID de ticket"
            @keyup.enter="confirmRedeem"
          />
          <button
            class="rewards-list__confirm-btn"
            :disabled="!ticketId.trim() || redeeming"
            @click="confirmRedeem"
          >
            {{ redeeming ? 'Canjeando…' : 'Confirmar canje' }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rewards-list__title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.875rem;
}

.rewards-list__empty {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.rewards-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.rewards-list__item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.625rem;
  overflow: hidden;
  transition: border-color 0.15s;
}

.rewards-list__item--selected {
  border-color: var(--color-brand);
}

.rewards-list__item--disabled {
  opacity: 0.5;
}

.rewards-list__item-header {
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0.875rem 1rem;
}

.rewards-list__item--disabled .rewards-list__item-header {
  cursor: default;
}

.rewards-list__item-name {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-weight: 600;
  margin: 0;
}

.rewards-list__item-desc {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  margin: 0.25rem 0 0;
}

.rewards-list__item-cost {
  color: var(--color-text-muted);
  font-family: var(--font-lato);
  font-weight: 700;
  white-space: nowrap;
}

.rewards-list__item-cost--affordable {
  color: var(--color-brand);
}

.rewards-list__confirm {
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.rewards-list__ticket-input {
  background: var(--color-dark);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text);
  flex: 1;
  font-family: var(--font-lato);
  font-size: 0.875rem;
  outline: none;
  padding: 0.5rem 0.75rem;
}

.rewards-list__ticket-input:focus {
  border-color: var(--color-brand);
}

.rewards-list__confirm-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.375rem;
  color: #fff;
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  white-space: nowrap;
}

.rewards-list__confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
