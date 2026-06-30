import { env } from './env'

export const branchFinderConfig = {
  get defaultRadiusKm() {
    return env.BRANCH_FINDER_DEFAULT_RADIUS_KM
  },
  get maxRadiusKm() {
    return env.BRANCH_FINDER_MAX_RADIUS_KM
  },
}

export function buildRadii(min: number, max: number): number[] {
  const r = (max / min) ** (1 / 3)
  return [min, Math.round(min * r), Math.round(min * r * r), max]
}
