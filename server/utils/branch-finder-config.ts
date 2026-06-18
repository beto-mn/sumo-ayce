function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10)
  return parsed > 0 ? parsed : fallback
}

const defaultRadiusKm = parsePositiveInt(
  process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM,
  5
)
const maxRadiusKm = parsePositiveInt(
  process.env.BRANCH_FINDER_MAX_RADIUS_KM,
  20
)

export const branchFinderConfig = { defaultRadiusKm, maxRadiusKm }

export function buildRadii(min: number, max: number): number[] {
  const r = (max / min) ** (1 / 3)
  return [min, Math.round(min * r), Math.round(min * r * r), max]
}
