import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser, clearTokens } from './utils/auth'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const cookieJar = cookies()
  const accessToken = cookieJar.get('accessToken')
  const refreshToken = cookieJar.get('refreshToken')

  console.log('Activated middleware')

  if (request.nextUrl.pathname === '/') {
    console.log('we are in /, checking token')
    console.log('token: ', accessToken)
    if (!accessToken) {
      console.log('no token, redirecting to /login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    console.log("token found, checking if it's valid")

    try {
      const user = await getAuthenticatedUser(accessToken.value, refreshToken?.value)
      if (!user) {
        console.log('no user, redirecting to /login')
        clearTokens()
        return NextResponse.redirect(new URL('/login', request.url))
      }

      console.log('user found, returning next')
    } catch (error) {
      console.error('Error during getAuthenticatedUser call: ', error)
      clearTokens()
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (request.nextUrl.pathname === '/login' && accessToken) {
    console.log('we are in /login, checking token')
    try {
      const user = await getAuthenticatedUser(accessToken.value, refreshToken?.value)
      if (user) {
        console.log('user found, redirecting to /')
        return NextResponse.redirect(new URL('/', request.url))
      }
      console.log('no user, returning next')
    } catch (error) {
      console.error('Error during getAuthenticatedUser call: ', error)
      clearTokens()
    }
  }

  console.log('returning next')
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login'],
}
