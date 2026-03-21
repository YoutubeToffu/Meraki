import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getRequiredSession() {
  const session = await getSession()
  if (!session?.user) {
    throw new AuthError('Unauthorized')
  }
  return session
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  throw error
}
