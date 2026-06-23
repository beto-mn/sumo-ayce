import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader.vue'

// Stub child components auto-resolved by Nuxt
const stubs = {
  UiKicker: { template: '<span class="ui-kicker"><slot /></span>' },
}

describe('PageHeader', () => {
  it('renders the badge text', () => {
    const wrapper = mount(PageHeader, {
      props: { badge: 'Promociones', title: 'Promotions' },
      global: { stubs },
    })
    expect(wrapper.find('.ui-kicker').text()).toBe('Promociones')
  })

  it('renders the title in an h1', () => {
    const wrapper = mount(PageHeader, {
      props: { badge: 'Promo', title: 'Todas las promociones' },
      global: { stubs },
    })
    expect(wrapper.find('h1').text()).toBe('Todas las promociones')
  })

  it('renders subtitle when provided', () => {
    const wrapper = mount(PageHeader, {
      props: {
        badge: 'Promo',
        title: 'Title',
        subtitle: 'Una descripción breve.',
      },
      global: { stubs },
    })
    expect(wrapper.find('p').text()).toBe('Una descripción breve.')
  })

  it('does NOT render a <p> when subtitle is omitted', () => {
    const wrapper = mount(PageHeader, {
      props: { badge: 'Promo', title: 'Title' },
      global: { stubs },
    })
    expect(wrapper.find('p').exists()).toBe(false)
  })
})
