<script setup lang="ts">
definePageMeta({ layout: false })

const { login, loading, error } = useStaffAuth()

async function handleSubmit(email: string, password: string) {
  await login(email, password)
  await navigateTo('/staff/dashboard')
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__logo">
        <span class="login-page__logo-text">SUMO</span>
        <span class="login-page__logo-sub">Portal de Personal</span>
      </div>

      <StaffLoginForm
        :loading="loading"
        :error="error"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.login-page {
  align-items: center;
  background: var(--color-dark);
  display: flex;
  justify-content: center;
  min-height: 100dvh;
  padding: 1.5rem;
}

.login-page__card {
  background: var(--color-surface);
  border-radius: 1rem;
  max-width: 420px;
  padding: 2.5rem 2rem;
  width: 100%;
}

.login-page__logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 2rem;
}

.login-page__logo-text {
  color: var(--color-brand);
  font-family: var(--font-lato);
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.login-page__logo-sub {
  color: var(--color-text-muted);
  font-family: var(--font-lato);
  font-size: 0.875rem;
}
</style>
