import { AbstractApi, ApiResponse } from './utils'
import { Event } from './models/Event.model'

export class EventsApi extends AbstractApi<Event> {
  readonly path = 'events'

  constructor() {
    super('events')
  }

  async getEvents(): Promise<ApiResponse<Event[]>> {
    const response: ApiResponse<Event[]> = (await this.doFetch({
      requestOptions: {
        method: 'GET',
      },
    })) as ApiResponse<Event[]>

    return response
  }

  async createEvent(event: Event): Promise<ApiResponse<Event>> {
    const response: ApiResponse<Event> = (await this.doFetch({
      requestOptions: {
        method: 'POST',
        body: JSON.stringify(event),
      },
    })) as ApiResponse<Event>

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

  async updateEvent(id: number, event: Partial<Event>): Promise<ApiResponse<Event>> {
    const response: ApiResponse<Event> = (await this.doFetch({
      requestOptions: {
        method: 'PUT',
        body: JSON.stringify(event),
      },
      pathExtension: id.toString(),
    })) as ApiResponse<Event>

    return response
  }
}
