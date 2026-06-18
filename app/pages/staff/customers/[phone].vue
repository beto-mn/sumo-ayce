<script setup lang="ts">
definePageMeta({ middleware: 'staff-auth' })

const route = useRoute()
const phone = computed(() => decodeURIComponent(route.params.phone as string))

const { findByPhone, customer, redeemReward, updateCustomer } =
  useStaffCustomer()
const rewards = ref<
  Array<{
    id: string
    name: string
    description: string | null
    pointsCost: number
  }>
>([])
const redeemError = ref<string | null>(null)
const redeemSuccess = ref<string | null>(null)

const showEditForm = ref(false)
const editName = ref('')
const editPhone = ref('')
const editLoading = ref(false)
const editError = ref<string | null>(null)

await findByPhone(phone.value)

const { data: rewardsData } = await useFetch<{ data: typeof rewards.value }>(
  '/api/v1/loyalty/rewards',
  { credentials: 'include' }
)
if (rewardsData.value) rewards.value = rewardsData.value.data

function openEdit() {
  editName.value = customer.value?.name ?? ''
  editPhone.value = customer.value?.phone ?? ''
  editError.value = null
  showEditForm.value = true
}

async function handleEdit() {
  editError.value = null
  editLoading.value = true
  try {
    const fields: { name?: string; phone?: string } = {}
    if (editName.value.trim() !== customer.value?.name)
      fields.name = editName.value.trim()
    if (editPhone.value.trim() !== customer.value?.phone)
      fields.phone = editPhone.value.trim()
    if (Object.keys(fields).length === 0) {
      showEditForm.value = false
      return
    }

    const updated = await updateCustomer(phone.value, fields)
    showEditForm.value = false

    if (fields.phone) {
      await navigateTo(`/staff/customers/${encodeURIComponent(updated.phone)}`)
    }
  } catch (err: unknown) {
    editError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Error al actualizar'
  } finally {
    editLoading.value = false
  }
}

async function handleRedeem(rewardId: string, ticketId: string) {
  redeemError.value = null
  redeemSuccess.value = null
  try {
    const result = await redeemReward(phone.value, rewardId, ticketId)
    redeemSuccess.value = `¡Canje exitoso! Saldo actual: ${result.newBalance} puntos`
  } catch (err: unknown) {
    redeemError.value =
      (err as { data?: { statusMessage?: string } })?.data?.statusMessage ??
      'Error al canjear'
  }
}
</script>

<template>
  <div class="customer-profile">
    <header class="customer-profile__header">
      <NuxtLink to="/staff/dashboard" class="customer-profile__back">← Volver</NuxtLink>
      <span class="customer-profile__header-divider" aria-hidden="true" />
      <h1 class="customer-profile__title">Perfil del cliente</h1>
    </header>

    <main class="customer-profile__main">
      <div v-if="customer" class="customer-profile__content">
        <StaffCustomerCard
          :name="customer.name"
          :phone="customer.phone"
          :points-balance="customer.pointsBalance"
        />

        <div v-if="showEditForm" class="customer-profile__edit">
          <p class="customer-profile__edit-title">Editar cliente</p>
          <label class="customer-profile__edit-label">Nombre</label>
          <input v-model="editName" type="text" class="customer-profile__edit-input" placeholder="Nombre" />
          <label class="customer-profile__edit-label">Teléfono</label>
          <input v-model="editPhone" type="tel" class="customer-profile__edit-input" placeholder="Teléfono" />
          <p v-if="editError" class="customer-profile__error" role="alert">{{ editError }}</p>
          <div class="customer-profile__edit-actions">
            <button class="customer-profile__edit-btn" :disabled="editLoading" @click="handleEdit">
              {{ editLoading ? 'Guardando…' : 'Guardar' }}
            </button>
            <button class="customer-profile__cancel-btn" @click="showEditForm = false">Cancelar</button>
          </div>
        </div>

        <button v-else class="customer-profile__edit-trigger" @click="openEdit">Editar datos del cliente</button>

        <p v-if="redeemSuccess" class="customer-profile__success" role="status">{{ redeemSuccess }}</p>
        <p v-if="redeemError" class="customer-profile__error" role="alert">{{ redeemError }}</p>

        <StaffRewardsList
          :rewards="rewards"
          :customer-balance="customer.pointsBalance"
          @redeem="handleRedeem"
        />
      </div>

      <p v-else class="customer-profile__not-found">Cliente no encontrado.</p>
    </main>
  </div>
</template>

<style scoped>
.customer-profile {
  background: var(--color-dark);
  min-height: 100dvh;
}

.customer-profile__header {
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 0;
  padding: 1.125rem 1.75rem;
}

.customer-profile__back {
  color: var(--color-brand);
  font-family: var(--font-lato);
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.customer-profile__back:hover {
  opacity: 0.75;
}

.customer-profile__header-divider {
  background: var(--color-border);
  border-radius: 1px;
  flex-shrink: 0;
  height: 1.25rem;
  margin: 0 1.25rem;
  width: 1px;
}

.customer-profile__title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.customer-profile__main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.customer-profile__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.customer-profile__success {
  color: rgb(var(--green));
  font-size: 0.875rem;
  margin: 0;
}

.customer-profile__error {
  color: rgb(var(--pink));
  font-size: 0.875rem;
  margin: 0;
}

.customer-profile__not-found {
  color: var(--color-text-muted);
  text-align: center;
}

.customer-profile__edit-trigger {
  background: var(--color-surface);
  border: 1px solid var(--color-brand);
  border-radius: 0.5rem;
  color: var(--color-brand);
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 0.75rem 1rem;
  text-align: center;
  transition: background 0.15s, color 0.15s;
  width: 100%;
}

.customer-profile__edit-trigger *,
.customer-profile__edit-trigger:hover,
.customer-profile__edit-trigger:hover * {
  cursor: pointer;
}

.customer-profile__edit-trigger:hover {
  background: var(--color-brand);
  color: rgb(var(--panel));
}

.customer-profile__edit {
  background: var(--color-surface);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
}

.customer-profile__edit-title {
  color: var(--color-text);
  font-family: var(--font-lato);
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.customer-profile__edit-label {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.customer-profile__edit-input {
  background: var(--color-dark);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  padding: 0.625rem 0.875rem;
  outline: none;
}

.customer-profile__edit-input:focus {
  border-color: var(--color-brand);
}

.customer-profile__edit-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.customer-profile__edit-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-weight: 700;
  padding: 0.625rem 1.25rem;
}

.customer-profile__edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.customer-profile__cancel-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 0.875rem;
  padding: 0.625rem 1rem;
}
</style>
