type Meta = { page: number; limit: number; total: number } | null

export const ok = <T>(data: T, meta: Meta = null) => ({
  data,
  error: null,
  meta,
})

export const paginated = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => ok(data, { page, limit, total })
