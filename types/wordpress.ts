/**
 * Raw WordPress REST shapes for the `promociones` custom post type.
 *
 * Models the LIVE payload of `GET /wp-json/wp/v2/promociones` (an array of
 * promotion objects with top-level WP fields plus an `acf` group holding the
 * bilingual editorial content). Consumed server-side by the homepage promotions
 * route and (later) the dedicated promotions page (feature 012).
 *
 * These are COMPILE-TIME documentation of the upstream shape only. The runtime
 * source of truth is the Zod schema in `server/api/v1/content/validators.ts`,
 * which validates and drops malformed items individually.
 */

/** WordPress rendered-field wrapper (e.g. `title.rendered`). */
export interface WpRendered {
  rendered: string
}

/** ACF group attached to each `promociones` item. */
export interface WpPromotionAcf {
  badge_es: string
  badge_en: string
  titulo_es: string
  titulo_en: string
  descripcion_es: string
  descripcion_en: string
  vigencia_es: string
  vigencia_en: string
  /** ACF select — decorative color. */
  color: 'orange' | 'blue' | 'pink' | 'yellow' | 'green' | (string & {})
  /** ACF select — location/line type. */
  tipo: 'ayce' | 'express' | 'all' | (string & {})
  activa: boolean
  /** ACF boolean — "show on homepage" flag (drives the `?home=1` query). */
  home: boolean
  /** WordPress media attachment ID (0 when none). */
  imagen: number
}

/** A single raw `promociones` item as returned by the REST endpoint. */
export interface WpPromotion {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: WpRendered
  featured_media: number
  class_list: string[]
  acf: WpPromotionAcf
}

/** The full `GET /wp-json/wp/v2/promociones` response: an array of items. */
export type WpPromotionsResponse = WpPromotion[]
