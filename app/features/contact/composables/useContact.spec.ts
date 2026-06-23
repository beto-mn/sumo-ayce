import { beforeEach, describe, expect, it } from 'vitest'

describe('useContact', () => {
  beforeEach(async () => {
    // Reset module state between tests
    const mod = await import('./useContact')
    mod.state.name = ''
    mod.state.branchId = ''
    mod.state.message = ''
  })

  // ── state ────────────────────────────────────────────────────────────────────

  it('initializes state with three empty string fields', async () => {
    const { state } = await import('./useContact')
    expect(state.name).toBe('')
    expect(state.branchId).toBe('')
    expect(state.message).toBe('')
  })

  it('state has no whatsapp field', async () => {
    const { state } = await import('./useContact')
    expect('whatsapp' in state).toBe(false)
  })

  // ── isFormValid ──────────────────────────────────────────────────────────────

  it('isFormValid returns false when all fields are empty', async () => {
    const { state, isFormValid } = await import('./useContact')
    state.name = ''
    state.branchId = ''
    state.message = ''
    expect(isFormValid.value).toBe(false)
  })

  it('isFormValid returns false when only name is filled', async () => {
    const { state, isFormValid } = await import('./useContact')
    state.name = 'Ana'
    state.branchId = ''
    state.message = ''
    expect(isFormValid.value).toBe(false)
  })

  it('isFormValid returns false when name and branchId are filled but message is empty', async () => {
    const { state, isFormValid } = await import('./useContact')
    state.name = 'Ana'
    state.branchId = 'branch-1'
    state.message = ''
    expect(isFormValid.value).toBe(false)
  })

  it('isFormValid returns true when all three fields are non-empty', async () => {
    const { state, isFormValid } = await import('./useContact')
    state.name = 'Ana'
    state.branchId = 'branch-1'
    state.message = 'Hola, quisiera reservar.'
    expect(isFormValid.value).toBe(true)
  })

  // ── buildWaUrl ───────────────────────────────────────────────────────────────

  it('buildWaUrl constructs correct wa.me URL', async () => {
    const { buildWaUrl } = await import('./useContact')
    const url = buildWaUrl('5215512345678', 'Hola, soy Ana.')
    expect(url).toBe('https://wa.me/5215512345678?text=Hola%2C%20soy%20Ana.')
  })

  it('buildWaUrl uses encodeURIComponent on the text parameter', async () => {
    const { buildWaUrl } = await import('./useContact')
    const text = 'Hello & Goodbye'
    const url = buildWaUrl('5215512345678', text)
    expect(url).toContain(encodeURIComponent(text))
  })

  it('buildWaUrl uses phone verbatim as path segment', async () => {
    const { buildWaUrl } = await import('./useContact')
    const url = buildWaUrl('5215512345678', 'test')
    expect(url).toMatch(/^https:\/\/wa\.me\/5215512345678/)
  })

  // ── buildMessageText ─────────────────────────────────────────────────────────

  it('buildMessageText replaces {name} and {message} tokens', async () => {
    const { buildMessageText } = await import('./useContact')
    const result = buildMessageText(
      { name: 'Ana', branchId: 'b1', message: 'Quiero reservar' },
      'Hola, soy {name}.\n\n{message}'
    )
    expect(result).toBe('Hola, soy Ana.\n\nQuiero reservar')
  })

  it('buildMessageText does not inject a {whatsapp} token', async () => {
    const { buildMessageText } = await import('./useContact')
    const template = 'Hola, soy {name}.\n\n{message}'
    const result = buildMessageText(
      { name: 'Ana', branchId: 'b1', message: 'Mensaje' },
      template
    )
    expect(result).not.toContain('{whatsapp}')
    expect(result).not.toContain('{phone}')
  })

  // ── filterAndSortBranches ────────────────────────────────────────────────────

  it('filterAndSortBranches excludes branches where phone is null', async () => {
    const { filterAndSortBranches } = await import('./useContact')
    const branches = [
      {
        id: '1',
        name: 'SUMO Polanco',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'ayce' as const,
        schedule: null,
        phone: '+5215512345678',
      },
      {
        id: '2',
        name: 'SUMO Buenavista',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'express' as const,
        schedule: null,
        phone: null,
      },
    ]
    const result = filterAndSortBranches(branches)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('filterAndSortBranches sorts alphabetically by name case-insensitively', async () => {
    const { filterAndSortBranches } = await import('./useContact')
    const branches = [
      {
        id: '1',
        name: 'SUMO Satélite',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'ayce' as const,
        schedule: null,
        phone: '+52155001',
      },
      {
        id: '2',
        name: 'SUMO Buenavista',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'express' as const,
        schedule: null,
        phone: '+52155002',
      },
      {
        id: '3',
        name: 'sumo alameda',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'ayce' as const,
        schedule: null,
        phone: '+52155003',
      },
    ]
    const result = filterAndSortBranches(branches)
    expect(result[0]?.name).toBe('sumo alameda')
    expect(result[1]?.name).toBe('SUMO Buenavista')
    expect(result[2]?.name).toBe('SUMO Satélite')
  })

  it('filterAndSortBranches maps to ContactBranch shape', async () => {
    const { filterAndSortBranches } = await import('./useContact')
    const branches = [
      {
        id: '1',
        name: 'SUMO Polanco',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'ayce' as const,
        schedule: null,
        phone: '5215512345678',
      },
    ]
    const result = filterAndSortBranches(branches)
    expect(result[0]).toEqual({
      id: '1',
      name: 'SUMO Polanco',
      phone: '5215512345678',
    })
  })
})
