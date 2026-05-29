import type { StaffUser } from '@/types/staff'

interface AuthState {
  user: StaffUser | null
  loading: boolean
  error: string | null
}

const state = reactive<AuthState>({
  user: null,
  loading: false,
  error: null,
})

export function useStaffAuth() {
  async function login(email: string, password: string): Promise<void> {
    state.loading = true
    state.error = null
    try {
      const data = await $fetch<{ data: StaffUser }>(
        '/api/v1/staff/auth/login',
        {
          method: 'POST',
          body: { email, password },
          credentials: 'include',
        }
      )
      state.user = data.data
    } catch {
      state.error = 'Credenciales inválidas'
      throw state.error
    } finally {
      state.loading = false
    }
  }

  async function logout(): Promise<void> {
    await $fetch('/api/v1/staff/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    state.user = null
    await navigateTo('/staff/login')
  }

  async function me(): Promise<void> {
    try {
      const headers = import.meta.server
        ? useRequestHeaders(['cookie'])
        : undefined
      const data = await $fetch<{ data: StaffUser }>('/api/v1/staff/auth/me', {
        credentials: 'include',
        ...(headers && { headers }),
      })
      state.user = data.data
    } catch {
      state.user = null
    }
  }

  return {
    user: readonly(toRef(state, 'user')),
    loading: readonly(toRef(state, 'loading')),
    error: readonly(toRef(state, 'error')),
    login,
    logout,
    me,
  }
}
