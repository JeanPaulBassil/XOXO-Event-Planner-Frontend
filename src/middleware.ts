import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser, clearTokens } from './utils/auth'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const cookieJar = cookies()
  const accessToken = cookieJar.get('accessToken')
  const refreshToken = cookieJar.get('refreshToken')

  console.log("requested in middleware:", request.nextUrl.pathname)

  if (request.nextUrl.pathname !== '/login') {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const user = await getAuthenticatedUser(accessToken.value, refreshToken?.value)
      if (!user) {
        clearTokens()
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      clearTokens()
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (request.nextUrl.pathname === '/login' && accessToken) {
    try {
      const user = await getAuthenticatedUser(accessToken.value, refreshToken?.value)
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      clearTokens()
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)',
  ],
}
