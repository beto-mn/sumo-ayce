export const reservationTimeouts = {
  firstReminderMin: parseInt(
    process.env.RESERVATION_FIRST_REMINDER_MIN ?? '5',
    10
  ),
  escalationMin: parseInt(process.env.RESERVATION_ESCALATION_MIN ?? '5', 10),
  autoCancelMin: parseInt(process.env.RESERVATION_AUTO_CANCEL_MIN ?? '20', 10),
}
