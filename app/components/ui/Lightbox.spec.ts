import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Lightbox from './Lightbox.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

function mountLightbox(props: {
  open: boolean
  src: string | null
  alt?: string
}) {
  return mount(Lightbox, { props, attachTo: document.body })
}

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('Lightbox', () => {
  it('renders nothing when open is false', () => {
    mountLightbox({ open: false, src: '/promo.jpg' })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.querySelector('img')).toBeNull()
  })

  it('renders nothing when src is null even if open', () => {
    mountLightbox({ open: true, src: null })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders the dialog and image when open with a src', () => {
    mountLightbox({ open: true, src: '/promo.jpg', alt: 'Promo flyer' })
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    const img = document.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/promo.jpg')
    expect(img.getAttribute('alt')).toBe('Promo flyer')
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountLightbox({ open: true, src: '/promo.jpg' })
    const button = document.querySelector(
      'button[aria-label="common.close"]'
    ) as HTMLButtonElement
    button.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when clicking the backdrop but not the image', async () => {
    const wrapper = mountLightbox({ open: true, src: '/promo.jpg' })
    const img = document.querySelector('img') as HTMLImageElement
    img.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeUndefined()

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when Escape is pressed', async () => {
    const wrapper = mountLightbox({ open: true, src: '/promo.jpg' })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('removes the Escape listener once closed', async () => {
    const wrapper = mountLightbox({ open: true, src: '/promo.jpg' })
    await wrapper.setProps({ open: false })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
