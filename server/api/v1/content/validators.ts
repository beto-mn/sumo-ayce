import { z } from 'zod'
import type { Promotion } from '@/types/content'
import type {
  WpPromotion,
  WpPromotionAcf,
  WpPromotionsResponse,
} from '@/types/wordpress'
import { logger } from '../../../utils/logger'
import { decodeHtmlEntities } from './html-entities'

/**
 * Zod schema for a single raw WordPress `promociones` item (NEW model).
 *
 * The live endpoint (`GET /wp-json/wp/v2/promociones`) returns top-level WP
 * fields — including `title.rendered`, the SOURCE of the promo title — plus an
 * `acf` group holding `badge_*`, `color`, `tipo`, `activa`/`home`, and three
 * responsive image media IDs (see {@link WpPromotion} / {@link WpPromotionAcf}).
 * The editorial text fields (`titulo_*`, `descripcion_*`, `vigencia_*`) and the
 * single `imagen` field were removed upstream; requiring the old `titulo_es`
 * was what dropped every promotion, so it is gone here. Unknown/extra fields
 * are ignored; an item that fails validation is dropped individually (never the
 * whole response).
 */
const acfSchema = z.object({
  badge_es: z.string().min(1),
  badge_en: z.string().optional(),
  // Accept any string for the editor-controlled badge color; unknown values
  // fall back to a default in `mapPromotion` rather than dropping the promo.
  color: z.string().min(1),
  tipo: z.enum(['all', 'ayce', 'express']),
  // Accept the common WP coercions (1/0/'1'/'0'/true/false) for both flags so
  // a misconfigured ACF field never silently drops a promotion.
  activa: z
    .union([z.boolean(), z.number(), z.string()])
    .transform(v => v === true || v === 1 || v === '1'),
  home: z.union([z.boolean(), z.number(), z.string()]).optional(),
  // Three responsive image fields — each a media ID (number) or 0/''/absent.
  // `.nullish()` (nullable + optional): the client may leave these as `null`
  // when no image is uploaded yet; such promos must still PARSE (they are
  // filtered out later, after resolution, rather than dropped at validation).
  imagen_desktop: z.union([z.number(), z.string(), z.boolean()]).nullish(),
  imagen_tablet: z.union([z.number(), z.string(), z.boolean()]).nullish(),
  imagen_movil: z.union([z.number(), z.string(), z.boolean()]).nullish(),
  // Terms & Conditions (assumed field keys, research.md R4). Nullish — NOT
  // required like `badge_es` — so a promo with the field absent, empty, or
  // filled in only one language still parses successfully; `mapPromotion`
  // decides whether the pair counts as "complete" (both non-empty).
  tyc_es: z.string().nullish(),
  tyc_en: z.string().nullish(),
})

/**
 * Compile-time assertion that the runtime-validated ACF shape stays a subset of
 * the documented upstream {@link WpPromotionAcf}. The schema is intentionally
 * narrower (stricter enums, optional `*_en`); this guard breaks the build if the
 * documented payload and the parsed fields ever diverge in incompatible ways.
 */
type _AcfFieldsMatchUpstream =
  z.infer<typeof acfSchema> extends Pick<
    WpPromotion['acf'],
    keyof z.infer<typeof acfSchema> & keyof WpPromotionAcf
  >
    ? true
    : never

const rawPromotionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string().min(1),
  title: z.object({ rendered: z.string() }),
  acf: acfSchema,
})

export type RawPromotion = z.infer<typeof rawPromotionSchema>

/**
 * A parsed promotion still awaiting image resolution. The three media IDs (or
 * null when none is attached) are resolved to `source_url`s by the route, which
 * then produces the final {@link Promotion}.
 */
export interface ParsedPromotion
  extends Omit<
    Promotion,
    'imageDesktopUrl' | 'imageTabletUrl' | 'imageMovilUrl'
  > {
  desktopMediaId: number | null
  tabletMediaId: number | null
  movilMediaId: number | null
}

/** Accepted badge colors; anything else normalizes to {@link DEFAULT_COLOR}. */
const PROMOTION_COLORS = [
  'orange',
  'pink',
  'blue',
  'yellow',
  'green',
] as const satisfies readonly Promotion['color'][]
const DEFAULT_COLOR: Promotion['color'] = 'orange'

/** Normalize an editor-supplied color to a known token, defaulting safely. */
function toPromotionColor(value: string): Promotion['color'] {
  return (PROMOTION_COLORS as readonly string[]).includes(value)
    ? (value as Promotion['color'])
    : DEFAULT_COLOR
}

/** Coerce a loosely-typed `acf.imagen_*` field to a positive media ID or null. */
function toMediaId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

/**
 * Bilingual-completeness projection for Terms & Conditions (FR-008,
 * research.md R4a): `terms` is set ONLY when BOTH `tyc_es` AND `tyc_en` are
 * non-empty after trimming. Deliberately NO same-language fallback branch
 * (unlike `badge_en`'s fallback to `badge_es`) — a partially-filled pair must
 * never render, so it resolves to `null` identically to a fully-empty pair.
 */
function toTerms(acf: Pick<WpPromotionAcf, 'tyc_es' | 'tyc_en'>) {
  const es = acf.tyc_es?.trim()
  const en = acf.tyc_en?.trim()
  return es && en ? { es, en } : null
}

/** Map a validated raw WP item to a `ParsedPromotion` (pre image-resolution). */
function mapPromotion(raw: RawPromotion): ParsedPromotion {
  const { acf } = raw
  return {
    id: String(raw.id),
    badge: { es: acf.badge_es, en: acf.badge_en ?? acf.badge_es },
    title: decodeHtmlEntities(raw.title.rendered.trim()),
    color: toPromotionColor(acf.color),
    type: acf.tipo,
    active: acf.activa,
    publishedAt: raw.date,
    desktopMediaId: toMediaId(acf.imagen_desktop),
    tabletMediaId: toMediaId(acf.imagen_tablet),
    movilMediaId: toMediaId(acf.imagen_movil),
    terms: toTerms(acf),
  }
}

/**
 * Validate an unknown upstream payload, dropping items that fail validation,
 * and map the survivors to `ParsedPromotion[]`. A non-array payload yields `[]`.
 *
 * The payload is expected to be a {@link WpPromotionsResponse} at runtime, but
 * it is typed `unknown` because it arrives untrusted from the network and is
 * validated item-by-item by {@link rawPromotionSchema}.
 */
export function parsePromotions(payload: unknown): ParsedPromotion[] {
  if (!Array.isArray(payload)) return []
  const promotions: ParsedPromotion[] = []
  // Typed as the documented upstream shape for readability; each item is still
  // validated at runtime by `rawPromotionSchema` before use.
  const items = payload as WpPromotionsResponse
  for (const item of items) {
    const result = rawPromotionSchema.safeParse(item)
    if (result.success) {
      promotions.push(mapPromotion(result.data))
    } else {
      const id = (item as unknown as Record<string, unknown>)?.id ?? '?'
      const slug = (item as unknown as Record<string, unknown>)?.slug ?? ''
      logger.warn(
        { id, slug, issues: result.error.issues },
        '[parsePromotions] dropped promo'
      )
    }
  }
  return promotions
}
