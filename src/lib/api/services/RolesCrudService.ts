/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserRoleRequest } from '../models/CreateUserRoleRequest';
import type { GetAllRolesResponse } from '../models/GetAllRolesResponse';
import type { GetRolesPermissionCountResponse } from '../models/GetRolesPermissionCountResponse';
import type { SoftDeleteRoleByIdRequest } from '../models/SoftDeleteRoleByIdRequest';
import type { SoftDeleteRoleByIdResponse } from '../models/SoftDeleteRoleByIdResponse';
import type { UpdateUserRoleMappingRequest } from '../models/UpdateUserRoleMappingRequest';
import type { UpdateUserRoleMappingResponse } from '../models/UpdateUserRoleMappingResponse';
import type { UserRoleDao } from '../models/UserRoleDao';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RolesCrudService {
    /**
     * Create New User Role.
     * @param body
     * @returns UserRoleDao (empty)
     * @throws ApiError
     */
    public static createUserRole(
        body?: CreateUserRoleRequest,
    ): CancelablePromise<UserRoleDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/create/role',
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
     * Soft Delete Role by id.
     * @param body
     * @returns SoftDeleteRoleByIdResponse (empty)
     * @throws ApiError
     */
    public static softDeleteRoleById(
        body?: SoftDeleteRoleByIdRequest,
    ): CancelablePromise<SoftDeleteRoleByIdResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/role/delete',
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
     * Returns all active User Roles.
     * @returns GetAllRolesResponse (empty)
     * @throws ApiError
     */
    public static getAllUserRoles(): CancelablePromise<GetAllRolesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/roles',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get permission counts for all roles.
     * @returns GetRolesPermissionCountResponse (empty)
     * @throws ApiError
     */
    public static getRolesPermissionCounts(): CancelablePromise<GetRolesPermissionCountResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/roles/permission-counts',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update User Role Mapping
     * @param body
     * @returns UpdateUserRoleMappingResponse (empty)
     * @throws ApiError
     */
    public static updateUserRole(
        body?: UpdateUserRoleMappingRequest,
    ): CancelablePromise<UpdateUserRoleMappingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/role',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
