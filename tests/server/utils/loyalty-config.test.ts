import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('loyaltyConfig', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('defaults pointsPerVisit to 1 when env is absent', async () => {
    delete process.env.LOYALTY_POINTS_PER_VISIT
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(1)
  })

  it('reads pointsPerVisit from env', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '25'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(25)
  })

  it('falls back to 1 when LOYALTY_POINTS_PER_VISIT is 0', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '0'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(1)
  })

  it('falls back to 1 when LOYALTY_POINTS_PER_VISIT is negative', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '-5'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(1)
  })

  it('defaults velocityThreshold to 5 when env is absent', async () => {
    delete process.env.LOYALTY_VELOCITY_THRESHOLD
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(5)
  })

  it('reads velocityThreshold from env', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '1'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(1)
  })

  it('returns 0 when LOYALTY_VELOCITY_THRESHOLD=0 (feature disabled)', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '0'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(0)
  })

  it('falls back to 5 when LOYALTY_VELOCITY_THRESHOLD is negative', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '-1'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(5)
  })
})
