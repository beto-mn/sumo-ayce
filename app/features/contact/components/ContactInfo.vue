<script setup lang="ts">
import { computed } from 'vue'
import type { ContactBranch } from '../types'

interface Props {
  selectedBranch: ContactBranch | null
  name: string
  message: string
}

const props = defineProps<Props>()

const { t } = useI18n()

const whatsappUrl = computed(() => {
  if (!props.selectedBranch) return null
  return `https://wa.me/${props.selectedBranch.phone}`
})

const mailtoHref = computed(() => {
  const email = t('contact.email')
  const branchPart = props.selectedBranch
    ? ` — ${props.selectedBranch.name}`
    : ''
  const subject =
    props.name || props.message ? `Contacto SUMO${branchPart}` : ''
  const body =
    props.name || props.message
      ? `Nombre: ${props.name}\n\nMensaje: ${props.message}`
      : ''

  if (!subject && !body) return `mailto:${email}`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

const socialLinks = computed(() => [
  {
    key: 'instagram',
    label: 'Instagram',
    href: t('contact.socialInstagram'),
    testId: 'social-instagram',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: t('contact.socialFacebook'),
    testId: 'social-facebook',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    href: t('contact.socialTiktok'),
    testId: 'social-tiktok',
  },
])
</script>

<template>
  <div class="rounded-pop border-pop border-ink shadow-pop bg-panel p-6">
    <h2 class="font-disp text-h-sm font-extrabold text-ink mb-6">
      {{ t('contact.info.title') }}
    </h2>

    <!-- WhatsApp section -->
    <section class="mb-6">
      <p class="font-disp text-kicker uppercase text-ink mb-3">
        {{ t('contact.info.whatsappLabel') }}
      </p>
      <p v-if="!selectedBranch" class="font-body text-soft">
        {{ t('contact.info.whatsappPrompt') }}
      </p>
      <a
        v-else
        :href="whatsappUrl ?? undefined"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`${t('contact.info.whatsappLabel')}: ${selectedBranch.phone}`"
        data-testid="whatsapp-pill"
        class="inline-flex items-center gap-2 rounded-pop-full border-pop border-ink bg-panel px-4 py-2 font-disp font-extrabold text-ink shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop min-h-[44px]"
      >
        {{ selectedBranch.phone }}
      </a>
    </section>

    <!-- Email section -->
    <section class="mb-6">
      <p class="font-disp text-kicker uppercase text-ink mb-3">
        {{ t('contact.info.emailLabel') }}
      </p>
      <a
        :href="mailtoHref"
        data-testid="email-link"
        class="font-body text-ink underline hover:text-soft transition-colors"
      >
        {{ t('contact.email') }}
      </a>
    </section>

    <!-- Social links -->
    <section>
      <p class="font-disp text-kicker uppercase text-ink mb-3">
        {{ t('contact.info.socialTitle') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="social in socialLinks"
          :key="social.key"
          :href="social.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="social.label"
          :data-testid="social.testId"
          class="inline-flex items-center gap-2 rounded-pop-full border-pop border-ink bg-panel px-4 py-2 font-disp font-extrabold text-ink shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop min-h-[44px]"
        >
          {{ social.label }}
        </a>
      </div>
    </section>
  </div>
</template>
