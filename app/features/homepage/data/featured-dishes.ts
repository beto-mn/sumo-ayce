import type { FeaturedDish } from '@/types/content'

// TODO: featured dishes are served from this static fixture for now; swap for a
// real data source (e.g. a Nitro route) later. useFeaturedDishes() already
// returns the route-compatible shape, so the swap is drop-in.
export const FEATURED_DISHES: FeaturedDish[] = [
  {
    id: 'd1',
    name: 'Salmón Nigiri',
    description: {
      es: 'Salmón fresco sobre arroz avinagrado.',
      en: 'Fresh salmon over vinegared rice.',
    },
    imageUrl: null,
    badge: 'Top',
    category: 'frio',
  },
  {
    id: 'd2',
    name: 'Sumo Roll',
    description: {
      es: 'Roll tempura con salsa de la casa.',
      en: 'Tempura roll with house sauce.',
    },
    imageUrl: null,
    badge: null,
    category: 'rolls',
  },
  {
    id: 'd3',
    name: 'Alitas Sumo',
    description: {
      es: 'Alitas crujientes preparadas al instante.',
      en: 'Crispy wings, made to order.',
    },
    imageUrl: null,
    badge: 'Picante',
    category: 'caliente',
  },
  {
    id: 'd4',
    name: 'Gyoza',
    description: {
      es: 'Empanadillas selladas a la plancha.',
      en: 'Pan-seared dumplings.',
    },
    imageUrl: null,
    badge: null,
    category: 'caliente',
  },
  {
    id: 'd5',
    name: 'Té Verde Helado',
    description: {
      es: 'Bebida fría incluida en el AYCE.',
      en: 'Cold drink included in the AYCE.',
    },
    imageUrl: null,
    badge: null,
    category: 'bebidas',
  },
]
