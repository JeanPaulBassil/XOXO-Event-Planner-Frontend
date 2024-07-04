import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clearTokens, setTokens } from './utils/auth'
import { baseUrl } from './api/utils'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function middleware(request: NextRequest) {
  const cookieJar = cookies()
  const accessToken = cookieJar.get('accessToken')
  const refreshToken = cookieJar.get('refreshToken')

  const loginUrl = new URL('/login', request.nextUrl.origin)
  const appUrl = new URL('/', request.nextUrl.origin)

  const user = await getAuthenticatedUser(accessToken, refreshToken)

  if (request.nextUrl.pathname !== '/login') {
    if (!user) {
      return NextResponse.redirect(loginUrl.href)
    }
  }

  if (request.nextUrl.pathname === '/login') {
    if (user) {
      return NextResponse.redirect(appUrl.href)
    }
  }

  return NextResponse.next()
}

async function getAuthenticatedUser(
  accessToken: RequestCookie | undefined,
  refreshToken: RequestCookie | undefined
) {
  try {
    let currentAccessToken = accessToken?.value
    if (!currentAccessToken) {
      if (refreshToken) {
        currentAccessToken = await refreshTokens(refreshToken)
        if (!currentAccessToken) {
          clearTokens()
          return null
        }
      } else {
        return null
      }
    }

    let response = await fetch(`${baseUrl}auth/me`, {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
      },
    })

    if (response.status !== 200) {
      if (refreshToken) {
        currentAccessToken = await refreshTokens(refreshToken)
        if (!currentAccessToken) {
          clearTokens()
          return null
        }

        response = await fetch(`${baseUrl}auth/me`, {
          headers: {
            Authorization: `Bearer ${currentAccessToken}`,
          },
        })

        if (response.status !== 200) {
          clearTokens()
          return null
        }
      }
    }

    const data = await response.json()

    return data.payload
  } catch (error) {
    return null
  }
}

async function refreshTokens(refreshToken: RequestCookie) {
  try {
    const response = await fetch(`${baseUrl}auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    })

    const data = await response.json()
    const newAccessToken = data.payload.accessToken
    setTokens(newAccessToken, refreshToken.value)
    return newAccessToken
  } catch (error) {
    return undefined
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)'],
}
