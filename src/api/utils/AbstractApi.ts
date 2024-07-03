import { ApiResponse, ResponseError, ServerError } from '.'
import Cookies from 'js-cookie'
import { Tokens } from '../models/Tokens.model'

export const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3200/'

export interface ApiRequestParams {
  queries?: Record<string, string>
  requestOptions?: RequestInit
  pathExtension?: string
}

export abstract class AbstractApi<T> {
  readonly path: string

  constructor(path: string) {
    this.path = path
  }

  private async refreshTokens(refreshToken: string): Promise<string> {
    try {
      const response = await fetch(`${baseUrl}auth/refresh`, {
        cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new ServerError(errorBody as ResponseError)
      }

      const body: Tokens = await response.json()
      return body.accessToken
    } catch (error) {
      if (error instanceof ServerError) {
        throw error
      }

      if (error instanceof Error) {
        throw new ServerError({
          error: {
            message: error.message,
            name: error.name,
            response: error.message,
            status: error.name === 'TypeError' ? 500 : 400,
          },
          timestamp: new Date().getTime(),
        })
      }

      throw new ServerError({
        error: {
          message: 'An error occurred while fetching data',
          name: 'Error',
          response: 'An error occurred while fetching data',
          status: 400,
        },
        timestamp: new Date().getTime(),
      })
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
    const accessToken = Cookies.get('accessToken')
    const refreshToken = Cookies.get('refreshToken')

    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }

    let response = await fetch(url, options)

    if (response.status === 401) {
      if (refreshToken) {
        const newAccessToken = await this.refreshTokens(refreshToken)
        Cookies.set('accessToken', newAccessToken)
        if (newAccessToken) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          }
          response = await fetch(url, options)
        }
      }
    }

    return response
  }

  private async fetchWithoutAuth(url: string, options: RequestInit): Promise<Response> {
    return await fetch(url, options)
  }

  protected async doFetch(
    requestParams?: ApiRequestParams,
    secure: boolean = true
  ): Promise<ApiResponse<T | T[]>> {
    let url = `${baseUrl}${this.path}`

    if (requestParams && requestParams.pathExtension) {
      url += `/${requestParams.pathExtension}`
    }

    if (requestParams && requestParams.queries) {
      const query = new URLSearchParams(requestParams.queries)
      query.toString() && (url += `?${query.toString()}`)
    }

    try {
      const response = secure
        ? await this.fetchWithAuth(url, {
            ...requestParams?.requestOptions,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              ...(requestParams?.requestOptions?.headers ?? {}),
            },
            cache: 'no-store',
          })
        : await this.fetchWithoutAuth(url, {
            ...requestParams?.requestOptions,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              ...(requestParams?.requestOptions?.headers ?? {}),
            },
            cache: 'no-store',
          })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new ServerError(errorBody as ResponseError)
      }

      const body = await response.json()
      return { payload: body.payload, meta: body.meta }
    } catch (error) {
      if (error instanceof ServerError) {
        throw error
      }

      if (error instanceof Error) {
        throw new ServerError({
          error: {
            message: error.message,
            name: error.name,
            response: error.message,
            status: error.name === 'TypeError' ? 500 : 400,
          },
          timestamp: new Date().getTime(),
        })
      }

      throw new ServerError({
        error: {
          message: 'An error occurred while fetching data',
          name: 'Error',
          response: 'An error occurred while fetching data',
          status: 400,
        },
        timestamp: new Date().getTime(),
      })
    }
  }
}
