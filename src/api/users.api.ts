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

  async createUser(username: string, password: string, role: string): Promise<ApiResponse<User>> {
    const response: ApiResponse<User> = (await this.doFetch({
      requestOptions: {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
      },
    })) as ApiResponse<User>

    return response
  }

  async deleteUser(id: string): Promise<ApiResponse<User>> {
    const response: ApiResponse<User> = (await this.doFetch({
      requestOptions: {
        method: 'DELETE',
      },
      pathExtension: id,
    })) as ApiResponse<User>

    return response
  }

  async editUser(id: string, username?: string, role?: string): Promise<ApiResponse<User>> {
    const response: ApiResponse<User> = (await this.doFetch({
      requestOptions: {
        method: 'PUT',
        body: JSON.stringify({ username, role }),
      },
      pathExtension: id,
    })) as ApiResponse<User>

    return response
  }
}
