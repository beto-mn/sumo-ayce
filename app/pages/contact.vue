<script setup lang="ts">
import { ref, toRef } from 'vue'
import { state } from '@/features/contact/composables/useContact'
import type { ContactBranch } from '@/features/contact/types'

const { t } = useI18n()

useSeoMeta({
  title: t('contact.seo.title'),
  description: t('contact.seo.description'),
})

const selectedBranch = ref<ContactBranch | null>(null)
const formName = toRef(state, 'name')
const formMessage = toRef(state, 'message')

function onUpdateSelectedBranch(branch: ContactBranch | null) {
  selectedBranch.value = branch
}
</script>

<template>
  <div class="px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <UiPageHeader
        :badge="t('contact.page.badge')"
        badge-tone="pink"
        :title="t('contact.page.title')"
      />

      <!-- Two-column layout: side-by-side ≥880px, stacked <880px -->
      <div class="grid grid-cols-1 gap-6 min-[880px]:grid-cols-2">
        <ContactForm
          @update:selected-branch="onUpdateSelectedBranch"
        />
        <ContactInfo
          :selected-branch="selectedBranch"
          :name="formName"
          :message="formMessage"
        />
      </div>
    </div>
  </div>
</template>
