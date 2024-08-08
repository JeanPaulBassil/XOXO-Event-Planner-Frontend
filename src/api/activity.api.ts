import { Activity } from "./models/Activity.model";
import { AbstractApi, ApiResponse } from "./utils";

export class ActivitiesApi extends AbstractApi<Activity> {
    readonly path = 'activities'

    constructor() {
        super('activities')
    }

    async getActivities(): Promise<ApiResponse<Activity[]>> {
        const response: ApiResponse<Activity[]> = (await this.doFetch({
            requestOptions: {
                method: 'GET',
            },
        })) as ApiResponse<Activity[]>

        return response
    }

    async createActivity(activity: Activity): Promise<ApiResponse<Activity>> {
        const response : ApiResponse<Activity> = (await this.doFetch({
            requestOptions: {
                method: 'POST',
                body: JSON.stringify(activity),
            },
        })) as ApiResponse<Activity>

        return response
    }

    async updateActivity(id: number, activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
        const response : ApiResponse<Activity> = (await this.doFetch({
            requestOptions: {
                method: 'PUT',
                body: JSON.stringify(activity),
            },
            pathExtension: id.toString(),
        })) as ApiResponse<Activity>

        return response
    }
}