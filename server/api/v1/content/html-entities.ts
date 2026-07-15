/**
 * Dependency-free HTML-entity decoder for short WordPress `title.rendered`
 * strings (e.g. `2&#215;1` → `2×1`). WordPress returns titles HTML-encoded; the
 * promotion title is a short label using a bounded set of entities, so a full
 * HTML parser is overkill (Article X — no new dependency).
 *
 * Handles decimal (`&#215;`) and hex (`&#x2715;`) numeric entities plus a fixed
 * map of common named entities. Unknown entities are left untouched. Stray tags
 * are stripped defensively so a title never renders raw markup.
 */

/** Named entities that can appear in short editorial titles. */
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#039': "'",
  nbsp: '\u00A0',
  ndash: '–',
  mdash: '—',
  times: '×',
  hellip: '…',
}

/** Resolve a single numeric entity body (e.g. `215` or `x2715`) to a char. */
function decodeNumeric(body: string): string | null {
  const isHex = body[0] === 'x' || body[0] === 'X'
  const codePoint = Number.parseInt(
    isHex ? body.slice(1) : body,
    isHex ? 16 : 10
  )
  if (!Number.isFinite(codePoint) || codePoint <= 0) return null
  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return null
  }
}

/** Decode HTML entities in `value` and strip any stray tags. */
export function decodeHtmlEntities(value: string): string {
  if (value === '') return ''
  const withoutTags = value.replace(/<[^>]*>/g, '')
  return withoutTags.replace(
    /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z0-9]+);/g,
    (match, body: string) => {
      if (body[0] === '#') {
        const decoded = decodeNumeric(body.slice(1))
        return decoded ?? match
      }
      return NAMED_ENTITIES[body] ?? match
    }
  )
}
