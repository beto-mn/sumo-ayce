<script setup lang="ts">
type State = 'idle' | 'loading' | 'success' | 'error'

const props = defineProps<{
  state?: State
  errorMessage?: string
}>()

const emit = defineEmits<{
  confirm: [ticketId: string]
}>()

const ticketId = ref('')
const showInput = ref(false)

watch(
  () => props.state,
  val => {
    if (val === 'idle') {
      showInput.value = false
      ticketId.value = ''
    }
  }
)

function openInput() {
  showInput.value = true
  ticketId.value = ''
}

function submit() {
  if (!ticketId.value.trim()) return
  emit('confirm', ticketId.value.trim())
}
</script>

<template>
  <div class="visit-btn-wrapper">
    <p v-if="props.state === 'success'" class="visit-btn__success">
      ¡Visita registrada correctamente!
    </p>

    <p v-else-if="props.state === 'error'" class="visit-btn__error" role="alert">
      {{ props.errorMessage ?? 'Error al registrar la visita' }}
    </p>

    <template v-else-if="showInput">
      <div class="visit-btn__input-row">
        <input
          v-model="ticketId"
          type="text"
          class="visit-btn__input"
          placeholder="ID de ticket"
          :disabled="props.state === 'loading'"
          @keyup.enter="submit"
        />
        <button
          class="visit-btn visit-btn--confirm"
          :disabled="!ticketId.trim() || props.state === 'loading'"
          @click="submit"
        >
          {{ props.state === 'loading' ? 'Registrando…' : 'Confirmar' }}
        </button>
      </div>
    </template>

    <button v-else class="visit-btn" @click="openInput">
      Registrar visita
    </button>
  </div>
</template>

<style scoped>
.visit-btn-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.visit-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 0.5rem;
  color: rgb(var(--panel));
  cursor: pointer;
  font-family: var(--font-lato);
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 0.75rem 1.25rem;
  transition: opacity 0.15s;
  width: 100%;
}

.visit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.visit-btn--confirm {
  flex-shrink: 0;
  width: auto;
}

.visit-btn__input-row {
  display: flex;
  gap: 0.5rem;
}

.visit-btn__input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  flex: 1;
  font-family: var(--font-lato);
  font-size: 0.9375rem;
  padding: 0.625rem 0.875rem;
  outline: none;
}

.visit-btn__input:focus {
  border-color: var(--color-brand);
}

.visit-btn__success {
  color: rgb(var(--green));
  font-size: 0.875rem;
  margin: 0;
}

.visit-btn__error {
  color: rgb(var(--pink));
  font-size: 0.875rem;
  margin: 0;
}
</style>
