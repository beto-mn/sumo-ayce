import { env } from './env'

export const reservationTimeouts = {
  get firstReminderMin() {
    return env.RESERVATION_FIRST_REMINDER_MIN
  },
  get escalationMin() {
    return env.RESERVATION_ESCALATION_MIN
  },
  get autoCancelMin() {
    return env.RESERVATION_AUTO_CANCEL_MIN
  },
}
