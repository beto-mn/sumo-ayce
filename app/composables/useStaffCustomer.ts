interface CustomerData {
  id: string
  name: string
  phone: string
  pointsBalance: number
  whatsappOptIn: boolean
}

interface VisitResult {
  transactionId: string
  newBalance: number
}

interface RedeemResult {
  redemptionId: string
  rewardName: string
  pointsSpent: number
  newBalance: number
}

export function useStaffCustomer() {
  const customer = ref<CustomerData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function findByPhone(phone: string): Promise<CustomerData | null> {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ data: CustomerData }>(
        `/api/v1/staff/customers/${encodeURIComponent(phone)}`,
        {
          credentials: 'include',
        }
      )
      customer.value = data.data
      return data.data
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404) {
        customer.value = null
        return null
      }
      error.value = 'Error al buscar cliente'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function registerVisit(
    phone: string,
    ticketId: string
  ): Promise<VisitResult> {
    const data = await $fetch<{ data: VisitResult }>(
      '/api/v1/staff/transactions',
      {
        method: 'POST',
        body: { phone, ticketId },
        credentials: 'include',
      }
    )
    if (customer.value) customer.value.pointsBalance = data.data.newBalance
    return data.data
  }

  async function createCustomer(
    name: string,
    phone: string,
    whatsappOptIn: boolean
  ): Promise<CustomerData> {
    const data = await $fetch<{ data: CustomerData }>(
      '/api/v1/staff/customers',
      {
        method: 'POST',
        body: { name, phone, whatsappOptIn },
        credentials: 'include',
      }
    )
    customer.value = data.data
    return data.data
  }

  function clearCustomer(): void {
    customer.value = null
  }

  async function updateCustomer(
    phone: string,
    fields: { name?: string; phone?: string }
  ): Promise<CustomerData> {
    const data = await $fetch<{ data: CustomerData }>(
      `/api/v1/staff/customers/${encodeURIComponent(phone)}`,
      {
        method: 'PATCH',
        body: fields,
        credentials: 'include',
      }
    )
    customer.value = data.data
    return data.data
  }

  async function redeemReward(
    phone: string,
    rewardId: string,
    ticketId: string
  ): Promise<RedeemResult> {
    const data = await $fetch<{ data: RedeemResult }>(
      '/api/v1/staff/redemptions',
      {
        method: 'POST',
        body: { phone, rewardId, ticketId },
        credentials: 'include',
      }
    )
    if (customer.value) customer.value.pointsBalance = data.data.newBalance
    return data.data
  }

  return {
    customer: readonly(customer),
    loading: readonly(loading),
    error: readonly(error),
    findByPhone,
    registerVisit,
    createCustomer,
    updateCustomer,
    clearCustomer,
    redeemReward,
  }
}
