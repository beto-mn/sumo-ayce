import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { eq } from 'drizzle-orm'
import { branches, staffUsers } from '../db/schema'
import { db } from '../utils/db'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

async function main() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const index = args.indexOf(flag)
    return index !== -1 ? args[index + 1] : undefined
  }

  const name = get('--name')
  const email = get('--email')
  const password = get('--password')
  const role = get('--role') as 'staff' | 'admin' | 'owner' | undefined
  const branchId = get('--branch-id')

  if (!name || !email || !password || !role || !branchId) {
    console.error(
      'Usage: tsx server/scripts/create-staff-user.ts --name "Name" --email "email@sumo.com" --password "pass" --role staff|admin|owner --branch-id <uuid>'
    )
    process.exit(1)
  }

  const [branch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.id, branchId))
  if (!branch) {
    console.error(`Branch ${branchId} not found`)
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(staffUsers)
    .values({ name, email, role, branchId, passwordHash, isActive: true })
    .returning({
      id: staffUsers.id,
      email: staffUsers.email,
      role: staffUsers.role,
    })

  console.log('Staff user created:', user)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
