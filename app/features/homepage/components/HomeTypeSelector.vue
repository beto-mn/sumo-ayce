<script setup lang="ts">
const { t, tm, rt } = useI18n()
const localePath = useLocalePath()

interface TypeOption {
  key: 'ayce' | 'express'
  to: string
  accent: 'ayce' | 'express'
}

const options: TypeOption[] = [
  { key: 'ayce', to: '/menu?type=ayce', accent: 'ayce' },
  { key: 'express', to: '/menu?type=express', accent: 'express' },
]

/** Read a localized array of chip labels for a given type. */
function chips(key: 'ayce' | 'express'): string[] {
  const raw = tm(`home.typeSelector.${key}.chips`) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(entry => rt(entry as never))
}
</script>

<template>
  <section
    class="flex flex-col gap-[1.625rem]"
    :aria-label="t('home.typeSelector.title')"
  >
    <header class="flex flex-col items-start gap-[0.875rem]">
      <UiKicker tone="ink">{{ t('home.typeSelector.kicker') }}</UiKicker>
      <h2
        class="m-0 font-disp font-extrabold uppercase leading-none tracking-[-0.02em] text-h-lg text-ink"
      >
        {{ t('home.typeSelector.title') }}
      </h2>
    </header>

    <div class="grid grid-cols-1 gap-5 min-[880px]:grid-cols-2">
      <UiCard
        v-for="option in options"
        :key="option.key"
        :accent="option.accent"
        class="type-card relative flex flex-col gap-3 overflow-hidden transition-[transform,box-shadow] duration-150 motion-reduce:transition-none hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-pop-lg motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-pop"
      >
        <span
          class="absolute -right-[30px] -top-[30px] h-[120px] w-[120px] rounded-full opacity-[0.18]"
          :class="option.accent === 'express' ? 'bg-blue' : 'bg-orange'"
          aria-hidden="true"
        />
        <UiSticker
          class="relative z-[1] self-start"
          :tone="option.accent === 'express' ? 'blue' : 'orange'"
          :rotate="-3"
        >
          {{ t(`home.typeSelector.${option.key}.badge`) }}
        </UiSticker>
        <h3
          class="relative z-[1] font-disp font-extrabold uppercase tracking-[-0.02em] text-card-title"
        >
          {{ t(`home.typeSelector.${option.key}.name`) }}
        </h3>
        <p class="relative z-[1] text-soft">
          {{ t(`home.typeSelector.${option.key}.desc`) }}
        </p>
        <div class="relative z-[1] flex flex-wrap gap-2">
          <UiChip
            v-for="(label, i) in chips(option.key)"
            :key="i"
            as="span"
            :accent="option.accent"
          >
            {{ label }}
          </UiChip>
        </div>
        <NuxtLink
          :to="localePath(option.to)"
          class="relative z-[1] mt-1 self-start no-underline"
        >
          <UiButton variant="ink" size="sm">
            {{ t('home.typeSelector.cta') }} →
          </UiButton>
        </NuxtLink>
      </UiCard>
    </div>
  </section>
</template>
