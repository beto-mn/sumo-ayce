import { and, asc, count, eq, isNull } from 'drizzle-orm'
import { defineEventHandler, getValidatedQuery } from 'h3'
import { ListReservationsQuerySchema } from '../../../types/reservations'
import { reservations } from '../../db/schema'
import { db } from '../../utils/db'
import { paginated } from '../../utils/response'

export default defineEventHandler(async event => {
  const query = await getValidatedQuery(event, v =>
    ListReservationsQuerySchema.parse(v)
  )

  const filters = [isNull(reservations.deletedAt)]

  if (query.branchId) filters.push(eq(reservations.branchId, query.branchId))
  if (query.status) filters.push(eq(reservations.status, query.status))
  if (query.reservationDate)
    filters.push(eq(reservations.reservationDate, query.reservationDate))

  const where = and(...filters)
  const offset = (query.page - 1) * query.limit

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(reservations)
      .where(where)
      .orderBy(
        asc(reservations.reservationDate),
        asc(reservations.reservationTime)
      )
      .limit(query.limit)
      .offset(offset),
    db.select({ count: count() }).from(reservations).where(where),
  ])

  const total = countResult[0]?.count ?? 0
  return paginated(rows, query.page, query.limit, Number(total))
})
