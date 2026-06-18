function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const loyaltyConfig = {
  get pointsPerVisit() {
    return parsePositiveInt(process.env.LOYALTY_POINTS_PER_VISIT, 1)
  },
  get velocityThreshold() {
    const n = parseInt(process.env.LOYALTY_VELOCITY_THRESHOLD ?? '', 10)
    return Number.isFinite(n) && n > 0 ? n : n === 0 ? 0 : 5
  },
}
