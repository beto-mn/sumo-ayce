<script setup lang="ts">
import { computed, useId } from 'vue'
import { cx } from '@/utils/cx'

interface TextareaProps {
  modelValue: string
  name: string
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<TextareaProps>(), {
  rows: 4,
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

const textareaClasses = computed(() =>
  cx(
    'w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3',
    'font-body text-ink placeholder:text-soft resize-y',
    'transition-shadow duration-150',
    'focus:outline-none focus:shadow-pop-sm',
    props.disabled && 'opacity-60 cursor-not-allowed',
    props.error && 'border-pink'
  )
)

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
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
    <textarea
      :id="fieldId"
      :name="name"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="textareaClasses"
      @input="onInput"
    />
    <p v-if="hint && !error" :id="hintId" class="text-sm text-soft">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="text-sm text-pink">
      {{ error }}
    </p>
  </div>
</template>
