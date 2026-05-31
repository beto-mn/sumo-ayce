import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const password = process.argv[2]
if (!password) {
  console.error('Usage: tsx server/scripts/hash-password.ts <password>')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const hash = (await scryptAsync(password, salt, 64)) as Buffer
console.log(`${salt}:${hash.toString('hex')}`)
