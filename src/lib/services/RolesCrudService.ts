/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserRoleRequest } from '../models/CreateUserRoleRequest';
import type { GetAllRolesResponse } from '../models/GetAllRolesResponse';
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
        });
    }
}
