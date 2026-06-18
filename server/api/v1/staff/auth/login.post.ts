import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { and, eq } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setCookie } from 'h3'
import { z } from 'zod'
import { branches, staffSessions, staffUsers } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { AuthError, handleError } from '../../../../utils/error-handler'
import { checkRateLimit, resetRateLimit } from '../../../../utils/rate-limiter'
import { ok } from '../../../../utils/response'

const scryptAsync = promisify(scrypt)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedBuffer = (await scryptAsync(password, salt, 64)) as Buffer
  return timingSafeEqual(hashBuffer, derivedBuffer)
}

export default defineEventHandler(async event => {
  try {
    checkRateLimit(event, 'staff:login', 5, 15 * 60 * 1000)

    const body = await readValidatedBody(event, v => bodySchema.parse(v))

    const [user] = await db
      .select()
      .from(staffUsers)
      .where(
        and(eq(staffUsers.email, body.email), eq(staffUsers.isActive, true))
      )
      .limit(1)

    if (!user) throw new AuthError('Invalid credentials')

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) throw new AuthError('Invalid credentials')

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    await db.insert(staffSessions).values({
      staffUserId: user.id,
      token,
      expiresAt,
    })

    resetRateLimit(event, 'staff:login')

    setCookie(event, 'staff_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
    })

    const [branch] = await db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.id, user.branchId ?? ''))
      .limit(1)

    return ok({
      id: user.id,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
      branchName: branch?.name ?? null,
    })
  } catch (err) {
    throw handleError(err)
  }
})
