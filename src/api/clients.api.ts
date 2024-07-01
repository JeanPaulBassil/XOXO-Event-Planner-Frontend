import { AbstractApi, ApiResponse } from './utils'
import { Client } from './models/Client.model'

export class ClientsApi extends AbstractApi<Client> {
  readonly path = 'clients'

  constructor() {
    super('clients')
  }

  async getClients(): Promise<ApiResponse<Client[]>> {
    const response: ApiResponse<Client[]> = (await this.doFetch({
      requestOptions: {
        method: 'GET',
      },
    })) as ApiResponse<Client[]>

    return response
  }

  async createClient(client: Client): Promise<ApiResponse<Client>> {
    const response: ApiResponse<Client> = (await this.doFetch({
      requestOptions: {
        method: 'POST',
        body: JSON.stringify(client),
      },
    })) as ApiResponse<Client>

    return response
  }

  //   async deleteUser(id: string): Promise<ApiResponse<User>> {
  //     const response: ApiResponse<User> = (await this.doFetch({
  //       requestOptions: {
  //         method: 'DELETE',
  //       },
  //       pathExtension: id,
  //     })) as ApiResponse<User>

  //     return response
  //   }

  //   async editUser(id: string, username?: string, role?: string): Promise<ApiResponse<User>> {
  //     const response: ApiResponse<User> = (await this.doFetch({
  //       requestOptions: {
  //         method: 'PUT',
  //         body: JSON.stringify({ username, role }),
  //       },
  //       pathExtension: id,
  //     })) as ApiResponse<User>

  //     return response
  //   }
}
