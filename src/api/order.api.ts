import { Order } from "./models/Order.model";
import { AbstractApi, ApiResponse } from "./utils";

export class OrdersApi extends AbstractApi<Order> {
    readonly path = 'orders'

    constructor() {
        super('orders')
    }

    async getOrders(): Promise<ApiResponse<Order[]>> {
        const response: ApiResponse<Order[]> = (await this.doFetch({
            requestOptions: {
                method: 'GET',
            },
        })) as ApiResponse<Order[]>

        return response
    }

    async createOrder(order: Order): Promise<ApiResponse<Order>> {
        const response : ApiResponse<Order> = (await this.doFetch({
            requestOptions: {
                method: 'POST',
                body: JSON.stringify(order),
            },
        })) as ApiResponse<Order>

        return response
    }

    async updateOrder(id: number, order: Partial<Order>): Promise<ApiResponse<Order>> {
        const response : ApiResponse<Order> = (await this.doFetch({
            requestOptions: {
                method: 'PUT',
                body: JSON.stringify(order),
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Order>

        return response
    }

    async deleteOrder(id: number): Promise<ApiResponse<Order>> {
        const response : ApiResponse<Order> = (await this.doFetch({
            requestOptions: {
                method: 'DELETE',
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Order>

        return response
    }
}