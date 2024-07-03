import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clearTokens, setTokens } from './utils/auth'
import { baseUrl } from './api/utils'
import { access } from 'fs'

export async function middleware(request: NextRequest) {
  const cookieJar = cookies()
  const accessToken = cookieJar.get('accessToken')
  const refreshToken = cookieJar.get('refreshToken')

  if (request.nextUrl.pathname !== '/login') {
    console.log('Not Login Nigga')
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

  if (request.nextUrl.pathname === '/login') {
    try {
      const user = await getAuthenticatedUser(accessToken?.value, refreshToken?.value)
      console.log('user', user)
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      clearTokens()
    }
  }
  return NextResponse.next()
}

const getAuthenticatedUser = async (accessToken?: string, refreshToken?: string) => {
  try {
    let response
    if (accessToken) {
      console.log('there is access token requesting')
      response = await fetch(`${baseUrl}auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }
    // If the access token is invalid, we try to refresh it
    if ((!accessToken || response?.status === 401) && refreshToken) {
      console.log('there is no access token requesting')
      const newAccessToken = await refreshTokens(refreshToken)
      const newResponse = await fetch(`${baseUrl}auth/me`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })

      if (!newResponse.ok) {
        throw new Error('Authentication failed')
      }

      return await newResponse.json()
    }

    if (!response?.ok) {
      throw new Error('Authentication failed')
    }

    return await response.json()
  } catch (error) {
    clearTokens()
    throw new Error('Authentication failed')
  }
}

const refreshTokens = async (refreshToken: string) => {
  try {
    const response = await fetch(`${baseUrl}auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    console.log('Response Status:', response.status)
    console.log('Response Headers:', response.headers)

    if (!response.ok) {
      console.log('Failed to refresh tokens. Status:', response.status)
      throw new Error('Authentication failed')
    }

    const body = await response.json()
    const accessToken = body.payload.accessToken
    const newRefreshToken = body.payload.refreshToken
    console.log('Response Body:', body)

    // Check if the tokens are in the response body
    if (accessToken && newRefreshToken) {
      console.log('Tokens received:', body)
      setTokens(accessToken, newRefreshToken)
      return accessToken
    } else {
      console.log('Tokens not found in the response body.')
      throw new Error('Authentication failed')
    }
  } catch (error) {
    console.error('Error refreshing tokens:', error)
    throw new Error('Authentication failed')
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)'],
}
