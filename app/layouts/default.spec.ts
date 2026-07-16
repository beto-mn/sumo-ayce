import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DefaultLayout from './default.vue'

const stubs = {
  SiteHeader: { template: '<header />' },
  SiteMarquee: { template: '<div class="marquee" />' },
  SiteFooter: { template: '<footer />' },
}

describe('default layout', () => {
  it('paints the sitewide watermark texture alongside the base cream background', () => {
    // FR-005/FR-006: the watermark MUST be layered on the same root wrapper
    // as the existing `bg-bg` base color — a second CSS background layer,
    // not a separate overlay element (research.md R4).
    const wrapper = mount(DefaultLayout, { global: { stubs } })
    const root = wrapper.get('div')
    expect(root.classes()).toContain('bg-bg')
    expect(root.classes()).toContain('bg-watermark')
    expect(root.classes()).toContain('bg-repeat')
  })

  it('still renders header, marquee, main slot, and footer', () => {
    const wrapper = mount(DefaultLayout, {
      global: { stubs },
      slots: { default: '<p>page content</p>' },
    })
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('.marquee').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.text()).toContain('page content')
  })
})
