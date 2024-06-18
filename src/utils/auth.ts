import { AuthApi } from '@/api/auth.api'
import { ServerError } from '@/api/utils'
import Cookies from 'js-cookie'

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 0.5 })
  Cookies.set('refreshToken', refreshToken, { expires: 7 })
}

export const getAccessToken = () => {
  console.log("getAccessToken: ", Cookies.get())
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
    console.log("getAuthenticatedUser: checking access token")
    const response = await authApi.getMe(accessToken)
    console.log("getAuthenticatedUser: response: ", response)
    return response.payload
  } catch (error) {
    console.error('Error during getAuthenticatedUser call: ', error)
    if (error instanceof ServerError && error.status === 401 && refreshToken) {
      console.log("getAuthenticatedUser: refreshing token")
      try {
        const refreshResponse = await authApi.refreshTokens(refreshToken)
        console.log("getAuthenticatedUser: refreshResponse: ", refreshResponse)
        setTokens(refreshResponse.payload.accessToken, refreshResponse.payload.refreshToken)
        console.log("getAuthenticatedUser: getting user")
        const newToken = refreshResponse.payload.accessToken
        const userResponse = await authApi.getMe(newToken)
        console.log("getAuthenticatedUser: userResponse: ", userResponse)
        return userResponse.payload
      } catch (refreshError) {
        console.error('Error during token refresh: ', refreshError)
        clearTokens()
        throw new Error('Authentication failed')
      }
    } else {
      console.log("getAuthenticatedUser: clearing tokens")
      clearTokens()
      throw new Error('Authentication failed')
    }
  }
}
