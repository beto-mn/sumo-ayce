<script setup lang="ts">
import { computed, useId } from 'vue'
import { cx } from '@/utils/cx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  modelValue: string
  name: string
  options: SelectOption[]
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<SelectProps>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useId()
const hintId = `${fieldId}-hint`
const errorId = `${fieldId}-error`

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length ? ids.join(' ') : undefined
})

const selectClasses = computed(() =>
  cx(
    'w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 pr-10',
    'font-body text-ink appearance-none',
    'transition-shadow duration-150',
    'focus:outline-none focus:shadow-pop-sm',
    props.disabled && 'opacity-60 cursor-not-allowed',
    props.error && 'border-pink'
  )
)

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="fieldId"
      class="font-disp text-kicker uppercase text-ink"
    >
      {{ label }}<span v-if="required" class="text-pink"> *</span>
    </label>
    <div class="relative">
      <select
        :id="fieldId"
        :name="name"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="selectClasses"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <span
        class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-disp text-ink"
        aria-hidden="true"
        >▾</span
      >
    </div>
    <p v-if="hint && !error" :id="hintId" class="text-sm text-soft">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="text-sm text-pink">
      {{ error }}
    </p>
  </div>
</template>
