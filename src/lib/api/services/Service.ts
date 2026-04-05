/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetRolePermissionMappingsResponse } from '../models/GetRolePermissionMappingsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
    /**
     * Returns all App Permission Mappings (which roles have which permissions).
     * @returns GetRolePermissionMappingsResponse (empty)
     * @throws ApiError
     */
    public static getAllAppPermissionMappings(): CancelablePromise<Array<GetRolePermissionMappingsResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/roles/permission-mappings',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
