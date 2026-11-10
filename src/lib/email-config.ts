import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

// AES-256-GCM. Key comes from ENCRYPTION_KEY, falling back to NEXTAUTH_SECRET.
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('ENCRYPTION_KEY or NEXTAUTH_SECRET must be set')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, enc].map((b) => b.toString('base64')).join('.')
}

export function decryptSecret(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export interface OrgMailer {
  client: Resend
  from: string
}

export const EMAIL_NOT_CONFIGURED_MESSAGE =
  'Email sending is not configured. Add your Resend API key and from address in Settings → Email.'

// Returns the organization's own Resend client and from address, or null if not configured.
export async function getOrgMailer(organizationId: string): Promise<OrgMailer | null> {
  const config = await prisma.emailConfig.findUnique({ where: { organizationId } })
  if (!config) return null
  const from = config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail
  return { client: new Resend(decryptSecret(config.apiKeyEnc)), from }
}
