import { setTokens } from '@/utils/auth'
import { Tokens } from './models/Tokens.model'
import { User } from './models/User.model'
import { AbstractApi, ApiRequestParams, ApiResponse } from './utils'

export class AuthApi extends AbstractApi<User | Tokens> {
  readonly path = 'auth'

  constructor() {
    super('auth')
  }

  async login(username: string, password: string): Promise<ApiResponse<Tokens>> {
    const response: ApiResponse<Tokens> = (await this.doFetch({
      requestOptions: {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      pathExtension: 'login',
    }, false)) as ApiResponse<Tokens>

    return response
  }

  async getMe(token: string): Promise<ApiResponse<User>> {
    const response: ApiResponse<User> = (await this.doFetch({
      requestOptions: {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      pathExtension: 'me',
    })) as ApiResponse<User>

    return response
  }
}
