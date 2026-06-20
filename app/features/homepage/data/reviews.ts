import type { Review } from '@/types/content'

/**
 * Static/hardcoded Google reviews fixture committed in the repo (FR-017).
 * NOT fetched from WordPress, the DB, or the Google Places API. Typed against
 * `Review[]` so a later feature can swap the source without changing the
 * reviews component contract. Content mirrors the Mercado Pop reference set
 * (all 5-star) for realism.
 */
export const REVIEWS: Review[] = [
  {
    id: 'r1',
    authorName: 'Mariana G.',
    rating: 5,
    text: {
      es: 'El mejor all you can eat de sushi de la zona. El Dragon Roll es otro nivel y el servicio rapidísimo.',
      en: 'Best all-you-can-eat sushi around. The Dragon Roll is next level and service is super fast.',
    },
    source: 'google',
    reviewedAt: '2026-05-12',
  },
  {
    id: 'r2',
    authorName: 'Diego R.',
    rating: 5,
    text: {
      es: 'Pedí por SUMO Express y llegó en 25 min, todo bien sellado y caliente. Repetiré sin duda.',
      en: 'Ordered SUMO Express and it arrived in 25 min, sealed and hot. Definitely ordering again.',
    },
    source: 'google',
    reviewedAt: '2026-04-28',
  },
  {
    id: 'r3',
    authorName: 'Paola M.',
    rating: 5,
    text: {
      es: 'Ambiente increíble para ir con amigos. La promo de martes de ramen está imperdible.',
      en: 'Amazing vibe to go with friends. The Tuesday ramen deal is a must.',
    },
    source: 'google',
    reviewedAt: '2026-04-02',
  },
  {
    id: 'r4',
    authorName: 'Luis A.',
    rating: 5,
    text: {
      es: 'Buena variedad y precio justo para todo lo que comes. La sucursal siempre llena, mejor reservar.',
      en: 'Great variety and fair price for all you eat. Always packed — better to book.',
    },
    source: 'google',
    reviewedAt: '2026-03-15',
  },
  {
    id: 'r5',
    authorName: 'Andrea V.',
    rating: 5,
    text: {
      es: 'Que las smash burgers entren en el All You Can Eat es una locura. Comí riquísimo, volveré pronto.',
      en: 'Smash burgers being part of the all you can eat is wild. Ate so well, coming back soon.',
    },
    source: 'google',
    reviewedAt: '2026-03-01',
  },
  {
    id: 'r6',
    authorName: 'Carlos T.',
    rating: 5,
    text: {
      es: 'Servicio rapidísimo y los postres están deliciosos. Excelente relación calidad-precio.',
      en: 'Super fast service and the desserts are delicious. Excellent value for money.',
    },
    source: 'google',
    reviewedAt: '2026-02-14',
  },
]
