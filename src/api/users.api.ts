import { Tokens } from './models/Tokens.model'
import { User } from './models/User.model'
import { AbstractApi, ApiResponse } from './utils'

export class UsersApi extends AbstractApi<User> {
  readonly path = 'users'

  constructor() {
    super('users')
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    const response: ApiResponse<User[]> = (await this.doFetch({
      requestOptions: {
        method: 'GET',
      },
    })) as ApiResponse<User[]>

    return response
  } 
}
