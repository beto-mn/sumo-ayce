import { describe, expect, it } from 'vitest'
import { pickLocale } from './bilingual'

describe('pickLocale', () => {
  it('returns the Spanish string for locale es', () => {
    expect(pickLocale({ es: 'Hola', en: 'Hi' }, 'es')).toBe('Hola')
  })

  it('returns the English string for locale en', () => {
    expect(pickLocale({ es: 'Hola', en: 'Hi' }, 'en')).toBe('Hi')
  })

  it('falls back to Spanish when the English string is empty', () => {
    expect(pickLocale({ es: 'Hola', en: '' }, 'en')).toBe('Hola')
  })

  it('falls back to Spanish for unknown locales', () => {
    expect(pickLocale({ es: 'Hola', en: 'Hi' }, 'fr')).toBe('Hola')
  })
})
