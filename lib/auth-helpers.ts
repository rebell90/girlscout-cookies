import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session?.user?.id) {
    return null
  }

  return session.user
}