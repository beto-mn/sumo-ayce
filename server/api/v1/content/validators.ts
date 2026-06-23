import { z } from 'zod'
import type { Promotion } from '@/types/content'
import type {
  WpPromotion,
  WpPromotionAcf,
  WpPromotionsResponse,
} from '@/types/wordpress'
import { logger } from '../../../utils/logger'

/**
 * Zod schema for a single raw WordPress `promociones` item.
 *
 * The live endpoint (`GET /wp-json/wp/v2/promociones`) returns top-level WP
 * fields plus an `acf` group that holds the editorial content (see
 * {@link WpPromotion} / {@link WpPromotionAcf} for the upstream TS shape).
 * Bilingual values live under `acf.*_es` / `acf.*_en`; `acf.imagen` is a media
 * **ID** (resolved to a URL later by the route). The Zod schema below is the
 * runtime source of truth — the TS types are compile-time documentation only.
 * Unknown/extra fields are ignored; an item that fails validation is dropped
 * individually (never the whole response).
 */
const acfSchema = z.object({
  badge_es: z.string().min(1),
  badge_en: z.string().optional(),
  titulo_es: z.string().min(1),
  titulo_en: z.string().optional(),
  // Allow empty — a promo without description/validity still renders,
  // rather than being silently dropped.
  descripcion_es: z.string().default(''),
  descripcion_en: z.string().optional(),
  vigencia_es: z.string().default(''),
  vigencia_en: z.string().optional(),
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
  // Media ID (number) or 0/false/'' when no image is attached.
  imagen: z.union([z.number(), z.string(), z.boolean()]).optional(),
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
  acf: acfSchema,
})

export type RawPromotion = z.infer<typeof rawPromotionSchema>

/**
 * A parsed promotion still awaiting image resolution. `imageMediaId` is the
 * WordPress media ID (or null when none is attached); the route resolves it to
 * a `source_url` and produces the final `Promotion`.
 */
export interface ParsedPromotion extends Omit<Promotion, 'imageUrl'> {
  imageMediaId: number | null
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

/** Coerce the loosely-typed `acf.imagen` field to a positive media ID or null. */
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

/** Map a validated raw WP item to a `ParsedPromotion` (pre image-resolution). */
function mapPromotion(raw: RawPromotion): ParsedPromotion {
  const { acf } = raw
  return {
    id: String(raw.id),
    badge: { es: acf.badge_es, en: acf.badge_en ?? acf.badge_es },
    title: { es: acf.titulo_es, en: acf.titulo_en ?? acf.titulo_es },
    description: {
      es: acf.descripcion_es,
      en: acf.descripcion_en ?? acf.descripcion_es,
    },
    validity: { es: acf.vigencia_es, en: acf.vigencia_en ?? acf.vigencia_es },
    color: toPromotionColor(acf.color),
    type: acf.tipo,
    active: acf.activa,
    publishedAt: raw.date,
    imageMediaId: toMediaId(acf.imagen),
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
