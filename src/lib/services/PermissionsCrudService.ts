/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppPermissionDao } from '../models/AppPermissionDao';
import type { CreateAppPermissionRequest } from '../models/CreateAppPermissionRequest';
import type { CreateRolePermissionMappingRequest } from '../models/CreateRolePermissionMappingRequest';
import type { GetAllAppPermissionsResponse } from '../models/GetAllAppPermissionsResponse';
import type { RolePermissionMappingDao } from '../models/RolePermissionMappingDao';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PermissionsCrudService {
    /**
     * Create New App Permission.
     * @param body
     * @returns AppPermissionDao (empty)
     * @throws ApiError
     */
    public static createAppPermission(
        body?: CreateAppPermissionRequest,
    ): CancelablePromise<AppPermissionDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/create/permission',
            body: body,
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
        });
    }
    /**
     * Map App Permission to User Role.
     * @param body
     * @returns RolePermissionMappingDao (empty)
     * @throws ApiError
     */
    public static createRolePermissionMapping(
        body?: CreateRolePermissionMappingRequest,
    ): CancelablePromise<RolePermissionMappingDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/roles/permission',
            body: body,
        });
    }
}
