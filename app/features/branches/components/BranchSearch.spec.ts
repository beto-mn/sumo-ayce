import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CpState, GeoState } from '../types'

vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))

import BranchSearch from './BranchSearch.vue'

const idleGeo: GeoState = {
  status: 'idle',
  errorMessage: null,
  userLat: null,
  userLng: null,
}
const idleCp: CpState = { value: '', status: 'idle', errorMessage: null }

describe('BranchSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the geo button when geo is idle', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp },
    })
    expect(wrapper.find('[data-testid="geo-button"]').exists()).toBe(true)
  })

  it('emits request-geo when geo button is clicked', async () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp },
    })
    await wrapper.find('[data-testid="geo-button"]').trigger('click')
    expect(wrapper.emitted('request-geo')).toBeTruthy()
  })

  it('hides geo button when geoState.status is unsupported', () => {
    const wrapper = mount(BranchSearch, {
      props: {
        geoState: { ...idleGeo, status: 'unsupported' },
        cpState: idleCp,
      },
    })
    expect(wrapper.find('[data-testid="geo-button"]').exists()).toBe(false)
  })

  it('disables geo button while geoState.status is loading', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: { ...idleGeo, status: 'loading' }, cpState: idleCp },
    })
    expect(
      wrapper.find('[data-testid="geo-button"]').attributes('disabled')
    ).toBeDefined()
  })

  it('shows geo error message when geoState.status is error', () => {
    const wrapper = mount(BranchSearch, {
      props: {
        geoState: {
          ...idleGeo,
          status: 'error',
          errorMessage: 'Permiso denegado',
        },
        cpState: idleCp,
      },
    })
    expect(wrapper.html()).toContain('Permiso denegado')
  })

  // ── CP form (shown when no active badge) ──────────────────────────────────────

  it('shows CP form when activeCp is not set', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp },
    })
    expect(wrapper.find('[data-testid="cp-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cp-form"]').exists()).toBe(true)
  })

  it('emits cp-submit with the typed value on form submit', async () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp },
    })
    await wrapper.find('[data-testid="cp-input"]').setValue('11560')
    await wrapper.find('[data-testid="cp-form"]').trigger('submit')
    expect(wrapper.emitted('cp-submit')).toBeTruthy()
    expect(wrapper.emitted('cp-submit')?.[0]).toEqual(['11560'])
  })

  it('shows CP error when cpState.status is error', () => {
    const wrapper = mount(BranchSearch, {
      props: {
        geoState: idleGeo,
        cpState: {
          value: '99999',
          status: 'error',
          errorMessage: 'Código postal no encontrado',
        },
      },
    })
    expect(wrapper.html()).toContain('Código postal no encontrado')
  })

  // ── CP badge ──────────────────────────────────────────────────────────────────

  it('shows cp-badge when activeCp is set', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp, activeCp: '11560' },
    })
    const badge = wrapper.find('[data-testid="cp-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('11560')
  })

  it('hides cp-form when activeCp is set', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp, activeCp: '11560' },
    })
    expect(wrapper.find('[data-testid="cp-form"]').exists()).toBe(false)
  })

  it('emits clear-cp when the badge X button is clicked', async () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp, activeCp: '11560' },
    })
    await wrapper.find('[data-testid="cp-badge-clear"]').trigger('click')
    expect(wrapper.emitted('clear-cp')).toBeTruthy()
  })

  it('does not show cp-badge when activeCp is null', () => {
    const wrapper = mount(BranchSearch, {
      props: { geoState: idleGeo, cpState: idleCp, activeCp: null },
    })
    expect(wrapper.find('[data-testid="cp-badge"]').exists()).toBe(false)
  })
})
