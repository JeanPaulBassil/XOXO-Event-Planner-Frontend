import { AuthApi } from '@/api/auth.api'
import { ServerError } from '@/api/utils'
import Cookies from 'js-cookie'

export const setTokens = (accessToken: string, refreshToken: string, rememberMe = false) => {
  Cookies.set('accessToken', accessToken, { expires: 0.5 })
  if (!rememberMe) return
  Cookies.set('refreshToken', refreshToken, { expires: 7 })
}

export const getAccessToken = () => {
  return Cookies.get('accessToken')
}

export const getRefreshToken = () => {
  return Cookies.get('refreshToken')
}

export const clearTokens = () => {
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
}

export const isAuthenticated = () => {
  return !!getAccessToken()
}

const authApi = new AuthApi()

export const getAuthenticatedUser = async (accessToken: string, refreshToken?: string) => {
  try {
    const response = await authApi.getMe(accessToken)
    return response.payload
  } catch (error) {
    clearTokens()
    throw new Error('Authentication failed')
  }
}
