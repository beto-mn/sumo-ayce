import { eq } from 'drizzle-orm'
import { defineEventHandler, getCookie, setCookie } from 'h3'
import { staffSessions } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { handleError } from '../../../../utils/error-handler'
import { ok } from '../../../../utils/response'

export default defineEventHandler(async event => {
  try {
    const token = getCookie(event, 'staff_session')

    if (token) {
      await db.delete(staffSessions).where(eq(staffSessions.token, token))
    }

    setCookie(event, 'staff_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return ok({ ok: true })
  } catch (err) {
    throw handleError(err)
  }
})
