<script setup lang="ts">
const props = defineProps<{
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  submit: [email: string, password: string]
}>()

const email = ref('')
const password = ref('')

function handleSubmit() {
  emit('submit', email.value, password.value)
}
</script>

<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <div class="login-form__field">
      <label for="email" class="login-form__label">Correo electrónico</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="login-form__input"
        placeholder="cajero@sumo.com"
        autocomplete="email"
        required
      />
    </div>

    <div class="login-form__field">
      <label for="password" class="login-form__label">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="login-form__input"
        autocomplete="current-password"
        required
      />
    </div>

    <p v-if="props.error" class="login-form__error" role="alert">
      {{ props.error }}
    </p>

    <button type="submit" class="login-form__btn" :disabled="props.loading">
      <span v-if="props.loading">Iniciando sesión…</span>
      <span v-else>Iniciar sesión</span>
    </button>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.login-form__label {
  font-family: var(--font-lato);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.login-form__input {
  background: var(--color-dark);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-family: var(--font-lato);
  font-size: 1rem;
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color 0.15s;
}

.login-form__input:focus {
  border-color: var(--color-brand);
}

.login-form__error {
  color: rgb(var(--pink));
  font-size: 0.875rem;
  margin: 0;
}

.login-form__btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 1rem;
  font-weight: 700;
  padding: 0.875rem;
  transition: opacity 0.15s;
}

.login-form__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
