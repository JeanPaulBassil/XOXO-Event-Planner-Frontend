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

  async updateClient(id: number, client: Partial<Client>): Promise<ApiResponse<Client>> {
    const response: ApiResponse<Client> = (await this.doFetch({
      requestOptions: {
        method: 'PUT',
        body: JSON.stringify(client),
      },
      pathExtension: id.toString(),
    })) as ApiResponse<Client>

    return response
  }
}
