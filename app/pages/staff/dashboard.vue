<script setup lang="ts">
definePageMeta({ middleware: 'staff-auth' })

const { user, logout } = useStaffAuth()
const {
  customer,
  loading,
  findByPhone,
  registerVisit,
  createCustomer,
  clearCustomer,
} = useStaffCustomer()

const phone = ref('')
const visitState = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const visitError = ref('')
const showCreateForm = ref(false)
const newCustomerName = ref('')
const newCustomerOptIn = ref(true)
const creating = ref(false)

async function search() {
  if (!phone.value.trim()) return
  showCreateForm.value = false
  newCustomerName.value = ''
  newCustomerOptIn.value = true
  visitState.value = 'idle'
  const found = await findByPhone(phone.value.trim())
  if (!found) showCreateForm.value = true
}

async function handleRegisterVisit(ticketId: string) {
  if (!customer.value) return
  visitState.value = 'loading'
  try {
    await registerVisit(customer.value.phone, ticketId)
    visitState.value = 'success'
  } catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data
      ?.statusMessage
    visitError.value = msg ?? 'Error al registrar la visita'
    visitState.value = 'error'
  }
}

async function handleCreateCustomer() {
  creating.value = true
  try {
    await createCustomer(
      newCustomerName.value.trim(),
      phone.value.trim(),
      newCustomerOptIn.value
    )
    showCreateForm.value = false
    visitState.value = 'idle'
  } catch {
    // customer already shown if conflict
  } finally {
    creating.value = false
  }
}

function reset() {
  phone.value = ''
  showCreateForm.value = false
  newCustomerName.value = ''
  newCustomerOptIn.value = true
  visitState.value = 'idle'
  clearCustomer()
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <span class="dashboard__branch">{{ user?.branchName ?? 'SUMO' }}</span>
      <div class="dashboard__user">
        <span>{{ user?.name }}</span>
        <button class="dashboard__logout-btn" @click="logout">Salir</button>
      </div>
    </header>

    <main class="dashboard__main">
      <form class="dashboard__search" @submit.prevent="search">
        <input
          v-model="phone"
          type="tel"
          class="dashboard__search-input"
          placeholder="Teléfono del cliente"
          autocomplete="tel"
        />
        <button type="submit" class="dashboard__search-btn" :disabled="loading">
          {{ loading ? '…' : 'Buscar' }}
        </button>
      </form>

      <div v-if="customer" class="dashboard__result">
        <StaffCustomerCard
          :name="customer.name"
          :phone="customer.phone"
          :points-balance="customer.pointsBalance"
        />
        <StaffVisitButton
          :state="visitState"
          :error-message="visitError"
          @confirm="handleRegisterVisit"
        />
        <div class="dashboard__actions">
          <NuxtLink :to="`/staff/customers/${encodeURIComponent(customer.phone)}`" class="dashboard__profile-link">
            Ver perfil completo →
          </NuxtLink>
          <button class="dashboard__new-search" @click="reset">Nueva búsqueda</button>
        </div>
      </div>

      <div v-else-if="showCreateForm" class="dashboard__create">
        <p class="dashboard__create-title">Cliente no encontrado. ¿Deseas registrarlo?</p>
        <input
          v-model="newCustomerName"
          type="text"
          class="dashboard__search-input"
          placeholder="Nombre del cliente"
        />
        <label class="dashboard__optin">
          <input v-model="newCustomerOptIn" type="checkbox" />
          Acepta notificaciones por WhatsApp
        </label>
        <button class="dashboard__create-btn" :disabled="!newCustomerName.trim() || creating" @click="handleCreateCustomer">
          {{ creating ? 'Registrando…' : 'Registrar cliente' }}
        </button>
        <button class="dashboard__new-search" @click="reset">Cancelar</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  background: var(--color-dark);
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.dashboard__header {
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.dashboard__branch {
  color: var(--color-brand);
  font-family: var(--font-lato);
  font-weight: 700;
}

.dashboard__user {
  align-items: center;
  display: flex;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.dashboard__logout-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.8125rem;
  padding: 0.25rem 0.75rem;
}

.dashboard__main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  width: 100%;
}

.dashboard__search {
  display: flex;
  gap: 0.5rem;
}

.dashboard__search-input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  flex: 1;
  font-family: var(--font-lato);
  font-size: 1rem;
  padding: 0.75rem 1rem;
  outline: none;
}

.dashboard__search-input:focus {
  border-color: var(--color-brand);
}

.dashboard__search-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-weight: 700;
  padding: 0.75rem 1.25rem;
}

.dashboard__result {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.dashboard__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.dashboard__profile-link {
  color: var(--color-brand);
  text-decoration: none;
}

.dashboard__new-search {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
}

.dashboard__create {
  background: var(--color-surface);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
}

.dashboard__create-title {
  color: var(--color-text);
  font-family: var(--font-lato);
  margin: 0;
}

.dashboard__optin {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.dashboard__create-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-weight: 700;
  padding: 0.75rem;
}

.dashboard__create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
