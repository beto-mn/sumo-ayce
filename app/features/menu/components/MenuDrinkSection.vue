<script setup lang="ts">
import { computed } from 'vue'
import type { PickerOption } from '@/features/menu/types'
import type {
  DrinkGroup,
  DrinkGroupMeta,
  DrinkSubGroup,
  FullMenuDish,
} from '@/types/menu'

const props = defineProps<{
  drinks: FullMenuDish[]
  drinkGroups: DrinkGroupMeta[]
  /** The single active drink-group key the shell resolved. */
  activeGroup: string
}>()

const { t, locale } = useI18n()

type SubGroup = {
  key: string
  label: string
  drinks: FullMenuDish[]
  order: number
}

/** DB display label for the active group (single source of truth — no i18n). */
const groupName = computed<string>(() => {
  const meta = props.drinkGroups.find(g => g.key === props.activeGroup)
  if (!meta) return ''
  return meta.name[locale.value as 'es' | 'en'] || meta.name.es
})

/** Localised group-level promo (rendered ONCE for the active group). */
const groupPromo = computed<string | null>(() => {
  const meta = props.drinkGroups.find(g => g.key === props.activeGroup)
  if (!meta?.promo) return null
  return meta.promo[locale.value as 'es' | 'en'] ?? meta.promo.es
})

const activeDrinks = computed(() =>
  props.drinks.filter(d => d.drinkGroup === (props.activeGroup as DrinkGroup))
)

const hasSubGroups = computed(() =>
  activeDrinks.value.some(d => d.drinkSubGroup !== null)
)

/** Sub-groups ordered by their displayOrder (Caguamón first). */
const subGroups = computed<SubGroup[]>(() => {
  const map = new Map<string, SubGroup>()
  for (const drink of activeDrinks.value) {
    const sg: DrinkSubGroup | null = drink.drinkSubGroup
    const key = sg?.key ?? ''
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: sg?.name[locale.value as 'es' | 'en'] ?? sg?.name.es ?? '',
        order: sg?.displayOrder ?? 0,
        drinks: [],
      })
    }
    map.get(key)?.drinks.push(drink)
  }
  return [...map.values()].sort((a, b) => a.order - b.order)
})

const vasoSumoFlavors: PickerOption[] = [
  { id: 'ron', label: '' },
  { id: 'tequila', label: '' },
  { id: 'vodka', label: '' },
  { id: 'whisky', label: '' },
  { id: 'new_mix', label: '' },
  { id: 'jack_daniels', label: '' },
]

const flavorOptions = computed<PickerOption[]>(() =>
  vasoSumoFlavors.map(f => ({
    ...f,
    label: t(`menu.vaso_sumo.flavor.${f.id}`),
  }))
)

function isVasoSumo(drink: FullMenuDish): boolean {
  return drink.name.es === 'Vaso Sumo'
}

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
/** Image cards span 2 tracks (full card); no-image cards span 1 (half width). */
function cardSpan(drink: FullMenuDish): string {
  return drink.imageUrl ? 'col-span-2' : 'col-span-1'
}
</script>

<template>
  <section id="drinks" class="scroll-mt-24">
    <h2 class="mb-6 font-disp font-extrabold uppercase text-h-lg">
      {{ groupName }}
    </h2>

    <div
      v-if="groupPromo"
      class="mb-6 inline-flex items-center rounded-pop-full border-pop border-ink bg-yellow px-4 py-2 font-disp font-extrabold text-kicker shadow-pop-sm"
    >
      {{ groupPromo }}
    </div>

    <!-- Grouped by sub-group (beers / destilados) -->
    <template v-if="hasSubGroups">
      <div v-for="sub in subGroups" :key="sub.key" class="mb-8 last:mb-0">
        <h3
          v-if="sub.label"
          class="mb-3 border-b border-ink/20 pb-1 font-disp font-bold uppercase text-kicker text-soft"
        >
          {{ sub.label }}
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          <MenuDrinkCard
            v-for="drink in sub.drinks"
            :key="drink.id"
            :class="cardSpan(drink)"
            :name="drinkName(drink)"
            :description="drinkDesc(drink)"
            :badge="drinkBadge(drink)"
            :price="drink.price"
            :image-url="drink.imageUrl"
          />
        </div>
      </div>
    </template>

    <!-- Flat card grid for the other groups -->
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
      <MenuDrinkCard
        v-for="drink in activeDrinks"
        :key="drink.id"
        :class="cardSpan(drink)"
        :name="drinkName(drink)"
        :description="drinkDesc(drink)"
        :badge="drinkBadge(drink)"
        :price="drink.price"
        :image-url="drink.imageUrl"
      >
        <MenuSaucePicker
          v-if="isVasoSumo(drink)"
          :options="flavorOptions"
          :picker-label="t('menu.vaso_sumo.picker_label')"
        />
      </MenuDrinkCard>
    </div>
  </section>
</template>
