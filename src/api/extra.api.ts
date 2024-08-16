import { Extra } from "./models/Extra.model";
import { AbstractApi, ApiResponse } from "./utils";

export class ExtrasApi extends AbstractApi<Extra> {
    readonly path = 'extras'

    constructor() {
        super('extras')
    }

    async getExtras(): Promise<ApiResponse<Extra[]>> {
        const response: ApiResponse<Extra[]> = (await this.doFetch({
            requestOptions: {
                method: 'GET',
            },
        })) as ApiResponse<Extra[]>

        return response
    }

    async createExtra(extra: Extra): Promise<ApiResponse<Extra>> {
        const response : ApiResponse<Extra> = (await this.doFetch({
            requestOptions: {
                method: 'POST',
                body: JSON.stringify(extra),
            },
        })) as ApiResponse<Extra>

        return response
    }

    async updateExtra(id: number, extra: Partial<Extra>): Promise<ApiResponse<Extra>> {
        const response : ApiResponse<Extra> = (await this.doFetch({
            requestOptions: {
                method: 'PUT',
                body: JSON.stringify(extra),
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Extra>

        return response
    }

    async deleteExtra(id: number): Promise<ApiResponse<Extra>> {
        const response : ApiResponse<Extra> = (await this.doFetch({
            requestOptions: {
                method: 'DELETE',
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Extra>

        return response
    }
}