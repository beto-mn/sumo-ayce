import { env } from './env'

export const loyaltyConfig = {
  get pointsPerVisit() {
    return env.LOYALTY_POINTS_PER_VISIT
  },
  get velocityThreshold() {
    return env.LOYALTY_VELOCITY_THRESHOLD
  },
}
