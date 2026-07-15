import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities } from './html-entities'

describe('decodeHtmlEntities', () => {
  // ── Numeric (decimal) entities ────────────────────────────────────────────
  it('decodes a decimal numeric entity (&#215; → ×)', () => {
    expect(decodeHtmlEntities('2&#215;1 en sushi')).toBe('2×1 en sushi')
  })

  it('decodes an en-dash decimal entity (&#8211; → –)', () => {
    expect(decodeHtmlEntities('Lun&#8211;Vie')).toBe('Lun–Vie')
  })

  // ── Numeric (hex) entities ─────────────────────────────────────────────────
  it('decodes a hex numeric entity (&#x2715; → ✕)', () => {
    expect(decodeHtmlEntities('a&#x2715;b')).toBe('a✕b')
  })

  it('decodes an uppercase hex numeric entity (&#X41; → A)', () => {
    expect(decodeHtmlEntities('&#X41;BC')).toBe('ABC')
  })

  // ── Named entities ─────────────────────────────────────────────────────────
  it('decodes &amp; to an ampersand', () => {
    expect(decodeHtmlEntities('Alitas &amp; Boneless')).toBe(
      'Alitas & Boneless'
    )
  })

  it('decodes &#039; and &apos; to an apostrophe', () => {
    expect(decodeHtmlEntities('Jack Daniel&#039;s')).toBe("Jack Daniel's")
    expect(decodeHtmlEntities('L&apos;Or')).toBe("L'Or")
  })

  it('decodes &quot; to a double quote', () => {
    expect(decodeHtmlEntities('&quot;Promo&quot;')).toBe('"Promo"')
  })

  it('decodes &lt; and &gt; to angle brackets', () => {
    expect(decodeHtmlEntities('a &lt;b&gt; c')).toBe('a <b> c')
  })

  it('decodes &nbsp; to a non-breaking space', () => {
    expect(decodeHtmlEntities('2&nbsp;x&nbsp;1')).toBe('2\u00A0x\u00A01')
  })

  it('decodes &times; &ndash; &mdash; &hellip;', () => {
    expect(decodeHtmlEntities('2&times;1')).toBe('2×1')
    expect(decodeHtmlEntities('a&ndash;b')).toBe('a–b')
    expect(decodeHtmlEntities('a&mdash;b')).toBe('a—b')
    expect(decodeHtmlEntities('wait&hellip;')).toBe('wait…')
  })

  // ── Passthrough / edge cases ────────────────────────────────────────────────
  it('returns a plain string unchanged', () => {
    expect(decodeHtmlEntities('Martes 2x1')).toBe('Martes 2x1')
  })

  it('returns an empty string for empty input', () => {
    expect(decodeHtmlEntities('')).toBe('')
  })

  it('leaves an unknown entity untouched', () => {
    expect(decodeHtmlEntities('a &frac12; b')).toBe('a &frac12; b')
  })

  it('strips stray HTML tags defensively', () => {
    expect(decodeHtmlEntities('<b>2&#215;1</b>')).toBe('2×1')
  })
})
