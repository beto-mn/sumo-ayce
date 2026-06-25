<script setup lang="ts">
import { computed } from 'vue'
import type { DrinkGroup, DrinkSubGroup, FullMenuDish } from '@/types/menu'

const props = defineProps<{
  drinks: FullMenuDish[]
  activeGroup?: string | null
}>()

const { t, locale } = useI18n()

type DrinksByGroup = Map<DrinkGroup, FullMenuDish[]>
type SubGroup = {
  key: string
  label: string
  subtitle: string | null
  promo: string | null
  drinks: FullMenuDish[]
}

const grouped = computed((): DrinksByGroup => {
  const map = new Map<DrinkGroup, FullMenuDish[]>()
  for (const drink of props.drinks) {
    if (!drink.drinkGroup) continue
    if (props.activeGroup && drink.drinkGroup !== props.activeGroup) continue
    const list = map.get(drink.drinkGroup) ?? []
    list.push(drink)
    map.set(drink.drinkGroup, list)
  }
  return map
})

function resolveSubGroup(drink: FullMenuDish): DrinkSubGroup | null {
  return drink.drinkSubGroup ?? null
}

const beerSpiritSubGroups = computed((): SubGroup[] => {
  const drinks = grouped.value.get('beers_spirits' as DrinkGroup) ?? []
  const map = new Map<string, SubGroup>()
  const order: string[] = []

  for (const d of drinks) {
    const sg = resolveSubGroup(d)
    const key = sg?.key ?? ''
    const label = sg?.name[locale.value as 'es' | 'en'] ?? sg?.name.es ?? ''
    const subtitle =
      sg?.subtitle?.[locale.value as 'es' | 'en'] ?? sg?.subtitle?.es ?? null
    const promo =
      sg?.promo?.[locale.value as 'es' | 'en'] ?? sg?.promo?.es ?? null

    if (!map.has(key)) {
      map.set(key, { key, label, subtitle, promo, drinks: [] })
      order.push(key)
    }
    map.get(key)?.drinks.push(d)
  }
  return order
    .map(k => map.get(k))
    .filter((s): s is SubGroup => s !== undefined)
})

function drinkName(drink: FullMenuDish): string {
  return drink.name[locale.value as 'es' | 'en'] ?? drink.name.es
}

function drinkDesc(drink: FullMenuDish): string {
  return drink.description[locale.value as 'es' | 'en'] ?? drink.description.es
}

function drinkBadge(drink: FullMenuDish): string | null {
  if (!drink.badge) return null
  return drink.badge[locale.value as 'es' | 'en'] ?? drink.badge.es
}
</script>

<template>
  <section id="drinks" class="scroll-mt-24">
    <h2 class="mb-8 font-disp font-extrabold uppercase text-h-lg">
      {{ t('menu.category.drinks') }}
    </h2>
    <div class="flex flex-col gap-10">
      <div
        v-for="[groupKey, groupDrinks] in grouped"
        :key="groupKey"
      >
        <h3 class="mb-4 border-b-pop-sm border-b-ink pb-2 font-disp font-extrabold uppercase text-card-title">
          {{ t(`menu.drink_group.${groupKey}`) }}
        </h3>

        <!-- Beers & spirits: card grid with sub-group headers -->
        <template v-if="groupKey === 'beers_spirits'">
          <div v-for="sub in beerSpiritSubGroups" :key="sub.key" class="mb-8 last:mb-0">
            <h4
              v-if="sub.label"
              class="mb-3 border-b border-ink/20 pb-1 font-disp font-bold uppercase text-kicker text-soft"
            >
              {{ sub.label }}
            </h4>
            <p
              v-if="sub.subtitle"
              class="mb-3 font-disp text-kicker text-soft"
            >
              {{ sub.subtitle }}
            </p>
            <div
              v-if="sub.promo"
              class="mb-4 inline-flex items-center rounded-pop-full border-pop border-ink bg-yellow px-4 py-2 font-disp font-extrabold text-kicker shadow-pop-sm"
            >
              {{ sub.promo }}
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div
                v-for="drink in sub.drinks"
                :key="drink.id"
                class="flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm"
              >
                <div
                  v-if="drink.imageUrl"
                  class="relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink bg-accent/20 p-4"
                >
                  <NuxtImg
                    class="block h-full w-full object-contain"
                    style="aspect-ratio: auto"
                    :src="drink.imageUrl"
                    :alt="drinkName(drink)"
                    width="320"
                    loading="lazy"
                  />
                </div>
                <h4 class="font-disp font-extrabold uppercase text-dish-title">{{ drinkName(drink) }}</h4>
                <p v-if="drinkBadge(drink)" class="text-soft text-body">{{ drinkBadge(drink) }}</p>
                <span v-if="drink.price" class="font-disp font-extrabold text-dish-title">
                  {{ t('menu.dish.price_prefix') }}{{ drink.price }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Card grid for all other drink groups -->
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div
            v-for="drink in groupDrinks"
            :key="drink.id"
            class="flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm"
          >
            <div
              v-if="drink.imageUrl"
              class="relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink bg-accent/20 p-4"
            >
              <NuxtImg
                class="block h-full w-full object-contain"
                style="aspect-ratio: auto"
                :src="drink.imageUrl"
                :alt="drinkName(drink)"
                width="320"
                height="240"
                loading="lazy"
              />
            </div>
            <h4 class="font-disp font-extrabold uppercase text-dish-title">{{ drinkName(drink) }}</h4>
            <p class="text-soft text-body">{{ drinkDesc(drink) }}</p>
            <span v-if="drink.price" class="font-disp font-extrabold text-dish-title">
              {{ t('menu.dish.price_prefix') }}{{ drink.price }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
