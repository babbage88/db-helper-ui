/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAppPermissionRequest } from '../models/CreateAppPermissionRequest';
import type { CreateAppPermissionResult } from '../models/CreateAppPermissionResult';
import type { CreateRolePermissionMappingRequest } from '../models/CreateRolePermissionMappingRequest';
import type { CreateRolePermissionMappingResponse } from '../models/CreateRolePermissionMappingResponse';
import type { DeleteRolePermissionMappingRequest } from '../models/DeleteRolePermissionMappingRequest';
import type { DeleteRolePermissionMappingResponse } from '../models/DeleteRolePermissionMappingResponse';
import type { GetAllAppPermissionsResponse } from '../models/GetAllAppPermissionsResponse';
import type { GetRolePermissionMappingsResponse } from '../models/GetRolePermissionMappingsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PermissionsCrudService {
    /**
     * Create New App Permission.
     * @param body
     * @returns CreateAppPermissionResult (empty)
     * @throws ApiError
     */
    public static createAppPermission(
        body?: CreateAppPermissionRequest,
    ): CancelablePromise<CreateAppPermissionResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/create/permission',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Returns all App Permissions
     * @returns GetAllAppPermissionsResponse (empty)
     * @throws ApiError
     */
    public static getAllAppPermissions(): CancelablePromise<GetAllAppPermissionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/permissions',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Map App Permission to User Role.
     * @param body
     * @returns CreateRolePermissionMappingResponse (empty)
     * @throws ApiError
     */
    public static createRolePermissionMapping(
        body?: CreateRolePermissionMappingRequest,
    ): CancelablePromise<CreateRolePermissionMappingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/roles/permission',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Remove App Permission from User Role.
     * @param body
     * @returns DeleteRolePermissionMappingResponse (empty)
     * @throws ApiError
     */
    public static deleteRolePermissionMapping(
        body?: DeleteRolePermissionMappingRequest,
    ): CancelablePromise<DeleteRolePermissionMappingResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/roles/permission',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Returns all App Permission Mappings (which roles have which permissions).
     * @param roleId Optional role ID filter.
     * @param roleName Optional role name filter.
     * @returns GetRolePermissionMappingsResponse (empty)
     * @throws ApiError
     */
    public static getAllAppPermissionMappings(
        roleId?: string,
        roleName?: string,
    ): CancelablePromise<Array<GetRolePermissionMappingsResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/roles/permission-mappings',
            query: {
                'roleId': roleId,
                'roleName': roleName,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
