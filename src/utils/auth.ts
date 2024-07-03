import { AuthApi } from '@/api/auth.api'
import Cookies from 'js-cookie'

export const setTokens = (accessToken: string, refreshToken: string) => {
  console.log('setting access token')
  Cookies.set('accessToken', accessToken, { expires: 0.5 })
  console.log('setting refresh token')
  Cookies.set('refreshToken', refreshToken, { expires: 7 })
  console.log('tokens set')
}

export const clearTokens = () => {
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
}

export const getAuthenticatedUser = async (accessToken: string, refreshToken?: string) => {
  const authApi = new AuthApi()
  try {
    const response = await authApi.getMe(accessToken)
    return response.payload
  } catch (error) {
    clearTokens()
    throw new Error('Authentication failed')
  }
}
