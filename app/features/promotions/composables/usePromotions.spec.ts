import { describe, expect, it } from 'vitest'

describe('usePromotions', () => {
  it('starts with lightboxState.open = false', async () => {
    const { usePromotions } = await import('./usePromotions')
    const { lightboxState } = usePromotions()
    expect(lightboxState.value.open).toBe(false)
  })

  it('starts with lightboxState.imageUrl = null', async () => {
    const { usePromotions } = await import('./usePromotions')
    const { lightboxState } = usePromotions()
    expect(lightboxState.value.imageUrl).toBeNull()
  })

  it('openLightbox sets open=true and stores the imageUrl', async () => {
    const { usePromotions } = await import('./usePromotions')
    const { lightboxState, openLightbox } = usePromotions()
    openLightbox('https://cdn.example.com/promo.jpg')
    expect(lightboxState.value.open).toBe(true)
    expect(lightboxState.value.imageUrl).toBe(
      'https://cdn.example.com/promo.jpg'
    )
  })

  it('closeLightbox sets open=false and clears imageUrl', async () => {
    const { usePromotions } = await import('./usePromotions')
    const { lightboxState, openLightbox, closeLightbox } = usePromotions()
    openLightbox('https://cdn.example.com/promo.jpg')
    closeLightbox()
    expect(lightboxState.value.open).toBe(false)
    expect(lightboxState.value.imageUrl).toBeNull()
  })
})
