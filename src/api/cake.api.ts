import { Cake } from "./models/Cake.model";
import { AbstractApi, ApiResponse } from "./utils";

export class CakesApi extends AbstractApi<Cake> {
    readonly path = 'cakes'

    constructor() {
        super('cakes')
    }

    async getCakes(): Promise<ApiResponse<Cake[]>> {
        const response: ApiResponse<Cake[]> = (await this.doFetch({
            requestOptions: {
                method: 'GET',
            },
        })) as ApiResponse<Cake[]>

        return response
    }

    async createCake(cake: Cake): Promise<ApiResponse<Cake>> {
        const response : ApiResponse<Cake> = (await this.doFetch({
            requestOptions: {
                method: 'POST',
                body: JSON.stringify(cake),
            },
        })) as ApiResponse<Cake>

        return response
    }

    async updateCake(id: number, cake: Partial<Cake>): Promise<ApiResponse<Cake>> {
        const response : ApiResponse<Cake> = (await this.doFetch({
            requestOptions: {
                method: 'PUT',
                body: JSON.stringify(cake),
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Cake>

        return response
    }

    async deleteCake(id: number): Promise<ApiResponse<Cake>> {
        const response : ApiResponse<Cake> = (await this.doFetch({
            requestOptions: {
                method: 'DELETE',
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Cake>

        return response
    }
}