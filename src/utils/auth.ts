import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

export interface DecodedToken {
  exp: number
  iat: number
  sub: string
  role: string
  username: string
}

export const setTokens = (accessToken: string, refreshToken?: string) => {
  Cookies.set('accessToken', accessToken, { expires: 0.5 })
  if (!refreshToken) return
  Cookies.set('refreshToken', refreshToken, { expires: 7 })
}

export const setAccessToken = (accessToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 0.5 })
}

export const clearTokens = () => {
  Cookies.remove('accessToken')
  Cookies.remove('refreshToken')
}

export const getAuthenticatedUser = async () => {
  const accessToken = Cookies.get('accessToken')
  if (!accessToken) return null
  // decode access token
  const decodedToken = jwtDecode<DecodedToken>(accessToken)
  return decodedToken
}
